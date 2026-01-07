import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import DocumentIntelligence from '@azure-rest/ai-document-intelligence';
import { AzureKeyCredential } from '@azure/core-auth';
import { getLongRunningPoller, isUnexpected } from '@azure-rest/ai-document-intelligence';
import { AzureOpenAI } from 'openai';

/**
 * Azure Document Intelligence + Foundry (GPT-5) Pipeline
 * POST /api/documents/analyze-azure
 * 
 * Pipeline:
 * 1. "The Eyes": Azure Document Intelligence (Layout Model) -> Extracts Markdown
 * 2. "The Brain": Azure OpenAI (GPT-5 Nano) -> Extracts Structured Syllabus Data
 * 3. Hydration: Supabase Database Update (Classes, Tasks)
 */

export const maxDuration = 60; // Vercel Function setting

// --- Configuration ---
const DOC_INTEL_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '';
const DOC_INTEL_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || '';

const AOAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || '';
const AOAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AOAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano';
const AOAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/**
 * Step 1: Extract Markdown using Azure Document Intelligence (Layout)
 */
async function extractMarkdownWithAzure(fileUrl: string): Promise<string> {
  if (!DOC_INTEL_ENDPOINT || !DOC_INTEL_KEY) {
    throw new Error('Azure Document Intelligence not configured (Missing Endpoint/Key)');
  }

  const client = DocumentIntelligence(DOC_INTEL_ENDPOINT, new AzureKeyCredential(DOC_INTEL_KEY));

  console.log(`[Azure] Analyzing document layout: ${fileUrl}`);

  // Start the analysis
  const initialResponse = await client.path("/documentModels/{modelId}:analyze", "prebuilt-layout").post({
    contentType: "application/json",
    body: {
      urlSource: fileUrl,
    },
    queryParameters: {
      outputContentFormat: "markdown",
    },
  });

  if (isUnexpected(initialResponse)) {
    throw new Error(`Document Intelligence Error: ${initialResponse.body.error?.message}`);
  }

  // Poll until done
  const poller = getLongRunningPoller(client, initialResponse);
  const result = await poller.pollUntilDone();

  if (isUnexpected(result)) {
    throw new Error(`Document Intelligence Polling Error: ${result.body.error?.message}`);
  }

  const content = result.body.analyzeResult?.content;
  if (!content) {
    throw new Error('No content extracted from document');
  }

  return content;
}

/**
 * Step 2: Structure Data using Azure OpenAI (GPT-5 Nano)
 */
async function structureDataWithGPT5(markdown: string): Promise<any> {
  if (!AOAI_ENDPOINT || !AOAI_API_KEY) {
    throw new Error('Azure OpenAI not configured (Missing Endpoint/Key)');
  }

  const client = new AzureOpenAI({
    endpoint: AOAI_ENDPOINT,
    apiKey: AOAI_API_KEY,
    apiVersion: AOAI_API_VERSION,
    deployment: AOAI_DEPLOYMENT,
  });

  // Strict JSON Schema for Syllabus
  const syllabusSchema = {
    type: "object",
    properties: {
      document_type: { type: "string", enum: ["syllabus", "assignment", "exam", "reading", "other"] },
      course_info: {
        type: "object",
        properties: {
          course_number: { type: ["string", "null"] },
          course_name: { type: ["string", "null"] },
          professor: { type: ["string", "null"] },
          semester: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
        },
        required: ["course_number", "course_name", "professor", "semester", "description"],
        additionalProperties: false
      },
      key_topics: {
        type: "array",
        items: { type: "string" }
      },
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            type: { type: "string", enum: ["exam", "quiz", "assignment", "project", "reading", "milestone", "other"] },
            due_date: { type: "string", description: "ISO 8601 date YYYY-MM-DD" },
            description: { type: "string" },
            priority: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["title", "type", "due_date", "description", "priority"],
          additionalProperties: false
        }
      }
    },
    required: ["document_type", "course_info", "key_topics", "tasks"],
    additionalProperties: false
  };

  console.log(`[Azure] Sending ${markdown.length} chars to GPT-5 (${AOAI_DEPLOYMENT})...`);

  const response = await client.chat.completions.create({
    model: AOAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content: `You are a Syllabus Architect and Task Scheduler. 
          Context: Processing markdown extracted from a university syllabus.
          Task:
          1. Identify Course Info (Name, Number, Professor).
          2. Scan for all Deadlines/Assignments.
          3. For Exams/Projects, mark priority as 'high'.
          4. Return STRICT JSON.
          5. If year is missing, assume 2026.`
      },
      { role: "user", content: markdown }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "syllabus_extraction",
        strict: true,
        schema: syllabusSchema
      }
    },
    max_completion_tokens: 16384, // GPT-5 uses ~4K for reasoning, so we need extra for output
  });

  console.log('[DEBUG] Full LLM response:', JSON.stringify(response, null, 2));
  console.log('[DEBUG] Finish reason:', response.choices[0]?.finish_reason);
  console.log('[DEBUG] Message refusal:', response.choices[0]?.message?.refusal);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.error('[DEBUG] LLM returned empty content. Full choice:', response.choices[0]);
    throw new Error(`Empty response from LLM. Finish reason: ${response.choices[0]?.finish_reason}`);
  }

  return JSON.parse(content);
}

export async function POST(req: NextRequest) {
  // Check critical config
  if (!DOC_INTEL_ENDPOINT || !DOC_INTEL_KEY) {
    return NextResponse.json({ error: 'Azure Document Intelligence not configured.' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { resource_id, user_id, file_url, file_name } = body;

  if (!resource_id || !file_url) {
    return NextResponse.json({ error: 'resource_id and file_url required' }, { status: 400 });
  }

  try {
    // 1. Mark resource as processing
    if (supabase) {
      await supabase.from('resources').update({ processing_status: 'processing' }).eq('id', resource_id);
    }

    // 2. Extract Markdown (The Eyes)
    const markdownContent = await extractMarkdownWithAzure(file_url);

    // 3. Structure Data (The Brain)
    const structuredData = await structureDataWithGPT5(markdownContent);

    // DEBUG: Log what the LLM returned
    console.log('[DEBUG] LLM Response:', JSON.stringify(structuredData, null, 2));
    console.log('[DEBUG] supabase client exists:', !!supabase);
    console.log('[DEBUG] user_id:', user_id);
    console.log('[DEBUG] structuredData.tasks:', structuredData?.tasks);
    console.log('[DEBUG] structuredData.tasks type:', typeof structuredData?.tasks);
    console.log('[DEBUG] structuredData.tasks isArray:', Array.isArray(structuredData?.tasks));

    // 4. Hydrate Database
    const { course_info, tasks, key_topics } = structuredData;
    let classId: string | null = null;
    let createdTaskCount = 0;

    console.log('[DEBUG] course_info:', course_info);
    console.log('[DEBUG] course_number:', course_info?.course_number);

    if (supabase && user_id) {
      // A. Class Creation/Linking
      if (course_info?.course_number) {
        const normalizedNumber = course_info.course_number.replace(/\s+/g, '').toUpperCase();
        console.log('[DEBUG] Normalized course number:', normalizedNumber);

        const { data: userClasses, error: classesError } = await supabase
          .from('classes')
          .select('id, name')
          .eq('user_id', user_id);

        console.log('[DEBUG] Existing classes:', userClasses);
        if (classesError) console.error('[DEBUG] Classes query error:', classesError);

        const existingClass = userClasses?.find(c =>
          (c.name || '').toUpperCase().replace(/\s+/g, '').includes(normalizedNumber)
        );

        if (existingClass) {
          classId = existingClass.id;
        } else {
          const name = `${course_info.course_number}: ${course_info.course_name || 'Course'}`;
          const { data: newClass } = await supabase.from('classes').insert({
            user_id,
            name: name.substring(0, 100),
            professor: course_info.professor,
            description: course_info.description,
            topics: key_topics || [],
            is_personal: false
          }).select('id').single();

          if (newClass) classId = newClass.id;
        }
      }

      // Link Resource
      if (classId) {
        await supabase.from('resources').update({ class_id: classId }).eq('id', resource_id);
      }

      // B. Task Creation
      console.log('[DEBUG] Tasks array:', tasks);
      console.log('[DEBUG] Tasks length:', tasks?.length);
      console.log('[DEBUG] classId for tasks:', classId);

      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        const tasksToInsert = tasks.map((t: any) => ({
          user_id,
          class_id: classId, // Can be null, tasks can be unlinked
          title: t.title || 'Untitled Task',
          description: t.description || null,
          deadline: t.due_date || null,
          status: 'pending',
          completed: false,
          task_type: t.type || 'other', // Use task_type instead of topic
          topic: t.type || null, // Also set topic for compatibility
        }));

        console.log('[DEBUG] Tasks to insert:', JSON.stringify(tasksToInsert, null, 2));

        const { data: insertedTasks, error: taskError } = await supabase
          .from('tasks')
          .insert(tasksToInsert)
          .select('id, title, deadline');

        if (taskError) {
          console.error('[DEBUG] Task insertion error:', taskError);
          console.error('[DEBUG] Error details:', JSON.stringify(taskError, null, 2));
        } else {
          createdTaskCount = insertedTasks?.length || 0;
          console.log(`[DEBUG] ✓ Created ${createdTaskCount} tasks:`, insertedTasks?.map(t => t.title));
        }
      } else {
        console.log('[DEBUG] Skipping task creation - conditions not met:', {
          hasTasks: !!tasks,
          isArray: Array.isArray(tasks),
          tasksLength: tasks?.length,
          hasClassId: !!classId
        });
      }
    }

    // 5. Finalize Resource Link
    if (supabase) {
      await supabase.from('resources').update({
        processing_status: 'complete',
        ai_summary: course_info?.description || 'Analyzed by Azure Foundry',
        extracted_data: {
          ...structuredData,
          provider: 'azure-foundry-gpt5',
          analyzed_at: new Date().toISOString()
        }
      }).eq('id', resource_id);
    }

    return NextResponse.json({
      success: true,
      class_id: classId,
      tasks_created: createdTaskCount,
      data: structuredData
    });

  } catch (error: any) {
    console.error('[Azure Pipeline] Error:', error);
    if (supabase) {
      await supabase.from('resources').update({
        processing_status: 'failed',
        extracted_data: { error: error.message }
      }).eq('id', resource_id);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
  });
}
