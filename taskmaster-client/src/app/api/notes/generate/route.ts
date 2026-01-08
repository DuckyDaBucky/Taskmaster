import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import DocumentIntelligence from "@azure-rest/ai-document-intelligence";
import { AzureKeyCredential } from "@azure/core-auth";
import { getLongRunningPoller, isUnexpected } from "@azure-rest/ai-document-intelligence";
import { AzureOpenAI } from "openai";

export const maxDuration = 60;

const DOC_INTEL_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || "";
const DOC_INTEL_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || "";

const AOAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "";
const AOAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const AOAI_DEPLOYMENT =
  process.env.AZURE_OPENAI_NOTES_DEPLOYMENT_NAME ||
  process.env.AZURE_OPENAI_DEPLOYMENT_NAME ||
  "gpt-5-nano";
const AOAI_API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

async function extractMarkdownWithAzure(fileUrl: string): Promise<string> {
  if (!DOC_INTEL_ENDPOINT || !DOC_INTEL_KEY) {
    throw new Error("Azure Document Intelligence not configured");
  }

  const client = DocumentIntelligence(
    DOC_INTEL_ENDPOINT,
    new AzureKeyCredential(DOC_INTEL_KEY)
  );

  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
    .post({
      contentType: "application/json",
      body: { urlSource: fileUrl },
      queryParameters: { outputContentFormat: "markdown" },
    });

  if (isUnexpected(initialResponse)) {
    throw new Error(initialResponse.body.error?.message || "Document analysis failed");
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const result = await poller.pollUntilDone();

  if (isUnexpected(result)) {
    throw new Error(result.body.error?.message || "Document analysis failed");
  }

  const content = (result.body as any).analyzeResult?.content;
  if (!content) {
    throw new Error("No content extracted from document");
  }

  return content;
}

async function generateNotes(markdown: string, className: string, topic: string) {
  if (!AOAI_ENDPOINT || !AOAI_API_KEY) {
    throw new Error("Azure OpenAI not configured");
  }

  const client = new AzureOpenAI({
    endpoint: AOAI_ENDPOINT,
    apiKey: AOAI_API_KEY,
    apiVersion: AOAI_API_VERSION,
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
    model: AOAI_DEPLOYMENT,
    messages: [
      {
        role: "system",
        content:
          "You are an expert study note writer. Produce structured, high-quality notes.",
      },
      { role: "user", content: prompt },
    ],
    max_completion_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from notes model");
  }

  return content.trim();
}

async function generateFlashcardsFromNotes(
  notesContent: string,
  className: string,
  topic: string,
  count: number
) {
  if (!AOAI_ENDPOINT || !AOAI_API_KEY) {
    throw new Error("Azure OpenAI not configured");
  }

  const client = new AzureOpenAI({
    endpoint: AOAI_ENDPOINT,
    apiKey: AOAI_API_KEY,
    apiVersion: AOAI_API_VERSION,
  });

  const systemPrompt = `You are an expert educator and flashcard creator.
Return JSON only with a "flashcards" array, each item has: question, answer, topic.`;

  const userPrompt = `Generate ${count} flashcards from these notes.
Return JSON only. The topic field must be "${topic}".

Notes:
${notesContent.substring(0, 8000)}`;

  const response = await client.chat.completions.create({
    model: AOAI_DEPLOYMENT,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from flashcard model");
  }

  const parsed = JSON.parse(content);
  return parsed.flashcards || [];
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resource_id, class_id, topic, create_flashcards, card_count } = body || {};

  if (!resource_id || !class_id || !topic) {
    return NextResponse.json(
      { error: "resource_id, class_id, and topic required" },
      { status: 400 }
    );
  }

  try {
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from("resources")
      .select("id, title, files, class_id, user_id")
      .eq("id", resource_id)
      .eq("user_id", user.id)
      .single();

    if (resourceError || !resource) {
      throw new Error(resourceError?.message || "Resource not found");
    }

    const fileUrl = resource.files?.[0]?.url;
    if (!fileUrl) {
      throw new Error("Resource file URL not found");
    }

    const { data: classData } = await supabaseAdmin
      .from("classes")
      .select("name")
      .eq("id", class_id)
      .eq("user_id", user.id)
      .single();

    const className = classData?.name || "Class";

    const markdown = await extractMarkdownWithAzure(fileUrl);
    const notesContent = await generateNotes(markdown, className, topic);

    const noteTitle = resource.title ? `${resource.title}` : `${topic} Notes`;

    const { data: insertedNote, error: noteError } = await supabaseAdmin
      .from("notes")
      .insert({
        user_id: user.id,
        class_id,
        topic,
        resource_id,
        title: noteTitle,
        content: notesContent,
      })
      .select("id, title, content, topic, class_id, resource_id, created_at")
      .single();

    if (noteError || !insertedNote) {
      throw new Error(noteError?.message || "Failed to save notes");
    }

    let flashcardsResult: any = null;
    if (create_flashcards) {
      const count = Math.min(Math.max(Number(card_count || 10), 1), 50);
      const flashcards = await generateFlashcardsFromNotes(
        notesContent,
        className,
        topic,
        count
      );

      if (flashcards.length > 0) {
        const rows = flashcards.map((card: any) => ({
          user_id: user.id,
          class_id,
          topic,
          question: card.question,
          answer: card.answer,
          description: "Notes-generated",
        }));

        const { error: insertError } = await supabaseAdmin
          .from("flashcards")
          .insert(rows);

        if (insertError) {
          throw new Error(insertError.message || "Failed to save flashcards");
        }

        flashcardsResult = {
          count: flashcards.length,
          set_url: `/flashcards/set/${encodeURIComponent(class_id)}/${encodeURIComponent(
            topic
          )}`,
        };
      }
    }

    return NextResponse.json({
      success: true,
      note: {
        id: insertedNote.id,
        title: insertedNote.title,
        topic: insertedNote.topic,
        class_id: insertedNote.class_id,
        resource_id: insertedNote.resource_id,
        created_at: insertedNote.created_at,
        content: insertedNote.content,
      },
      flashcards: flashcardsResult,
    });
  } catch (error: any) {
    console.error("[Notes Generation] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
