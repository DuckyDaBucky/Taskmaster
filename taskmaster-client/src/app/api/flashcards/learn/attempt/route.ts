import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  buildSetId,
  computeNextDue,
  normalizeTopic,
  supabaseAdmin,
} from "@/app/api/flashcards/learn/_helpers";

export async function POST(request: Request) {
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
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { classId, topic, cardId, result } = body || {};

  if (!classId || !topic || !cardId || !result) {
    return NextResponse.json(
      { error: "classId, topic, cardId, result required" },
      { status: 400 }
    );
  }

  const normalizedTopic = normalizeTopic(topic);
  const setId = buildSetId(classId, normalizedTopic);

  const { data: existing } = await supabaseAdmin
    .from("flashcard_progress")
    .select(
      "id, mastery_level, total_attempts, correct_attempts, streak_correct"
    )
    .eq("user_id", user.id)
    .eq("set_id", setId)
    .eq("card_id", cardId)
    .single();

  const now = new Date();
  const previousMastery = existing?.mastery_level ?? 0;
  let masteryLevel = previousMastery;
  let streakCorrect = existing?.streak_correct ?? 0;
  let correctAttempts = existing?.correct_attempts ?? 0;
  let totalAttempts = existing?.total_attempts ?? 0;

  totalAttempts += 1;
  if (result === "correct") {
    masteryLevel = Math.min(previousMastery + 1, 4);
    correctAttempts += 1;
    streakCorrect += 1;
  } else if (result === "incorrect") {
    masteryLevel = Math.max(previousMastery - 1, 0);
    streakCorrect = 0;
  } else {
    streakCorrect = 0;
  }

  const nextDueAt = computeNextDue(result, masteryLevel, now).toISOString();

  const payload = {
    user_id: user.id,
    set_id: setId,
    card_id: cardId,
    mastery_level: masteryLevel,
    last_seen_at: now.toISOString(),
    next_due_at: nextDueAt,
    total_attempts: totalAttempts,
    correct_attempts: correctAttempts,
    streak_correct: streakCorrect,
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("flashcard_progress")
    .upsert(payload, { onConflict: "user_id,set_id,card_id" })
    .select(
      "mastery_level, next_due_at, streak_correct, total_attempts, correct_attempts"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    mastery_level: data?.mastery_level,
    next_due_at: data?.next_due_at,
    streak_correct: data?.streak_correct,
    total_attempts: data?.total_attempts,
    correct_attempts: data?.correct_attempts,
  });
}
