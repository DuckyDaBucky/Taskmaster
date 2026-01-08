import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  buildSetId,
  normalizeTopic,
  supabaseAdmin,
} from "@/app/api/flashcards/learn/_helpers";

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
  const rawTopic = url.searchParams.get("topic");
  const dueLimit = Number(url.searchParams.get("dueLimit") || 15);
  const newLimit = Number(url.searchParams.get("newLimit") || 10);

  if (!classId || !rawTopic) {
    return NextResponse.json({ error: "classId and topic required" }, { status: 400 });
  }

  const topic = normalizeTopic(rawTopic);
  const setId = buildSetId(classId, topic);

  const flashcardsQuery = supabaseAdmin
    .from("flashcards")
    .select("id, question, answer, topic, class_id")
    .eq("user_id", user.id);

  if (classId === "personal") {
    flashcardsQuery.is("class_id", null);
  } else {
    flashcardsQuery.eq("class_id", classId);
  }

  const { data: cards, error: cardsError } = await flashcardsQuery;
  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  const scopedCards = (cards || []).filter(
    (card) => normalizeTopic(card.topic || "General") === topic
  );

  if (scopedCards.length === 0) {
    return NextResponse.json({ cards: [], progress: [], queue: [] });
  }

  const cardsForClient = scopedCards.map((card) => ({
    _id: card.id,
    class: card.class_id,
    topic: card.topic || "General",
    question: card.question || "",
    answer: card.answer || "",
  }));

  const { data: progressRows } = await supabaseAdmin
    .from("flashcard_progress")
    .select(
      "card_id, mastery_level, last_seen_at, next_due_at, total_attempts, correct_attempts, streak_correct"
    )
    .eq("user_id", user.id)
    .eq("set_id", setId);

  const progressMap = new Map(
    (progressRows || []).map((row: any) => [row.card_id, row])
  );

  const missingRows = scopedCards
    .filter((card) => !progressMap.has(card.id))
    .map((card) => ({
      user_id: user.id,
      set_id: setId,
      card_id: card.id,
      mastery_level: 0,
      last_seen_at: null,
      next_due_at: null,
      total_attempts: 0,
      correct_attempts: 0,
      streak_correct: 0,
      updated_at: new Date().toISOString(),
    }));

  if (missingRows.length > 0) {
    await supabaseAdmin.from("flashcard_progress").upsert(missingRows, {
      onConflict: "user_id,set_id,card_id",
    });
    missingRows.forEach((row) => progressMap.set(row.card_id, row));
  }

  const now = new Date();
  const dueCards = scopedCards.filter((card) => {
    const progress = progressMap.get(card.id);
    if (!progress) return true;
    if (!progress.next_due_at) return true;
    return new Date(progress.next_due_at) <= now;
  });

  const newCards = scopedCards.filter((card) => {
    const progress = progressMap.get(card.id);
    return progress ? progress.mastery_level === 0 && !progress.next_due_at : true;
  });

  let queueCards = [
    ...dueCards.slice(0, dueLimit),
    ...newCards.slice(0, newLimit),
  ];

  if (queueCards.length === 0 && scopedCards.length > 0) {
    queueCards = scopedCards.slice(0, Math.max(1, dueLimit));
  }

  return NextResponse.json({
    cards: cardsForClient,
    progress: Array.from(progressMap.values()),
    queue: queueCards.map((card) => card.id),
  });
}
