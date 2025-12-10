/**
 * Gemini Embeddings API
 * Vercel Serverless Function
 * 
 * Generates embeddings for text using Gemini
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const { text, texts } = req.body;
    
    // Handle single text or array
    const inputTexts = texts || (text ? [text] : []);
    
    if (inputTexts.length === 0) {
      return res.status(400).json({ error: 'No text provided' });
    }

    // Gemini embedding model
    const model = 'models/embedding-001';
    const url = `${GEMINI_API_URL}/${model}:embedContent?key=${apiKey}`;

    // Process embeddings (Gemini does one at a time)
    const embeddings: number[][] = [];
    
    for (const inputText of inputTexts) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          content: {
            parts: [{ text: inputText }],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
      }

      const data = await response.json();
      embeddings.push(data.embedding.values);
    }

    return res.status(200).json({ 
      embeddings,
      model,
      dimensions: embeddings[0]?.length || 768,
    });

  } catch (error: any) {
    console.error('Gemini embed error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate embeddings' });
  }
}

