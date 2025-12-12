/**
 * Document Processing API
 * POST /api/process/document
 * 
 * Extracts text from uploaded files, chunks it, generates embeddings,
 * and stores in pgvector for RAG search.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CHUNK_SIZE = 500; // tokens approx

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  try {
    const { resource_id, user_id, file_url, document_type, class_id } = req.body;

    if (!resource_id || !user_id || !file_url) {
      return res.status(400).json({ error: 'resource_id, user_id, and file_url required' });
    }

    // 1. Update status to processing
    await supabase
      .from('resources')
      .update({ processing_status: 'processing' })
      .eq('id', resource_id);

    // 2. Fetch the file
    const fileResponse = await fetch(file_url);
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch file');
    }

    // 3. Extract text using Gemini Vision (works for PDFs, images, docs)
    const fileBuffer = await fileResponse.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const mimeType = fileResponse.headers.get('content-type') || 'application/pdf';

    const extractResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                inline_data: { 
                  mime_type: mimeType, 
                  data: base64File 
                } 
              },
              { 
                text: 'Extract ALL text from this document. Return only the raw text content, no commentary.' 
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
      }
    );

    const extractData = await extractResponse.json();
    const extractedText = extractData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('Failed to extract text from document');
    }

    // 4. Chunk the text
    const chunks = chunkText(extractedText, CHUNK_SIZE);

    // 5. Generate embeddings for each chunk
    const embeddedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      embeddedChunks.push({
        user_id,
        resource_id,
        class_id: class_id || null,
        document_type: document_type || 'other',
        chunk_index: i,
        content: chunks[i],
        embedding,
        metadata: { original_length: chunks[i].length }
      });
    }

    // 6. Store in document_chunks
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(embeddedChunks);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to store chunks');
    }

    // 7. Generate summary and classification
    const analysisResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Analyze this document and provide:
1. A 2-3 sentence summary
2. Classification (choose ONE): syllabus, homework, assignment, project, exam, quiz, textbook, lecture_notes, class_material, study_guide, or misc

Document text:
${extractedText.slice(0, 4000)}

Respond in JSON format: {"summary": "...", "classification": "..."}` 
            }]
          }],
          generationConfig: { 
            maxOutputTokens: 512,
            temperature: 0.3
          },
        }),
      }
    );

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Try to parse JSON response, fallback to defaults
    let summary = '';
    let classification = document_type || 'misc';
    
    try {
      // Extract JSON from response (might be wrapped in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || '';
        classification = parsed.classification || classification;
      } else {
        summary = analysisText.slice(0, 500);
      }
    } catch (e) {
      console.error('Failed to parse analysis:', e);
      summary = analysisText.slice(0, 500);
    }

    // 8. Update resource with summary, classification, and status
    await supabase
      .from('resources')
      .update({ 
        processing_status: 'completed',
        summary,
        classification,
        chunk_count: chunks.length
      })
      .eq('id', resource_id);

    // 9. Check if user allows sharing, if so copy to shared_chunks
    const { data: userData } = await supabase
      .from('users')
      .select('allow_data_sharing')
      .eq('id', user_id)
      .single();

    if (userData?.allow_data_sharing) {
      // Get class info for subject/number
      let classSubject = null;
      let classNumber = null;
      
      if (class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', class_id)
          .single();
        
        if (classData?.name) {
          // Try to parse "CS 2340" format
          const match = classData.name.match(/^([A-Z]{2,4})\s*(\d{4})/i);
          if (match) {
            classSubject = match[1].toUpperCase();
            classNumber = match[2];
          }
        }
      }

      // Insert anonymized chunks to shared knowledge
      const sharedChunks = embeddedChunks.map(c => ({
        source_type: c.document_type,
        class_subject: classSubject,
        class_number: classNumber,
        content: c.content,
        embedding: c.embedding,
      }));

      await supabase.from('shared_chunks').insert(sharedChunks);
    }

    return res.status(200).json({ 
      success: true,
      chunks: chunks.length,
      summary 
    });

  } catch (error: any) {
    console.error('Document processing error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Update status to failed with error message
    if (req.body?.resource_id) {
      await supabase
        .from('resources')
        .update({ 
          processing_status: 'failed',
          summary: `Processing failed: ${error.message}`
        })
        .eq('id', req.body.resource_id);
    }

    return res.status(500).json({ 
      error: error.message,
      details: error.toString()
    });
  }
}

// Split text into chunks of approximately `size` tokens
function chunkText(text: string, size: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current: string[] = [];
  
  for (const word of words) {
    current.push(word);
    // Rough estimate: 1 token ≈ 0.75 words
    if (current.length >= size * 0.75) {
      chunks.push(current.join(' '));
      current = [];
    }
  }
  
  if (current.length > 0) {
    chunks.push(current.join(' '));
  }
  
  return chunks;
}

// Generate embedding using Gemini
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
      }),
    }
  );

  const data = await response.json();
  return data.embedding?.values || [];
}
