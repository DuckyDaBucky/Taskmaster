import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DocumentIntelligenceClient, AzureKeyCredential } from '@azure/ai-document-intelligence';
import { AzureOpenAI } from 'openai';
import { normalizeDueDate } from '../../../../lib/dateUtils';

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
const AOAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5-nano'; // e.g., 'gpt-5-nano'
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

  const client = new DocumentIntelligenceClient(
    DOC_INTEL_ENDPOINT,
    new AzureKeyCredential(DOC_INTEL_KEY)
  );

  console.log(`[Azure] Analyzing document layout: ${fileUrl}`);

  // Use 'prebuilt-layout' with markdown output to preserve table structure for the LLM
  const poller = await client.beginAnalyzeDocument('prebuilt-layout', {
    documentUrl: fileUrl,
    outputContentFormat: 'markdown',
  });

  const result = await poller.pollUntilDone();

  if (!result.content) {
    throw new Error('No content extracted from document');
  }

  return result.content;
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
    model: AOAI_DEPLOYMENT, // This is actually ignored by Azure SDK in favor of 'deployment' in constructor, but good to have
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
    max_completion_tokens: 4096, // GPT-5 specific param
    // reasoning_effort: "medium" // Supported in some preview versions
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("Empty response from LLM");

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

    // 4. Hydrate Database
    const { course_info, tasks, key_topics } = structuredData;
    let classId: string | null = null;
    let createdTaskCount = 0;

    if (supabase && user_id) {
      // A. Class Creation/Linking
      // Logic: Try to match class by course number, else create new
      if (course_info?.course_number) {
        const normalizedNumber = course_info.course_number.replace(/\s+/g, '').toUpperCase();

        const { data: userClasses } = await supabase
          .from('classes')
          .select('id, name')
          .eq('user_id', user_id);

        const existingClass = userClasses?.find(c =>
          (c.name || '').toUpperCase().replace(/\s+/g, '').includes(normalizedNumber)
        );

        if (existingClass) {
          classId = existingClass.id;
        } else {
          // Create new
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
      if (tasks && tasks.length > 0 && classId) {
        const tasksToInsert = tasks.map((t: any) => ({
          user_id,
          class_id: classId,
          title: t.title,
          description: t.description,
          deadline: t.due_date,
          status: 'pending',
          topic: t.type, // Map type to topic
          priority: t.priority
        }));

        const { error } = await supabase.from('tasks').insert(tasksToInsert);
        if (!error) createdTaskCount = tasksToInsert.length;
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
