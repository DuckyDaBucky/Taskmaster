import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { buildSetId, supabaseAdmin } from "@/app/api/flashcards/learn/_helpers";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const classId = url.searchParams.get("classId");
  const topic = url.searchParams.get("topic");

  if (!classId || !topic) {
    return NextResponse.json({ error: "classId and topic required" }, { status: 400 });
  }

  const setId = buildSetId(classId, topic);

  const { data, error } = await supabaseAdmin
    .from("flashcard_progress")
    .select(
      "card_id, mastery_level, last_seen_at, next_due_at, total_attempts, correct_attempts, streak_correct"
    )
    .eq("user_id", user.id)
    .eq("set_id", setId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data || [] });
}
