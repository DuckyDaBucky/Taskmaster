/**
 * RAG Search API
 * POST /api/search/rag
 * 
 * Searches user's documents + shared knowledge using vector similarity
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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
    const { query, user_id, limit = 5, include_shared = true } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query required' });
    }

    // 1. Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Search user's documents
    const { data: userChunks, error: userError } = await supabase.rpc(
      'match_user_documents',
      {
        query_embedding: queryEmbedding,
        match_user_id: user_id,
        match_threshold: 0.7,
        match_count: limit
      }
    );

    // 3. Search shared knowledge if allowed
    let sharedChunks: any[] = [];
    if (include_shared) {
      const { data } = await supabase.rpc(
        'match_shared_documents',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit
        }
      );
      sharedChunks = data || [];
    }

    // 4. Combine and deduplicate results
    const allChunks = [
      ...(userChunks || []).map((c: any) => ({ ...c, source: 'user' })),
      ...sharedChunks.map((c: any) => ({ ...c, source: 'shared' }))
    ];

    // Sort by similarity
    allChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    // Take top results
    const topChunks = allChunks.slice(0, limit);

    // Build context string for LLM
    const context = topChunks
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    return res.status(200).json({
      chunks: topChunks,
      context,
      total: allChunks.length
    });

  } catch (error: any) {
    console.error('RAG search error:', error);
    return res.status(500).json({ error: error.message });
  }
}

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

