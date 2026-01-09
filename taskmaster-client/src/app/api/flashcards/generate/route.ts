/**
 * AI Flashcard Generation API
 * Uses Azure OpenAI to generate flashcards from class topics or document content
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AzureOpenAI } from 'openai';

// Config
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano';
const AZURE_OPENAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Initialize Supabase with service key for server-side operations
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

// Initialize Azure OpenAI
const openai = AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_API_KEY
    ? new AzureOpenAI({
        endpoint: AZURE_OPENAI_ENDPOINT,
        apiKey: AZURE_OPENAI_API_KEY,
        apiVersion: AZURE_OPENAI_API_VERSION,
    })
    : null;

const FLASHCARD_SYSTEM_PROMPT = `You are an expert educator and flashcard creator. Your task is to generate high-quality flashcards that help students learn and retain information effectively.

RULES:
1. Create clear, concise questions that test understanding (not just recall)
2. Answers should be complete but not overly long
3. Include a mix of definition, concept, and application questions
4. Questions should be specific and unambiguous
5. Generate exactly the number of flashcards requested

OUTPUT FORMAT:
Return a JSON object with a "flashcards" array. Each flashcard must have:
- "question": The question or prompt (string)
- "answer": The answer or explanation (string)
- "topic": The specific topic/subtopic this covers (string)

Example:
{
  "flashcards": [
    {"question": "What is...", "answer": "...", "topic": "Topic Name"},
    ...
  ]
}`;

interface FlashcardData {
    question: string;
    answer: string;
    topic: string;
}

async function generateFlashcardsWithAI(
    content: string,
    className: string,
    count: number = 10
): Promise<FlashcardData[]> {
    if (!openai) throw new Error('Azure OpenAI not configured');

    const userPrompt = `Generate ${count} flashcards for studying "${className}".

Content to study:
${content.substring(0, 8000)}

Generate diverse, educational flashcards covering the key concepts. Return valid JSON only.`;

    const response = await openai.chat.completions.create({
        model: AZURE_OPENAI_DEPLOYMENT,
        messages: [
            { role: 'system', content: FLASHCARD_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 8192,
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
        throw new Error('Empty response from AI');
    }

    const parsed = JSON.parse(responseContent);
    return parsed.flashcards || [];
}

export async function POST(req: NextRequest) {
    if (!openai) {
        return NextResponse.json({ error: 'Azure OpenAI not configured' }, { status: 500 });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { class_id, resource_id, user_id, count = 10 } = body;

    if (!class_id || !user_id) {
        return NextResponse.json({ error: 'class_id and user_id required' }, { status: 400 });
    }

    try {
        let content = '';
        let className = 'Unknown Class';

        // Get class info
        if (supabase) {
            const { data: classData } = await supabase
                .from('classes')
                .select('name, topics, professor, description')
                .eq('id', class_id)
                .single();

            if (classData) {
                className = classData.name || className;
                content = `Class: ${classData.name}\n`;
                if (classData.professor) content += `Professor: ${classData.professor}\n`;
                if (classData.description) content += `Description: ${classData.description}\n`;
                if (classData.topics?.length) content += `Topics: ${classData.topics.join(', ')}\n\n`;
            }
        }

        // Get resource content if specified
        if (resource_id && supabase) {
            const { data: resource } = await supabase
                .from('resources')
                .select('title, ai_summary, extracted_data')
                .eq('id', resource_id)
                .single();

            if (resource) {
                if (resource.title) content += `Document: ${resource.title}\n`;
                if (resource.ai_summary) content += `Summary: ${resource.ai_summary}\n\n`;

                // Extract course info from syllabus
                if (resource.extracted_data?.course_info) {
                    const info = resource.extracted_data.course_info;
                    if (info.description) content += `Course Description: ${info.description}\n`;
                }

                // Include key topics if available
                if (resource.extracted_data?.key_topics?.length) {
                    content += `Key Topics: ${resource.extracted_data.key_topics.join(', ')}\n`;
                }

                // Include any tasks/assignments for context
                if (resource.extracted_data?.tasks?.length) {
                    const taskTitles = resource.extracted_data.tasks.map((t: any) => t.title).slice(0, 10);
                    content += `Assignments/Topics: ${taskTitles.join(', ')}\n`;
                }
            }
        } else if (supabase) {
            // Get all resources for this class
            const { data: resources } = await supabase
                .from('resources')
                .select('title, ai_summary, extracted_data')
                .eq('class_id', class_id)
                .limit(5);

            if (resources?.length) {
                content += '\n--- CLASS MATERIALS ---\n';
                resources.forEach(r => {
                    if (r.title) content += `• ${r.title}\n`;
                    if (r.ai_summary) content += `  ${r.ai_summary}\n`;
                });
            }
        }

        // Generate flashcards
        const flashcards = await generateFlashcardsWithAI(content, className, count);

        // Save to database
        if (supabase && flashcards.length > 0) {
            const flashcardsToInsert = flashcards.map(card => ({
                user_id,
                class_id,
                topic: card.topic || className,
                question: card.question,
                answer: card.answer,
                description: `AI-generated from ${resource_id ? 'resource' : 'class topics'}`,
            }));

            const { data: inserted, error: insertError } = await supabase
                .from('flashcards')
                .insert(flashcardsToInsert)
                .select('id, question, answer, topic');

            if (insertError) {
                console.error('Error inserting flashcards:', insertError);
                throw new Error('Failed to save flashcards');
            }

            return NextResponse.json({
                success: true,
                count: inserted?.length || 0,
                flashcards: inserted,
            });
        }

        return NextResponse.json({
            success: true,
            count: flashcards.length,
            flashcards,
        });

    } catch (error: any) {
        console.error('[Flashcard Generation] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
    });
}
