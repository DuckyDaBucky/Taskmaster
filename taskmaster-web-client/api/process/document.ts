/**
 * Document Processing API
 * POST /api/process/document
 * 
 * Extracts text from uploaded files, chunks it, generates embeddings,
 * and stores in pgvector for RAG search.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CHUNK_SIZE = 500; // tokens approx
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB max for Gemini

// Only create client if we have credentials
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check environment variables
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }
  
  if (!supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured', 
      details: {
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_KEY
      }
    });
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
      throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    // Check file size before processing
    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 3. Extract text using Gemini
    const fileBuffer = await fileResponse.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    
    // Get MIME type - handle edge cases for document types
    let mimeType = fileResponse.headers.get('content-type') || 'application/pdf';
    
    // Fix MIME type based on file extension from URL if needed
    const urlLower = file_url.toLowerCase();
    const isDocFile = urlLower.endsWith('.doc') || urlLower.endsWith('.docx') || 
                      mimeType.includes('msword') || mimeType.includes('wordprocessingml');
    
    if (urlLower.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (urlLower.endsWith('.txt') || urlLower.endsWith('.md')) {
      mimeType = 'text/plain';
    } else if (urlLower.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    }
    
    console.log(`Processing file: ${file_url}, MIME type: ${mimeType}, Size: ${fileBuffer.byteLength} bytes, isDoc: ${isDocFile}`);

    let extractedText: string;
    
    // For .doc/.docx files, use Gemini File API (supports more formats)
    if (isDocFile) {
      // Upload to Gemini File API first
      const uploadResponse = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': mimeType.includes('docx') 
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/msword',
            'X-Goog-Upload-Protocol': 'raw',
          },
          body: Buffer.from(fileBuffer),
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Gemini File Upload error:', uploadResponse.status, errorText);
        throw new Error(`Failed to upload file to Gemini: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const fileUri = uploadData.file?.uri;
      
      if (!fileUri) {
        console.error('No file URI returned:', uploadData);
        throw new Error('Failed to get file URI from Gemini');
      }

      console.log('Uploaded to Gemini, URI:', fileUri);

      // Now use the file URI for text extraction
      const extractResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { file_data: { file_uri: fileUri, mime_type: mimeType.includes('docx') 
                  ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  : 'application/msword' } },
                { text: 'Extract ALL text from this document. Return only the raw text content, no commentary.' }
              ]
            }],
            generationConfig: { maxOutputTokens: 8192 },
          }),
        }
      );

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('Gemini API error:', extractResponse.status, errorText);
        throw new Error(`Gemini API error: ${extractResponse.status}`);
      }

      const extractData = await extractResponse.json();
      
      if (extractData.error) {
        console.error('Gemini returned error:', extractData.error);
        throw new Error(`Gemini error: ${extractData.error.message || 'Unknown error'}`);
      }
      
      extractedText = extractData.candidates?.[0]?.content?.parts?.[0]?.text;
    } else {
      // For PDFs, images, text - use inline_data directly
      const extractResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('Gemini API error:', extractResponse.status, errorText);
        throw new Error(`Gemini API error: ${extractResponse.status}`);
      }

      const extractData = await extractResponse.json();
      
      if (extractData.error) {
        console.error('Gemini returned error:', extractData.error);
        throw new Error(`Gemini error: ${extractData.error.message || 'Unknown error'}`);
      }
      
      extractedText = extractData.candidates?.[0]?.content?.parts?.[0]?.text;
    }

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

    // 7. Extract structured information and generate summary
    const analysisResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Extract ALL key information from this document and provide:

1. Document Type: syllabus, homework, assignment, project, exam, quiz, textbook, lecture_notes, class_material, study_guide, or misc
2. Course Number: (e.g., CS3305, MATH2413, ECS2390)
3. Course Title: (full course name)
4. Semester: (e.g., Fall 2024, Spring 2025)
5. Professor: (professor name if mentioned)
6. Due Date: (if this is an assignment/homework)
7. Key Topics: (comma-separated list of main topics)
8. Summary: (2-3 sentence overview)

Document text:
${extractedText.slice(0, 6000)}

Respond ONLY with valid JSON:
{
  "classification": "...",
  "course_number": "...",
  "course_title": "...",
  "semester": "...",
  "professor": "...",
  "due_date": "...",
  "topics": ["...", "..."],
  "summary": "..."
}` 
            }]
          }],
          generationConfig: { 
            maxOutputTokens: 1024,
            temperature: 0.2
          },
        }),
      }
    );

    const analysisData = await analysisResponse.json();
    const analysisText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Parse extracted information
    let summary = '';
    let classification = document_type || 'misc';
    let courseNumber = null;
    let courseTitle = null;
    let semester = null;
    let professorName = null;
    let dueDate = null;
    let topics: string[] = [];
    
    try {
      // Extract JSON from response (might be wrapped in markdown code blocks)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || '';
        classification = parsed.classification || classification;
        courseNumber = parsed.course_number || null;
        courseTitle = parsed.course_title || null;
        semester = parsed.semester || null;
        professorName = parsed.professor || null;
        dueDate = parsed.due_date || null;
        topics = parsed.topics || [];
      } else {
        summary = analysisText.slice(0, 500);
      }
    } catch (e) {
      console.error('Failed to parse analysis:', e);
      summary = analysisText.slice(0, 500);
    }

    // 8. Update resource with ALL extracted information
    const updateData: any = { 
      processing_status: 'completed',
      summary,
      classification,
      chunk_count: chunks.length,
      verified_course_number: courseNumber,
      semester,
      professor_name: professorName,
      course_metadata: {
        course_title: courseTitle,
        due_date: dueDate,
        topics,
        extracted_at: new Date().toISOString()
      }
    };

    // If we extracted course info, mark as verified (no longer need Nebula)
    if (courseNumber) {
      updateData.verification_status = 'verified';
    }

    await supabase
      .from('resources')
      .update(updateData)
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
