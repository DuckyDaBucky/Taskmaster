import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import DocumentIntelligence from '@azure-rest/ai-document-intelligence';
import { AzureKeyCredential } from '@azure/core-auth';
import { getLongRunningPoller, isUnexpected } from '@azure-rest/ai-document-intelligence';
import { AzureOpenAI } from 'openai';

export const maxDuration = 60;

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

async function extractMarkdownWithAzure(fileUrl: string): Promise<string> {
  if (!DOC_INTEL_ENDPOINT || !DOC_INTEL_KEY) {
    throw new Error('Azure Document Intelligence not configured (Missing Endpoint/Key)');
  }

  const client = DocumentIntelligence(DOC_INTEL_ENDPOINT, new AzureKeyCredential(DOC_INTEL_KEY));

  const initialResponse = await client.path("/documentModels/{modelId}:analyze", "prebuilt-layout").post({
    contentType: "application/json",
    body: { urlSource: fileUrl },
    queryParameters: { outputContentFormat: "markdown" },
  });

  if (isUnexpected(initialResponse)) {
    throw new Error(`Document Intelligence Error: ${initialResponse.body.error?.message}`);
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const result = await poller.pollUntilDone();

  if (isUnexpected(result)) {
    throw new Error(`Document Intelligence Polling Error: ${result.body.error?.message}`);
  }

  const content = (result.body as any).analyzeResult?.content;
  if (!content) {
    throw new Error('No content extracted from document');
  }

  return content;
}

async function extractDetailsWithGPT5(markdown: string): Promise<any> {
  if (!AOAI_ENDPOINT || !AOAI_API_KEY) {
    throw new Error('Azure OpenAI not configured (Missing Endpoint/Key)');
  }

  const client = new AzureOpenAI({
    endpoint: AOAI_ENDPOINT,
    apiKey: AOAI_API_KEY,
    apiVersion: AOAI_API_VERSION,
    deployment: AOAI_DEPLOYMENT,
  });

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
          schedule: { type: ["string", "null"] },
          location: { type: ["string", "null"] },
          professor_office_hours: { type: ["string", "null"] },
          contact_info: { type: ["string", "null"] },
        },
        required: [
          "course_number",
          "course_name",
          "professor",
          "semester",
          "description",
          "schedule",
          "location",
          "professor_office_hours",
          "contact_info"
        ],
        additionalProperties: false
      },
      course_policies: {
        type: "object",
        properties: {
          learning_objectives: { type: ["string", "null"] },
          textbooks_and_materials: { type: ["string", "null"] },
          grading_policy: { type: ["string", "null"] },
          attendance_policy: { type: ["string", "null"] },
          late_work_policy: { type: ["string", "null"] },
          extra_credit_policy: { type: ["string", "null"] },
        },
        required: [
          "learning_objectives",
          "textbooks_and_materials",
          "grading_policy",
          "attendance_policy",
          "late_work_policy",
          "extra_credit_policy"
        ],
        additionalProperties: false
      },
      key_topics: {
        type: "array",
        items: { type: "string" }
      },
    },
    required: ["document_type", "course_info", "course_policies", "key_topics"],
    additionalProperties: false
  };

  const response = await client.chat.completions.create({
    model: AOAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content: `You are a Syllabus Detail Extractor.
          Task:
          1. Extract course info and policies.
          2. Include schedule, location, office hours, contact info.
          3. Extract learning objectives, textbooks/materials, grading, attendance, late work (include make-up details), extra credit.
          4. Return STRICT JSON.
          5. If year is missing, assume 2026.`
      },
      { role: "user", content: markdown }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "syllabus_details_extraction",
        strict: true,
        schema: syllabusSchema
      }
    },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`Empty response from LLM. Finish reason: ${response.choices[0]?.finish_reason}`);
  }

  return JSON.parse(content);
}

const hasValue = (value: any) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const mergeObjects = (existing: any, incoming: any) => {
  const result = { ...(existing || {}) };
  Object.entries(incoming || {}).forEach(([key, value]) => {
    if (!hasValue(result[key]) && hasValue(value)) {
      result[key] = value;
    }
  });
  return result;
};

export async function POST(req: NextRequest) {
  if (!DOC_INTEL_ENDPOINT || !DOC_INTEL_KEY) {
    return NextResponse.json({ error: 'Azure Document Intelligence not configured.' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { resource_id, file_url } = body;

  if (!resource_id || !file_url) {
    return NextResponse.json({ error: 'resource_id and file_url required' }, { status: 400 });
  }

  try {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data: resource, error } = await supabase
      .from('resources')
      .select('id, extracted_data')
      .eq('id', resource_id)
      .single();

    if (error || !resource) {
      throw new Error('Resource not found');
    }

    const markdownContent = await extractMarkdownWithAzure(file_url);
    const structuredData = await extractDetailsWithGPT5(markdownContent);

    const existingData = resource.extracted_data || {};
    const mergedCourseInfo = mergeObjects(existingData.course_info || {}, structuredData.course_info || {});
    const mergedPolicies = mergeObjects(existingData.course_policies || {}, structuredData.course_policies || {});
    const mergedKeyTopics = hasValue(existingData.key_topics) ? existingData.key_topics : structuredData.key_topics || [];

    const mergedData = {
      ...existingData,
      ...structuredData,
      course_info: mergedCourseInfo,
      course_policies: mergedPolicies,
      key_topics: mergedKeyTopics,
      analyzed_at: new Date().toISOString(),
    };

    await supabase
      .from('resources')
      .update({ extracted_data: mergedData })
      .eq('id', resource_id);

    return NextResponse.json({ success: true, extracted_data: mergedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
  });
}
