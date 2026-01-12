import { NextRequest, NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import DocumentIntelligence from '@azure-rest/ai-document-intelligence';
import { AzureKeyCredential } from '@azure/core-auth';
import { getLongRunningPoller, isUnexpected } from '@azure-rest/ai-document-intelligence';

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
const AOAI_NOTES_DEPLOYMENT =
    process.env.AZURE_OPENAI_NOTES_DEPLOYMENT_NAME || AOAI_DEPLOYMENT;
const AOAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

const DOC_INTEL_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '';
const DOC_INTEL_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '';

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
            name: 'create_task',
            description: 'Create a new task with optional deadline and class.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    deadline: { type: 'string', description: 'ISO date or datetime' },
                    class_name: { type: 'string', description: 'Class name (optional)' }
                },
                required: ['title']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_task',
            description: 'Update an existing task by id or title.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string' },
                    title: { type: 'string', description: 'Current task title if id not provided' },
                    new_title: { type: 'string' },
                    description: { type: 'string' },
                    deadline: { type: 'string', description: 'ISO date or datetime' },
                    status: { type: 'string', enum: ['pending', 'completed', 'overdue'] },
                    completed: { type: 'boolean' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Delete a task by id or title.',
            parameters: {
                type: 'object',
                properties: {
                    task_id: { type: 'string' },
                    title: { type: 'string' }
                },
                required: []
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
    ,
    {
        type: 'function',
        function: {
            name: 'create_event',
            description: 'Create a calendar event.',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    start: { type: 'string', description: 'ISO datetime' },
                    end: { type: 'string', description: 'ISO datetime' },
                    description: { type: 'string' },
                    location: { type: 'string' },
                    class_name: { type: 'string' },
                    repeat_weekly: { type: 'boolean' },
                    color: { type: 'string' }
                },
                required: ['title', 'start']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'update_event',
            description: 'Update an event by id or title.',
            parameters: {
                type: 'object',
                properties: {
                    event_id: { type: 'string' },
                    title: { type: 'string', description: 'Current event title if id not provided' },
                    new_title: { type: 'string' },
                    start: { type: 'string' },
                    end: { type: 'string' },
                    description: { type: 'string' },
                    location: { type: 'string' },
                    class_name: { type: 'string' },
                    repeat_weekly: { type: 'boolean' },
                    color: { type: 'string' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'delete_event',
            description: 'Delete an event by id or title.',
            parameters: {
                type: 'object',
                properties: {
                    event_id: { type: 'string' },
                    title: { type: 'string' }
                },
                required: []
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_class',
            description: 'Create a class manually.',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    professor: { type: 'string' },
                    description: { type: 'string' },
                    topics: { type: 'array', items: { type: 'string' } },
                    location: { type: 'string' }
                },
                required: ['name']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_class_from_syllabus',
            description: 'Create or update class from an uploaded syllabus (resource_id required).',
            parameters: {
                type: 'object',
                properties: {
                    resource_id: { type: 'string' }
                },
                required: ['resource_id']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_notes',
            description: 'Generate structured notes from an uploaded lecture file.',
            parameters: {
                type: 'object',
                properties: {
                    resource_id: { type: 'string' },
                    class_name: { type: 'string' },
                    topic: { type: 'string' },
                    create_flashcards: { type: 'boolean' },
                    card_count: { type: 'number' }
                },
                required: ['topic']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'create_flashcards_manual',
            description: 'Create a flashcard set from provided Q/A pairs.',
            parameters: {
                type: 'object',
                properties: {
                    class_name: { type: 'string' },
                    topic: { type: 'string' },
                    cards: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                question: { type: 'string' },
                                answer: { type: 'string' }
                            },
                            required: ['question', 'answer']
                        }
                    }
                },
                required: ['topic', 'cards']
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
- CREATE, UPDATE, and DELETE tasks - use create_task / update_task / delete_task
- CREATE, UPDATE, and DELETE events - use create_event / update_event / delete_event
- CREATE classes manually or from syllabus uploads - use create_class / create_class_from_syllabus
- CREATE study notes from uploaded lecture files - use create_notes
- CREATE flashcard decks manually or with AI - use create_flashcards / create_flashcards_manual

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
    if (!classId) {
        const { data: personal } = await supabase
            .from('classes')
            .select('id')
            .eq('user_id', userId)
            .eq('is_personal', true)
            .limit(1);
        if (personal?.[0]) classId = personal[0].id;
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
                class_id: classId,
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

async function findClassIdByName(userId: string, className?: string) {
    if (!supabase) return null;
    if (!className) return null;
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', `%${className}%`)
        .limit(1);
    return classes?.[0]?.id || null;
}

async function executeCreateTask(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { title, description, deadline, class_name } = params;
    const classId = await findClassIdByName(userId, class_name);

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            user_id: userId,
            title,
            description: description || null,
            deadline: deadline || null,
            status: 'pending',
            completed: false,
            class_id: classId || null,
        })
        .select('id, title')
        .single();

    if (error) return { error: error.message };
    return { success: true, task_id: data.id, message: `Created task "${data.title}".` };
}

async function executeUpdateTask(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { task_id, title, new_title, description, deadline, status, completed } = params;

    let taskId = task_id;
    if (!taskId && title) {
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', `%${title}%`)
            .limit(1);
        taskId = tasks?.[0]?.id;
    }

    if (!taskId) return { error: 'Task not found' };

    const updateData: any = {};
    if (new_title !== undefined) updateData.title = new_title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status;
    if (completed !== undefined) updateData.completed = completed;

    const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select('id, title')
        .single();

    if (error) return { error: error.message };
    return { success: true, task_id: data.id, message: `Updated task "${data.title}".` };
}

async function executeDeleteTask(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { task_id, title } = params;

    let taskId = task_id;
    if (!taskId && title) {
        const { data: tasks } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', `%${title}%`)
            .limit(1);
        taskId = tasks?.[0]?.id;
    }

    if (!taskId) return { error: 'Task not found' };

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

    if (error) return { error: error.message };
    return { success: true, message: 'Task deleted.' };
}

async function executeCreateEvent(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { title, start, end, description, location, class_name, repeat_weekly, color } = params;
    const classId = await findClassIdByName(userId, class_name);

    const { data, error } = await supabase
        .from('events')
        .insert({
            user_id: userId,
            title,
            start_time: start,
            end_time: end || start,
            description: description || null,
            location: location || null,
            class_id: classId || null,
            recurrence: repeat_weekly ? 'weekly' : null,
            color: color || '#6B6BFF',
        })
        .select('id, title')
        .single();

    if (error) return { error: error.message };
    return { success: true, event_id: data.id, message: `Created event "${data.title}".` };
}

async function executeUpdateEvent(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { event_id, title, new_title, start, end, description, location, class_name, repeat_weekly, color } = params;
    let eventId = event_id;
    if (!eventId && title) {
        const { data: events } = await supabase
            .from('events')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', `%${title}%`)
            .limit(1);
        eventId = events?.[0]?.id;
    }

    if (!eventId) return { error: 'Event not found' };
    const classId = await findClassIdByName(userId, class_name);

    const updateData: any = {};
    if (new_title !== undefined) updateData.title = new_title;
    if (start !== undefined) updateData.start_time = start;
    if (end !== undefined) updateData.end_time = end;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (classId !== null && class_name !== undefined) updateData.class_id = classId;
    if (repeat_weekly !== undefined) updateData.recurrence = repeat_weekly ? 'weekly' : null;
    if (color !== undefined) updateData.color = color;

    const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .eq('user_id', userId)
        .select('id, title')
        .single();

    if (error) return { error: error.message };
    return { success: true, event_id: data.id, message: `Updated event "${data.title}".` };
}

async function executeDeleteEvent(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { event_id, title } = params;
    let eventId = event_id;
    if (!eventId && title) {
        const { data: events } = await supabase
            .from('events')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', `%${title}%`)
            .limit(1);
        eventId = events?.[0]?.id;
    }

    if (!eventId) return { error: 'Event not found' };

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', userId);

    if (error) return { error: error.message };
    return { success: true, message: 'Event deleted.' };
}

async function executeCreateClass(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { name, professor, description, topics, location } = params;

    const { data, error } = await supabase
        .from('classes')
        .insert({
            user_id: userId,
            name,
            professor: professor || null,
            description: description || null,
            topics: topics || [],
            location: location || null,
            is_personal: false,
        })
        .select('id, name')
        .single();

    if (error) return { error: error.message };
    return { success: true, class_id: data.id, message: `Created class "${data.name}".` };
}

async function executeCreateClassFromSyllabus(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { resource_id } = params;

    const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .select('id, files')
        .eq('id', resource_id)
        .eq('user_id', userId)
        .single();

    if (resourceError || !resource) return { error: 'Resource not found' };
    const fileUrl = resource.files?.[0]?.url;
    if (!fileUrl) return { error: 'Resource file URL not found' };

    const endpoint = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/analyze-azure`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            resource_id,
            user_id: userId,
            file_url: fileUrl,
        }),
    });

    const result = await response.json();
    if (!response.ok) return { error: result.error || 'Failed to analyze syllabus' };
    return { success: true, message: 'Syllabus processed.', class_id: result.class_id };
}

async function extractMarkdownWithAzure(fileUrl: string): Promise<string> {
    if (!DOC_INTEL_ENDPOINT || !DOC_INTEL_KEY) {
        throw new Error('Azure Document Intelligence not configured');
    }
    const client = DocumentIntelligence(DOC_INTEL_ENDPOINT, new AzureKeyCredential(DOC_INTEL_KEY));

    const initialResponse = await client
        .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
        .post({
            contentType: "application/json",
            body: { urlSource: fileUrl },
            queryParameters: { outputContentFormat: "markdown" },
        });

    if (isUnexpected(initialResponse)) {
        throw new Error(initialResponse.body.error?.message || 'Document analysis failed');
    }

    const poller = getLongRunningPoller(client, initialResponse);
    const result = await poller.pollUntilDone();
    if (isUnexpected(result)) {
        throw new Error(result.body.error?.message || 'Document analysis failed');
    }

    const content = (result.body as any).analyzeResult?.content;
    if (!content) throw new Error('No content extracted from document');
    return content;
}

async function generateNotesContent(markdown: string, className: string, topic: string) {
    const client = new AzureOpenAI({
        endpoint: AOAI_ENDPOINT,
        apiKey: AOAI_API_KEY,
        apiVersion: AOAI_API_VERSION,
        deployment: AOAI_NOTES_DEPLOYMENT,
    });

    const prompt = `Create a clean, well-structured study note document in Markdown.

Class: ${className}
Topic: ${topic}

Requirements:
- Output Markdown only (no JSON, no HTML).
- Headings must start at column 1 (no leading spaces).
- Do NOT wrap the output in code fences.
- Use clear headings and bullet points.
- Include: Overview, Key Concepts, Definitions, Examples, Steps/Processes (if any),
  Important Formulas/Rules (if any), Common Mistakes, Quick Review, and 5–8 Practice Questions.
- Keep it concise, factual, and easy to study from.

Source material (markdown):
${markdown.substring(0, 12000)}`;

    const response = await client.chat.completions.create({
        model: AOAI_NOTES_DEPLOYMENT,
        messages: [
            { role: 'system', content: 'You are an expert study note writer.' },
            { role: 'user', content: prompt },
        ],
        max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from notes model');
    return content.trim();
}

async function generateFlashcardsFromNotes(
    notesContent: string,
    topic: string,
    count: number
) {
    const client = new AzureOpenAI({
        endpoint: AOAI_ENDPOINT,
        apiKey: AOAI_API_KEY,
        apiVersion: AOAI_API_VERSION,
        deployment: AOAI_DEPLOYMENT,
    });

    const response = await client.chat.completions.create({
        model: AOAI_DEPLOYMENT,
        messages: [
            { role: 'system', content: 'Return JSON only with a "flashcards" array.' },
            {
                role: 'user',
                content: `Generate ${count} flashcards from these notes.
Return JSON only. The topic field must be "${topic}".

Notes:
${notesContent.substring(0, 8000)}`
            },
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from flashcard model');
    const parsed = JSON.parse(content);
    return parsed.flashcards || [];
}

async function executeCreateNotes(params: any, userId: string, fallbackResourceId?: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { resource_id, class_name, topic, create_flashcards, card_count } = params;

    const resourceId = resource_id || fallbackResourceId;
    if (!resourceId) return { error: 'resource_id required (attach a file first).' };

    const { data: resource, error: resourceError } = await supabase
        .from('resources')
        .select('id, title, files, class_id')
        .eq('id', resourceId)
        .eq('user_id', userId)
        .single();

    if (resourceError || !resource) return { error: 'Resource not found' };
    const fileUrl = resource.files?.[0]?.url;
    if (!fileUrl) return { error: 'Resource file URL not found' };

    let classId = resource.class_id || null;
    if (!classId && class_name) {
        classId = await findClassIdByName(userId, class_name);
    }
    if (!classId) {
        const { data: personal } = await supabase
            .from('classes')
            .select('id')
            .eq('user_id', userId)
            .eq('is_personal', true)
            .limit(1);
        classId = personal?.[0]?.id || null;
    }

    const className = class_name || 'Class';
    const markdown = await extractMarkdownWithAzure(fileUrl);
    const notesContent = await generateNotesContent(markdown, className, topic);

    const noteTitle = resource.title ? `${resource.title}` : `${topic} Notes`;
    const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
            user_id: userId,
            class_id: classId,
            topic,
            resource_id: resourceId,
            title: noteTitle,
            content: notesContent,
        })
        .select('id')
        .single();

    if (noteError) return { error: noteError.message };

    let flashcards = null;
    if (create_flashcards) {
        const count = Math.min(Math.max(Number(card_count || 10), 1), 50);
        const cards = await generateFlashcardsFromNotes(notesContent, topic, count);
        if (cards.length > 0) {
            const rows = cards.map((card: any) => ({
                user_id: userId,
                class_id: classId,
                topic,
                question: card.question,
                answer: card.answer,
                description: 'Notes-generated',
            }));
            const { error: insertError } = await supabase.from('flashcards').insert(rows);
            if (insertError) return { error: insertError.message };
            flashcards = { count: cards.length };
        }
    }

    return {
        success: true,
        note_id: note?.id,
        flashcards,
        message: 'Notes created successfully.',
    };
}

async function executeCreateFlashcardsManual(params: any, userId: string) {
    if (!supabase) return { error: 'Database not configured' };
    const { class_name, topic, cards } = params;
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
        return { error: 'No cards provided' };
    }

    let classId = await findClassIdByName(userId, class_name);
    if (!classId) {
        const { data: personal } = await supabase
            .from('classes')
            .select('id')
            .eq('user_id', userId)
            .eq('is_personal', true)
            .limit(1);
        classId = personal?.[0]?.id || null;
    }

    const rows = cards.map((card: any) => ({
        user_id: userId,
        class_id: classId,
        topic,
        question: card.question,
        answer: card.answer,
        description: 'Manual',
    }));

    const { error } = await supabase.from('flashcards').insert(rows);
    if (error) return { error: error.message };
    return { success: true, count: rows.length, message: `Created ${rows.length} flashcards.` };
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
        const { message, systemPrompt, conversationHistory, userId, attachments } = await req.json();

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const attachmentNote = Array.isArray(attachments) && attachments.length > 0
            ? `\n\nRecent attachments:\n${attachments
                .map((file: any) => `- ${file.name || 'file'} (resource_id: ${file.resource_id})`)
                .join('\n')}\nUse resource_id when calling create_notes or create_class_from_syllabus.`
            : '';

        const messages: any[] = [
            { role: 'system', content: (systemPrompt || SYSTEM_PROMPT) + attachmentNote },
            ...(conversationHistory || []).map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        const hasAttachment = Array.isArray(attachments) && attachments.length > 0;
        const wantsClassFromSyllabus =
            hasAttachment &&
            /create|make|add|set up/i.test(message) &&
            /class|course|syllabus/i.test(message);

        // First call with tools
        const response = await client.chat.completions.create({
            messages,
            model: AOAI_DEPLOYMENT,
            max_completion_tokens: 4096,
            tools: TOOLS as any,
            tool_choice: wantsClassFromSyllabus
                ? { type: 'function', function: { name: 'create_class_from_syllabus' } }
                : 'auto',
        });

        const choice = response.choices[0];
        let finalResponse = choice.message?.content || '';
        const toolCalls = choice.message?.tool_calls || [];

        // Execute any tool calls
        if (toolCalls.length > 0 && userId) {
            const toolResults: string[] = [];

            const fallbackResourceId = attachments?.[0]?.resource_id;
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
                    case 'create_task':
                        result = await executeCreateTask(fnArgs, userId);
                        break;
                    case 'update_task':
                        result = await executeUpdateTask(fnArgs, userId);
                        break;
                    case 'delete_task':
                        result = await executeDeleteTask(fnArgs, userId);
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
                    case 'create_event':
                        result = await executeCreateEvent(fnArgs, userId);
                        break;
                    case 'update_event':
                        result = await executeUpdateEvent(fnArgs, userId);
                        break;
                    case 'delete_event':
                        result = await executeDeleteEvent(fnArgs, userId);
                        break;
                    case 'create_class':
                        result = await executeCreateClass(fnArgs, userId);
                        break;
                    case 'create_class_from_syllabus':
                        result = await executeCreateClassFromSyllabus(fnArgs, userId);
                        break;
                    case 'create_notes':
                        result = await executeCreateNotes(fnArgs, userId, fallbackResourceId);
                        break;
                    case 'create_flashcards_manual':
                        result = await executeCreateFlashcardsManual(fnArgs, userId);
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
