import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

/**
 * Azure Chat API (Replaces Gemini)
 * POST /api/chat
 */

const AOAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AOAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AOAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano';
const AOAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

export async function POST(req: NextRequest) {
    if (!AOAI_ENDPOINT || !AOAI_API_KEY) {
        return NextResponse.json({ error: 'Azure OpenAI not configured' }, { status: 500 });
    }

    const client = new AzureOpenAI({
        endpoint: AOAI_ENDPOINT,
        apiKey: AOAI_API_KEY,
        apiVersion: AOAI_API_VERSION,
        deployment: AOAI_DEPLOYMENT,
    });

    try {
        const { message, systemPrompt, conversationHistory } = await req.json();

        const messages = [
            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
            ...(conversationHistory || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        const response = await client.chat.completions.create({
            messages: messages as any,
            model: AOAI_DEPLOYMENT,
            max_completion_tokens: 1000,
        });

        return NextResponse.json({
            response: response.choices[0].message.content,
            model: AOAI_DEPLOYMENT
        });

    } catch (error: any) {
        console.error('Azure Chat Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
