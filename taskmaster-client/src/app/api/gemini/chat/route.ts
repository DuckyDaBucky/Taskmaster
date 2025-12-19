import { NextRequest, NextResponse } from 'next/server';

/**
 * Gemini Chat API
 * POST /api/gemini/chat
 * 
 * Tries multiple models with fallback
 */

const MODELS = [
  'gemini-2.5-flash',      // Newest, free tier
  'gemini-2.0-flash',      // Stable, free tier
  'gemini-2.0-flash-lite', // Cheapest fallback
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { message, systemPrompt, conversationHistory } = body || {};
  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  // Build conversation with history
  let prompt = systemPrompt || 'You are a helpful assistant.';
  
  // Add conversation history if provided
  if (conversationHistory && Array.isArray(conversationHistory)) {
    prompt += '\n\nCONVERSATION HISTORY:\n';
    conversationHistory.forEach((msg: any) => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
    prompt += '\n';
  }
  
  prompt += `User: ${message}`;

  // Try each model until one works
  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });

      const data = await response.json();

      // If rate limited, try next model
      if (response.status === 429 || data.error?.message?.includes('quota')) {
        console.log(`Model ${model} rate limited, trying next...`);
        continue;
      }

      if (!response.ok) {
        console.log(`Model ${model} error:`, data.error?.message);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return NextResponse.json({ response: text, model });
      }
    } catch (e) {
      console.log(`Model ${model} failed:`, e);
      continue;
    }
  }

  return NextResponse.json({ 
    error: 'All models rate limited. Wait a minute or create a new API key at https://aistudio.google.com/app/apikey' 
  }, { status: 429 });
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
