import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || "";
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const AZURE_OPENAI_DEPLOYMENT =
  process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-5-nano";
const AZURE_OPENAI_API_VERSION =
  process.env.AZURE_OPENAI_API_VERSION || "2024-12-01-preview";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

const RESOURCE_LABELS: Record<string, string> = {
  youtube: "Video",
  article: "Article",
  textbook: "Textbook",
  practice: "Practice",
  course: "Course",
  notes: "Notes",
  reference: "Reference",
};

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function getSourceFromUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "");
    if (host === "youtube.com" || host === "youtu.be") return "YouTube";
    if (host === "khanacademy.org") return "Khan Academy";
    if (host === "ocw.mit.edu") return "MIT OpenCourseWare";
    const base = host.split(".")[0] || host;
    return base
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Source";
  }
}

function isDisallowedUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "");
    const path = url.pathname;
    if (host === "google.com" && path === "/search") return true;
    if (host === "scholar.google.com") return true;
    if (host === "bing.com" && path === "/search") return true;
    if (host === "youtube.com" && path === "/results") return true;
    return false;
  } catch {
    return true;
  }
}

function isYoutubeWatchUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "");
    if (host === "youtu.be") {
      return url.pathname.length > 1;
    }
    if (host === "youtube.com") {
      return url.pathname === "/watch" && !!url.searchParams.get("v");
    }
    return false;
  } catch {
    return false;
  }
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function isUrlAlive(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const head = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (head.ok) return true;
    if (head.status !== 405 && head.status !== 403) return false;
  } catch {
    // Fall through to GET.
  } finally {
    clearTimeout(timeout);
  }

  const fallbackController = new AbortController();
  const fallbackTimeout = setTimeout(() => fallbackController.abort(), 5000);
  try {
    const get = await fetch(url, {
      method: "GET",
      signal: fallbackController.signal,
    });
    return get.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(fallbackTimeout);
  }
}

export async function POST(req: NextRequest) {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Azure OpenAI not configured" },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    topic,
    class_id: classId,
    user_id: userId,
    class_name: className,
    class_description: classDescription,
    textbooks,
    force,
  } = body || {};

  if (!topic || typeof topic !== "string") {
    return NextResponse.json(
      { error: "topic is required" },
      { status: 400 }
    );
  }

  if (!userId || !classId) {
    return NextResponse.json(
      { error: "user_id and class_id are required" },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  if (!force) {
    const { data: cached } = await supabase
      .from("resource_links")
      .select("title, url, type, source, description")
      .eq("user_id", userId)
      .eq("class_id", classId)
      .eq("topic", topic)
      .order("created_at", { ascending: true });

    if (cached && cached.length > 0) {
      return NextResponse.json({
        topic,
        class_name: className,
        resources: cached,
        generated_at: new Date().toISOString(),
        cached: true,
      });
    }
  }

  const client = new AzureOpenAI({
    endpoint: AZURE_OPENAI_ENDPOINT,
    apiKey: AZURE_OPENAI_API_KEY,
    apiVersion: AZURE_OPENAI_API_VERSION,
    deployment: AZURE_OPENAI_DEPLOYMENT,
  });

  try {
    const prompt = `Provide direct, high-quality resources about the topic.
Topic: ${topic}
Class: ${className || "N/A"}
Class description: ${classDescription || "N/A"}
Textbooks: ${(textbooks || []).join(", ") || "N/A"}

Rules:
- Return 3-8 items across different resource types.
- Provide direct URLs to the resource (not search pages).
- Prefer reputable sources (universities, publishers, official docs).
- For YouTube, link a specific video (watch URL).
- For practice problems, link directly to the problem set page.
- For papers/lectures, link directly to the paper or lecture page.
- If unsure of a direct link, omit the item.

Return JSON only, with exact page titles, resource type, and source name.`;

    const response = await client.chat.completions.create({
      model: AZURE_OPENAI_DEPLOYMENT,
      messages: [
        {
          role: "system",
          content:
            "You provide direct, reputable study resources and respond in JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content || "";
    if (!content) {
      throw new Error("Empty AI response");
    }

    const parsed = parseJsonObject(content);
    if (!parsed || !Array.isArray(parsed.resources)) {
      throw new Error("Malformed AI response");
    }
    const seen = new Set<string>();
    let resources = (parsed.resources || [])
      .map((item: any) => {
        const url = normalizeUrl(item.url);
        if (!url || isDisallowedUrl(url)) return null;
        if (seen.has(url)) return null;
        seen.add(url);
        const type =
          item.type === "youtube" && !isYoutubeWatchUrl(url)
            ? "reference"
            : item.type || "reference";
        return {
          title: String(item.title || "").trim() || `Resource for ${topic}`,
          url,
          type,
          source:
            String(item.source || "").trim() || getSourceFromUrl(url),
          description: String(item.description || "").trim() || undefined,
        };
      })
      .filter(Boolean);

    if (resources.length === 0) {
      const retryPrompt = `Return 3-5 direct resource URLs for the topic.
Topic: ${topic}
Class: ${className || "N/A"}

Allowed domains examples:
- youtube.com/watch (specific videos)
- ocw.mit.edu (lecture pages)
- khanacademy.org (topic pages)
- openstax.org (textbook pages)
- arxiv.org/abs (papers)
- coursera.org/learn (course pages)
- edx.org/learn (course pages)
- stanford.edu, harvard.edu, mit.edu (lecture notes)

Return JSON: {"resources":[{"type":"youtube|article|textbook|practice|course|notes|reference","title":"exact page title","url":"https://...","source":"YouTube/Khan Academy/etc","description":"optional"}]}`;

      const retryResponse = await client.chat.completions.create({
        model: AZURE_OPENAI_DEPLOYMENT,
        messages: [
          {
            role: "system",
            content:
              "You provide direct, reputable resource URLs and respond in JSON only.",
          },
          { role: "user", content: retryPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1200,
      });

      const retryContent = retryResponse.choices[0]?.message?.content || "";
      const retryParsed = parseJsonObject(retryContent);
      if (retryParsed && Array.isArray(retryParsed.resources)) {
        retryParsed.resources.forEach((item: any) => {
          const url = normalizeUrl(item.url);
          if (!url || isDisallowedUrl(url)) return;
          if (seen.has(url)) return;
          seen.add(url);
          const type =
            item.type === "youtube" && !isYoutubeWatchUrl(url)
              ? "reference"
              : item.type || "reference";
          resources.push({
            title: String(item.title || "").trim() || `Resource for ${topic}`,
            url,
            type,
            source:
              String(item.source || "").trim() || getSourceFromUrl(url),
            description: String(item.description || "").trim() || undefined,
          });
        });
      }
    }

    if (resources.length > 0) {
      const withValidation = await Promise.all(
        resources.map(async (resource: { url: string; }) => ({
          resource,
          ok: await isUrlAlive(resource.url),
        }))
      );

      resources = withValidation
        .filter((item) => item.ok)
        .map((item) => item.resource);
    }

    if (resources.length === 0) {
      return NextResponse.json({
        topic,
        class_name: className,
        resources: [],
        generated_at: new Date().toISOString(),
        error: "All generated links failed validation. Try regenerate.",
      });
    }

    if (force) {
      await supabase
        .from("resource_links")
        .delete()
        .eq("user_id", userId)
        .eq("class_id", classId)
        .eq("topic", topic);
    }

    if (resources.length > 0) {
      await supabase.from("resource_links").upsert(
        resources.map((resource: { title: any; url: any; type: any; source: any; description: any; }) => ({
          user_id: userId,
          class_id: classId,
          topic,
          title: resource.title,
          url: resource.url,
          type: resource.type,
          source: resource.source,
          description: resource.description || null,
        })),
        { onConflict: "user_id,class_id,topic,url" }
      );
    }

    return NextResponse.json({
      topic,
      class_name: className,
      resources,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Resources Recommend] Error:", error);
    return NextResponse.json({
      topic,
      class_name: className,
      resources: [],
      generated_at: new Date().toISOString(),
      error: error?.message || "Failed to generate direct resources",
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
