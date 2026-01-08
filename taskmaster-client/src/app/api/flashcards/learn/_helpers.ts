import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

export function buildSetId(classId: string, topic: string) {
  return `${classId}::${topic}`;
}

export function normalizeTopic(topic: string) {
  if (!topic) return "General";
  return topic
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeNextDue(
  result: "correct" | "incorrect" | "almost",
  masteryLevel: number,
  now = new Date()
) {
  if (result === "incorrect") {
    return new Date(now.getTime() + 10 * 60 * 1000);
  }
  if (result === "almost") {
    return new Date(now.getTime() + 60 * 60 * 1000);
  }

  switch (masteryLevel) {
    case 1:
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
    case 2:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 3:
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case 4:
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 4 * 60 * 60 * 1000);
  }
}
