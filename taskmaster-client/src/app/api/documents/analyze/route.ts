import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Document Analysis API
 * POST /api/documents/analyze
 * 
 * Analyzes uploaded documents using Gemini's native document understanding.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { resource_id, user_id, file_url, file_name } = body;

  if (!resource_id || !file_url) {
    return NextResponse.json({ error: 'resource_id and file_url required' }, { status: 400 });
  }

  try {
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
      analysisResult = await analyzePdfWithGemini(file_url, file_name);
    } else if (isImage) {
      analysisResult = await analyzeImageWithGemini(file_url, file_name);
    } else if (isText) {
      analysisResult = await analyzeTextWithGemini(file_url, file_name);
    } else {
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

    return NextResponse.json({
      success: true,
      resource_id,
      analysis: analysisResult,
    });

  } catch (error: any) {
    console.error('Document analysis error:', error);

    if (supabase && resource_id) {
      await supabase
        .from('resources')
        .update({ processing_status: 'failed' })
        .eq('id', resource_id);
    }

    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}

async function analyzePdfWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');

  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            },
            {
              text: `Analyze this document and extract structured information.
Return a JSON object with these fields:
{
  "document_type": "syllabus|assignment|notes|exam|article|other",
  "course_number": "e.g., CS 101",
  "course_name": "e.g., Introduction to Computer Science",
  "professor": "instructor name if found",
  "summary": "2-3 sentence summary of main content",
  "key_topics": ["topic1", "topic2", ...],
  "due_dates": [{"date": "YYYY-MM-DD", "description": "what is due"}]
}
Only return valid JSON, no markdown.`,
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
    throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
  }

  const data = await geminiResponse.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse PDF analysis JSON');
  }

  return { summary: text, document_type: 'unknown' };
}

async function analyzeImageWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const base64Data = Buffer.from(buffer).toString('base64');
  
  const contentType = response.headers.get('content-type') || 'image/jpeg';

  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: contentType,
                data: base64Data,
              },
            },
            {
              text: `Analyze this image and describe its content. If it's a document, extract key information.
Return JSON: {"summary": "description", "document_type": "image|diagram|screenshot|document", "key_topics": []}`,
            },
          ],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini image analysis error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse image analysis JSON');
  }

  return { summary: text, document_type: 'image' };
}

async function analyzeTextWithGemini(fileUrl: string, fileName?: string): Promise<any> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch text file: ${response.status}`);
  }

  const text = await response.text();
  
  const geminiResponse = await fetch(
    `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this text document and extract structured information.

DOCUMENT CONTENT:
${text.substring(0, 30000)}

Return JSON: {"summary": "2-3 sentences", "document_type": "notes|article|other", "key_topics": []}`,
          }],
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!geminiResponse.ok) {
    throw new Error(`Gemini text analysis error: ${geminiResponse.status}`);
  }

  const data = await geminiResponse.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse text analysis JSON');
  }

  return { summary: responseText, document_type: 'text' };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
