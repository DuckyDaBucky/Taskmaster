import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";

export interface LearnProgressRow {
  card_id: string;
  mastery_level: number;
  last_seen_at: string | null;
  next_due_at: string | null;
  total_attempts: number;
  correct_attempts: number;
  streak_correct: number;
}

export interface LearnAttemptInput {
  classId: string;
  topic: string;
  cardId: string;
  result: "correct" | "incorrect" | "almost";
  typedAnswer?: string;
  mode?: "typed" | "mc";
}

export const learnService = {
  buildSetId(classId: string, topic: string) {
    return `${classId}::${topic}`;
  },

  async getProgressForSet(classId: string, topic: string): Promise<LearnProgressRow[]> {
    const userId = await getCachedUserId();
    const setId = this.buildSetId(classId, topic);

    const { data, error } = await supabase
      .from("flashcard_progress")
      .select("card_id, mastery_level, last_seen_at, next_due_at, total_attempts, correct_attempts, streak_correct")
      .eq("user_id", userId)
      .eq("set_id", setId);

    if (error) throw new Error(error.message);
    return data || [];
  },

  async getLearnQueue(classId: string, topic: string, newLimit = 10, dueLimit = 15) {
    const response = await fetch(
      `/api/flashcards/learn/queue?classId=${encodeURIComponent(classId)}&topic=${encodeURIComponent(
        topic
      )}&newLimit=${newLimit}&dueLimit=${dueLimit}`
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to load learn queue");
    }

    return data;
  },

  async submitAttempt(input: LearnAttemptInput) {
    const response = await fetch("/api/flashcards/learn/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId: input.classId,
        topic: input.topic,
        cardId: input.cardId,
        result: input.result,
        typedAnswer: input.typedAnswer,
        mode: input.mode,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update progress");
    }

    return data;
  },
};
