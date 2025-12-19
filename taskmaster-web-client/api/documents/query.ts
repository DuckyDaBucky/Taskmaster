/**
 * Document Query API
 * POST /api/documents/query
 * 
 * Query user's documents using Gemini with context from their resources.
 * This is a simpler approach than File Search - we fetch recent summaries
 * and use them as context for answering questions.
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

export const config = {
  maxDuration: 30,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { user_id, query, class_id, output_format } = req.body;

    if (!user_id || !query) {
      return res.status(400).json({ error: 'user_id and query required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Fetch user's processed resources with extracted data
    let resourceQuery = supabase
      .from('resources')
      .select('id, title, ai_summary, extracted_data, classification, created_at')
      .eq('user_id', user_id)
      .eq('processing_status', 'complete')
      .order('created_at', { ascending: false })
      .limit(20);

    if (class_id) {
      resourceQuery = resourceQuery.eq('class_id', class_id);
    }

    const { data: resources, error } = await resourceQuery;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }

    if (!resources || resources.length === 0) {
      return res.status(200).json({
        response: "You haven't uploaded any documents yet. Upload syllabi, notes, or assignments to enable document-based queries.",
        sources: [],
      });
    }

    // Build context from resources
    const context = resources.map(r => {
      const extracted = r.extracted_data || {};
      return `
Document: ${r.title}
Type: ${extracted.document_type || r.classification || 'unknown'}
Course: ${extracted.course_number || 'N/A'} - ${extracted.course_name || 'N/A'}
Professor: ${extracted.professor || 'N/A'}
Summary: ${r.ai_summary || 'No summary available'}
Topics: ${(extracted.key_topics || []).join(', ') || 'N/A'}
Due Dates: ${(extracted.due_dates || []).map((d: any) => `${d.date}: ${d.description}`).join('; ') || 'None found'}
---`;
    }).join('\n');

    // Build system instruction based on output format
    let systemInstruction = '';
    if (output_format === 'flashcards') {
      systemInstruction = `Generate flashcards from the documents. Return ONLY valid JSON array:
[{"front": "Question text", "back": "Answer text", "tags": ["topic"]}]`;
    } else if (output_format === 'schedule') {
      systemInstruction = `Extract all dates, deadlines, and events. Return ONLY valid JSON array:
[{"date": "YYYY-MM-DD", "title": "Event name", "type": "exam|assignment|quiz|lecture|other", "course": "course number"}]`;
    } else if (output_format === 'json') {
      systemInstruction = 'Return your response as valid JSON only. No markdown, no explanation.';
    } else {
      systemInstruction = `You are a helpful study assistant. Answer questions based on the user's uploaded documents.
Be specific and reference the documents when relevant. If the information isn't in the documents, say so.`;
    }

    // Query Gemini with context
    const geminiResponse = await fetch(
      `${GEMINI_API_URL}/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [{
            parts: [{
              text: `User's uploaded documents:\n${context}\n\nUser query: ${query}`,
            }],
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini query failed:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const data = await geminiResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON for structured outputs
    let parsedData = null;
    if (output_format === 'flashcards' || output_format === 'schedule' || output_format === 'json') {
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Could not parse JSON from response');
      }
    }

    // Return sources (document titles used)
    const sources = resources.slice(0, 5).map(r => ({
      id: r.id,
      title: r.title,
      type: r.extracted_data?.document_type || r.classification,
    }));

    return res.status(200).json({
      response: responseText,
      data: parsedData,
      sources,
      document_count: resources.length,
    });

  } catch (error: any) {
    console.error('Query error:', error);
    return res.status(500).json({ error: error.message || 'Query failed' });
  }
}
