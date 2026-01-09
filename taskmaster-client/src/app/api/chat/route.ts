import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

/**
 * Agentic Chat API - TaskMaster AI Assistant with Tool Calling
 * POST /api/chat
 * 
 * Capabilities:
 * - Create flashcards for specific topics
 * - Mark tasks as complete
 * - Query uploaded documents for answers
 * - Get task/class information
 */

const AOAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AOAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AOAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.2';
const AOAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

// Tool definitions for the agentic capabilities
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'create_flashcards',
            description: 'Create study flashcards for a specific topic or class. Use when user asks to make/create flashcards.',
            parameters: {
                type: 'object',
                properties: {
                    topic: { type: 'string', description: 'The topic to create flashcards about (e.g., "Exam 3", "Chapter 5")' },
                    class_name: { type: 'string', description: 'The class name if specified (optional)' },
                    count: { type: 'number', description: 'Number of flashcards to create (default: 10)' }
                },
                required: ['topic']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'complete_task',
            description: 'Mark a task as complete. Use when user says they finished a task.',
            parameters: {
                type: 'object',
                properties: {
                    task_title: { type: 'string', description: 'The title or name of the task to mark complete' }
                },
                required: ['task_title']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'query_documents',
            description: 'Search through uploaded documents (syllabi, notes) to answer questions. Use for questions about course content.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'The question or search query about course materials' },
                    class_name: { type: 'string', description: 'Specific class to search in (optional)' }
                },
                required: ['query']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_tasks',
            description: 'Get list of tasks, optionally filtered by status. Use when user asks about their tasks or deadlines.',
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['pending', 'overdue', 'completed', 'all'], description: 'Filter by task status' },
                    class_name: { type: 'string', description: 'Filter by class name (optional)' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'get_classes',
            description: 'Get list of user classes with topics and info.',
            parameters: {
                type: 'object',
                properties: {},
                required: []
            }
        }
    }
];

// System prompt for agentic assistant
const SYSTEM_PROMPT = `You are TaskMaster AI, an intelligent and ACTION-ORIENTED study assistant for university students.

## Your Capabilities (USE THEM!):
- CREATE flashcards when asked - use the create_flashcards tool
- COMPLETE tasks when the user says they finished something - use the complete_task tool
- SEARCH documents to answer questions about course content - use the query_documents tool
- GET tasks and deadlines - use the get_tasks tool
- GET classes info - use the get_classes tool

## CRITICAL: Be Proactive!
- When user mentions a topic, offer to create flashcards
- When user says they finished something, mark it complete
- When user asks about course content, search their documents
- Don't just acknowledge - TAKE ACTION

## Response Style:
- Brief and action-oriented (2-3 sentences max)
- After using a tool, summarize what you did
- Suggest logical next steps`;

// Tool execution functions
async function executeCreateFlashcards(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };

    const { topic, class_name, count = 10 } = params;

    // Find class if specified
    let classId = null;
    if (class_name) {
        const { data: classes } = await supabase
            .from('classes')
            .select('id, name')
            .eq('user_id', userId)
            .ilike('name', `%${class_name}%`)
            .limit(1);

        if (classes?.[0]) classId = classes[0].id;
    }

    // Get relevant content from resources
    let content = `Topic: ${topic}\n`;
    const { data: resources } = await supabase
        .from('resources')
        .select('title, ai_summary, extracted_data')
        .eq('user_id', userId)
        .limit(5);

    if (resources?.length) {
        resources.forEach(r => {
            if (r.ai_summary) content += `${r.ai_summary}\n`;
            if (r.extracted_data?.key_topics) {
                content += `Topics: ${r.extracted_data.key_topics.join(', ')}\n`;
            }
        });
    }

    // Generate flashcards using the flashcards API
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/flashcards/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                class_id: classId || 'general',
                user_id: userId,
                count: count,
                topic: topic,
            }),
        });

        const result = await response.json();
        if (result.success) {
            return { success: true, count: result.count, message: `Created ${result.count} flashcards about "${topic}"` };
        }
        return { error: result.error || 'Failed to create flashcards' };
    } catch (e: any) {
        return { error: e.message };
    }
}

async function executeCompleteTask(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };

    const { task_title } = params;

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', userId)
        .ilike('title', `%${task_title}%`)
        .eq('completed', false)
        .limit(1);

    if (error || !tasks?.length) {
        return { error: `Could not find pending task matching "${task_title}"` };
    }

    const task = tasks[0];
    const { error: updateError } = await supabase
        .from('tasks')
        .update({ completed: true, status: 'completed' })
        .eq('id', task.id);

    if (updateError) {
        return { error: 'Failed to update task' };
    }

    return { success: true, message: `Marked "${task.title}" as complete! 🎉` };
}

async function executeQueryDocuments(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };

    const { query, class_name } = params;

    let resourceQuery = supabase
        .from('resources')
        .select('title, ai_summary, extracted_data')
        .eq('user_id', userId);

    if (class_name) {
        // Get class ID first
        const { data: classes } = await supabase
            .from('classes')
            .select('id')
            .eq('user_id', userId)
            .ilike('name', `%${class_name}%`)
            .limit(1);

        if (classes?.[0]) {
            resourceQuery = resourceQuery.eq('class_id', classes[0].id);
        }
    }

    const { data: resources } = await resourceQuery.limit(10);

    if (!resources?.length) {
        return { answer: 'No documents found. Try uploading a syllabus first!', sources: [] };
    }

    // Build context from documents
    let context = '';
    const sources: string[] = [];

    resources.forEach(r => {
        if (r.title) sources.push(r.title);
        if (r.ai_summary) context += `${r.ai_summary}\n`;
        if (r.extracted_data?.course_info?.description) {
            context += r.extracted_data.course_info.description + '\n';
        }
        if (r.extracted_data?.key_topics) {
            context += `Topics: ${r.extracted_data.key_topics.join(', ')}\n`;
        }
    });

    return { answer: context || 'No relevant content found.', sources, query };
}

async function executeGetTasks(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };

    const { status = 'all', class_name } = params;

    let query = supabase
        .from('tasks')
        .select('id, title, deadline, status, completed, classes(name)')
        .eq('user_id', userId)
        .order('deadline', { ascending: true })
        .limit(20);

    if (status === 'pending') query = query.eq('completed', false);
    if (status === 'completed') query = query.eq('completed', true);

    const { data: tasks } = await query;

    // Filter overdue
    const now = new Date();
    const result = (tasks || []).map(t => {
        const isOverdue = !t.completed && t.deadline && new Date(t.deadline) < now;
        return {
            title: t.title,
            deadline: t.deadline,
            status: isOverdue ? 'overdue' : (t.completed ? 'completed' : 'pending'),
            class: (t as any).classes?.name || 'Personal',
        };
    });

    if (status === 'overdue') {
        return { tasks: result.filter(t => t.status === 'overdue') };
    }

    return { tasks: result };
}

async function executeGetClasses(userId: string) {
    if (!supabase) return { error: 'Database not configured' };

    const { data: classes } = await supabase
        .from('classes')
        .select('name, professor, topics')
        .eq('user_id', userId)
        .limit(20);

    return { classes: classes || [] };
}

// Main handler
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
        const { message, systemPrompt, conversationHistory, userId } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const messages: any[] = [
            { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
            ...(conversationHistory || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        // First call with tools
        const response = await client.chat.completions.create({
            messages,
            model: AOAI_DEPLOYMENT,
            max_completion_tokens: 4096,
            tools: TOOLS as any,
            tool_choice: 'auto',
        });

        const choice = response.choices[0];
        let finalResponse = choice.message?.content || '';
        const toolCalls = choice.message?.tool_calls || [];

        // Execute any tool calls
        if (toolCalls.length > 0 && userId) {
            const toolResults: string[] = [];

            for (const toolCall of toolCalls as any[]) {
                const fnName = toolCall.function.name;
                const fnArgs = JSON.parse(toolCall.function.arguments);

                let result: any;
                switch (fnName) {
                    case 'create_flashcards':
                        result = await executeCreateFlashcards(fnArgs, userId);
                        break;
                    case 'complete_task':
                        result = await executeCompleteTask(fnArgs, userId);
                        break;
                    case 'query_documents':
                        result = await executeQueryDocuments(fnArgs, userId);
                        break;
                    case 'get_tasks':
                        result = await executeGetTasks(fnArgs, userId);
                        break;
                    case 'get_classes':
                        result = await executeGetClasses(userId);
                        break;
                    default:
                        result = { error: 'Unknown tool' };
                }

                toolResults.push(`[${fnName}] ${JSON.stringify(result)}`);
            }

            // Get final response after tool execution
            messages.push(choice.message);
            messages.push({
                role: 'tool',
                tool_call_id: toolCalls[0].id,
                content: toolResults.join('\n'),
            });

            const finalCall = await client.chat.completions.create({
                messages,
                model: AOAI_DEPLOYMENT,
                max_completion_tokens: 2048,
            });

            finalResponse = finalCall.choices[0]?.message?.content || finalResponse;
        }

        return NextResponse.json({
            response: finalResponse || "I completed your request. Is there anything else you'd like me to help with?",
            model: AOAI_DEPLOYMENT,
            toolsUsed: (toolCalls as any[]).map(t => t.function?.name).filter(Boolean),
        });

    } catch (error: any) {
        console.error('[Chat] Azure Error:', error);

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
