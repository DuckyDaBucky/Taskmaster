/**
 * Document Analysis API
 * POST /api/documents/analyze
 * 
 * Analyzes uploaded documents using Gemini's native document understanding.
 * Extracts metadata, summaries, and structured data.
 * 
 * This is a simplified approach that:
 * 1. Fetches document from Supabase Storage URL
 * 2. Sends to Gemini for analysis (PDF native vision)
 * 3. Updates resource record with extracted data
 * 
 * Works reliably on Vercel with 60s Pro timeout or 10s Hobby.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Vercel config for longer timeout (Pro plan)
export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { resource_id, user_id, file_url, file_name } = req.body;

    if (!resource_id || !file_url) {
      return res.status(400).json({ error: 'resource_id and file_url required' });
    }

    // Update status to processing
    if (supabase) {
      await supabase
        .from('resources')
        .update({ processing_status: 'processing' })
        .eq('id', resource_id);
    }

    // Determine file type from URL
    const urlLower = file_url.toLowerCase();
    const isPdf = urlLower.includes('.pdf');
    const isImage = /\.(jpg|jpeg|png|gif|webp)/.test(urlLower);
    const isText = /\.(txt|md|csv)/.test(urlLower);

    let analysisResult: any = null;

    if (isPdf) {
      // Use Gemini's native PDF understanding
      analysisResult = await analyzePdfWithGemini(file_url, file_name);
    } else if (isImage) {
      // Use Gemini's image understanding
      analysisResult = await analyzeImageWithGemini(file_url, file_name);
    } else if (isText) {
      // Fetch and analyze text content
      analysisResult = await analyzeTextWithGemini(file_url, file_name);
    } else {
      // Generic document - try as PDF first, fallback to text
      try {
        analysisResult = await analyzePdfWithGemini(file_url, file_name);
      } catch {
        analysisResult = await analyzeTextWithGemini(file_url, file_name);
      }
    }

    // Update resource with extracted data
    if (supabase && analysisResult) {
      await supabase
        .from('resources')
        .update({
          processing_status: 'complete',
          ai_summary: analysisResult.summary || null,
          extracted_data: {
            document_type: analysisResult.document_type,
            course_number: analysisResult.course_number,
            course_name: analysisResult.course_name,
            professor: analysisResult.professor,
            key_topics: analysisResult.key_topics,
            due_dates: analysisResult.due_dates,
            analyzed_at: new Date().toISOString(),
          },
        })
        .eq('id', resource_id);
    }

    return res.status(200).json({
      success: true,
      resource_id,
      analysis: analysisResult,
    });

  } catch (error: any) {
    console.error('Document analysis error:', error);

    // Mark as failed
    if (supabase && req.body?.resource_id) {
      await supabase
        .from('resources')
        .update({ processing_status: 'failed' })
        .eq('id', req.body.resource_id);
    }

    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
}

/**
 * Analyze PDF using Gemini's native document understanding
 */
async function analyzePdfWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  // Fetch PDF as bytes
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');

  // Call Gemini with inline PDF data
  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: ANALYSIS_PROMPT,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error('Gemini PDF analysis failed:', errorText);
    throw new Error(`Gemini API error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  return parseGeminiResponse(data);
}

/**
 * Analyze image using Gemini vision
 */
async function analyzeImageWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');
  
  // Detect MIME type
  let mimeType = 'image/jpeg';
  if (fileUrl.toLowerCase().includes('.png')) mimeType = 'image/png';
  else if (fileUrl.toLowerCase().includes('.webp')) mimeType = 'image/webp';
  else if (fileUrl.toLowerCase().includes('.gif')) mimeType = 'image/gif';

  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
            {
              text: ANALYSIS_PROMPT,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini API error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  return parseGeminiResponse(data);
}

/**
 * Analyze text file content
 */
async function analyzeTextWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch text: ${response.status}`);
  }

  const textContent = await response.text();

  // Limit text length to avoid token limits
  const truncatedText = textContent.slice(0, 50000);

  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Document content:\n\n${truncatedText}\n\n---\n\n${ANALYSIS_PROMPT}`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini API error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  return parseGeminiResponse(data);
}

/**
 * Parse Gemini response and extract JSON
 */
function parseGeminiResponse(data: any): any {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse JSON from Gemini response');
  }

  // Fallback: return raw summary
  return {
    summary: text.slice(0, 500),
    document_type: 'other',
  };
}

/**
 * Analysis prompt for document extraction
 */
const ANALYSIS_PROMPT = `Analyze this document and extract information. Return ONLY valid JSON (no markdown, no explanation):

{
  "summary": "2-3 sentence summary of the document",
  "document_type": "syllabus|assignment|notes|exam|lecture|project|other",
  "course_number": "e.g. CS3305 or null if not found",
  "course_name": "full course name or null",
  "professor": "professor name or null",
  "key_topics": ["topic1", "topic2", "topic3"],
  "due_dates": [
    {"date": "YYYY-MM-DD or description", "description": "what is due"}
  ]
}

If a field cannot be determined, use null for strings or empty array for arrays.`;
