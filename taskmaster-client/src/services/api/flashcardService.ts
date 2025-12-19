import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { FlashcardsData } from "../types";

export const flashcardService = {
  async getAllFlashcards(): Promise<FlashcardsData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('flashcards')
      .select('id, class_id, topic, question, answer, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data || []).map(card => ({
      _id: card.id,
      class: card.class_id,
      topic: card.topic || '',
      question: card.question || '',
      answer: card.answer || '',
      description: card.description,
    }));
  },

  async getFlashcardsByClassId(classId: string): Promise<FlashcardsData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from('flashcards')
      .select('id, class_id, topic, question, answer, description')
      .eq('user_id', userId)
      .eq('class_id', classId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(card => ({
      _id: card.id,
      class: card.class_id,
      topic: card.topic || '',
      question: card.question || '',
      answer: card.answer || '',
      description: card.description,
    }));
  },

  async generateFlashcards(classId: string, resourceId?: string): Promise<FlashcardsData[]> {
    throw new Error("Flashcard generation requires ML service integration");
  },

  async createManualFlashcards(
    classId: string,
    cards: Array<{ question: string; answer: string; topic?: string }>
  ): Promise<{ count: number }> {
    const userId = await getCachedUserId();

    const flashcards = cards.map(card => ({
      class_id: classId || null,
      topic: card.topic || null,
      question: card.question,
      answer: card.answer,
      description: null,
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcards)
      .select('id');

    if (error) throw new Error(error.message);

    return { count: data?.length || cards.length };
  },
};
