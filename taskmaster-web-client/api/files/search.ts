/**
 * Gemini File Search Query API
 * POST /api/files/search - Search user's documents using Gemini File Search
 * 
 * Returns structured results from user's knowledge base
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

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
    const { user_id, query, output_format, class_id } = req.body;

    if (!user_id || !query) {
      return res.status(400).json({ error: 'user_id and query required' });
    }

    // 1. Get user's file search store
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: store } = await supabase
      .from('file_search_stores')
      .select('store_name')
      .eq('user_id', user_id)
      .single();

    if (!store?.store_name) {
      return res.status(404).json({ 
        error: 'No document store found. Upload some documents first.',
        chunks: [],
        response: 'You haven\'t uploaded any documents yet. Upload syllabi, notes, or assignments to enable search.',
      });
    }

    // 2. Build the search prompt
    let systemInstruction = '';
    
    if (output_format === 'json') {
      systemInstruction = 'You must respond with valid JSON only. No markdown, no explanation.';
    } else if (output_format === 'flashcards') {
      systemInstruction = `Generate flashcards from the documents. Output as JSON array:
[{"front": "Question", "back": "Answer", "tags": ["topic"]}]`;
    } else if (output_format === 'schedule') {
      systemInstruction = `Extract all dates, deadlines, and events. Output as JSON array:
[{"date": "YYYY-MM-DD", "title": "Event name", "type": "exam|assignment|quiz|other"}]`;
    }

    // 3. Query with File Search tool
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: query }]
          }],
          tools: [{
            fileSearch: {
              fileSearchStoreNames: [store.store_name],
            }
          }],
          systemInstruction: systemInstruction ? {
            parts: [{ text: systemInstruction }]
          } : undefined,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini search failed:', response.status, errorText);
      
      // Fallback to 2.0-flash if 2.5 fails
      const fallbackResponse = await fetch(
        `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: query }]
            }],
            tools: [{
              fileSearch: {
                fileSearchStoreNames: [store.store_name],
              }
            }],
            systemInstruction: systemInstruction ? {
              parts: [{ text: systemInstruction }]
            } : undefined,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!fallbackResponse.ok) {
        throw new Error(`Search failed: ${fallbackResponse.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      return formatResponse(fallbackData, res, output_format);
    }

    const data = await response.json();
    return formatResponse(data, res, output_format);

  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Format the Gemini response based on requested output format
 */
function formatResponse(data: any, res: VercelResponse, output_format?: string) {
  const candidate = data.candidates?.[0];
  const content = candidate?.content;
  const text = content?.parts?.[0]?.text || '';

  // Extract grounding metadata (sources)
  const groundingMetadata = candidate?.groundingMetadata;
  const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    source: chunk.retrievedContext?.uri || chunk.web?.uri,
    title: chunk.retrievedContext?.title || chunk.web?.title,
  })) || [];

  // Try to parse JSON if format requested
  let parsedData = null;
  if (output_format === 'json' || output_format === 'flashcards' || output_format === 'schedule') {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Could not parse JSON from response');
    }
  }

  return res.status(200).json({
    response: text,
    data: parsedData,
    sources,
    model: 'gemini-file-search',
  });
}
