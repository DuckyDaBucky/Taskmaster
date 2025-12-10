/**
 * Gemini Chat API
 * POST /api/gemini/chat
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  try {
    const { message, systemPrompt, context } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build conversation
    let fullMessage = '';
    if (systemPrompt) {
      fullMessage += systemPrompt + '\n\n';
    }
    if (context) {
      fullMessage += 'Context:\n' + context + '\n\n';
    }
    fullMessage += 'User: ' + message;

    // Gemini API - using gemini-pro model (more stable)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: fullMessage }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      const errorMsg = data.error?.message || `API error ${response.status}`;
      return res.status(500).json({ error: errorMsg });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('No text in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    return res.status(200).json({ response: text });

  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
