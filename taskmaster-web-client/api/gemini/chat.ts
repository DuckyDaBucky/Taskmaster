/**
 * Gemini Chat API
 * POST /api/gemini/chat
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const { message, systemPrompt, context } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });

    let prompt = systemPrompt || 'You are a helpful assistant.';
    if (context) prompt += '\n\nContext:\n' + context;
    prompt += '\n\nUser: ' + message;

    // Use v1beta with gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.error?.message || `Error ${response.status}`;
      return res.status(500).json({ error: msg });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'Empty response' });

    return res.status(200).json({ response: text });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
