import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

/**
 * Azure Chat API - TaskMaster AI Assistant
 * POST /api/chat
 * 
 * Powered by GPT-5.2 on Azure OpenAI
 */

const AOAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AOAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AOAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.2';
const AOAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

// Default system prompt for the TaskMaster AI Assistant
const DEFAULT_SYSTEM_PROMPT = `You are TaskMaster AI, an intelligent study assistant for university students at UTD.

## Your Capabilities:
- Help students manage their tasks, deadlines, and study schedules
- Answer questions about their uploaded course materials and syllabi
- Create study plans and suggest time management strategies
- Generate flashcards and study materials
- Explain academic concepts clearly

## Your Personality:
- Friendly, encouraging, and supportive
- Concise but thorough - get to the point quickly
- Action-oriented - suggest specific next steps
- Empathetic to student stress and workload

## Guidelines:
- Keep responses brief (2-3 paragraphs max) unless asked for more detail
- Use bullet points and formatting for readability
- If you don't know something, admit it and suggest alternatives
- Prioritize helping students stay on top of their work`;

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

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const messages = [
            { role: 'system', content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
            ...(conversationHistory || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        console.log(`[Chat] Sending message to ${AOAI_DEPLOYMENT}...`);

        const response = await client.chat.completions.create({
            messages: messages as any,
            model: AOAI_DEPLOYMENT,
            max_completion_tokens: 8192, // GPT-5.2 needs room for reasoning + output
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
            console.warn('[Chat] Empty response from LLM:', response.choices[0]);
            return NextResponse.json({
                response: "I'm having trouble responding right now. Please try again.",
                model: AOAI_DEPLOYMENT
            });
        }

        console.log(`[Chat] Response received (${content.length} chars)`);

        return NextResponse.json({
            response: content,
            model: AOAI_DEPLOYMENT,
            usage: response.usage
        });

    } catch (error: any) {
        console.error('[Chat] Azure Error:', error);

        // Provide user-friendly error messages
        if (error.code === 'content_filter') {
            return NextResponse.json({
                error: 'Your message was flagged by content filters. Please rephrase.'
            }, { status: 400 });
        }

        return NextResponse.json({
            error: error.message || 'An error occurred while processing your request.'
        }, { status: 500 });
    }
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
