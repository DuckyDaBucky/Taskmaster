import { supabase } from "../../lib/supabase";
import type { FlashcardsData } from "../types";

export const flashcardService = {
  async getAllFlashcards(token?: string): Promise<FlashcardsData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('flashcards')
      .select('*, class:classes(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(card => ({
      _id: card.id,
      class: card.class_id,
      topic: card.topic || '',
      question: card.question || '',
      answer: card.answer || '',
      description: card.description,
      classData: card.class ? {
        _id: card.class.id,
        name: card.class.name || '',
      } : undefined,
    }));
  },

  async getFlashcardsByClassId(classId: string, token?: string): Promise<FlashcardsData[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('flashcards')
      .select('*, class:classes(*)')
      .eq('user_id', user.id)
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
      classData: card.class ? {
        _id: card.class.id,
        name: card.class.name || '',
      } : undefined,
    }));
  },

  async generateFlashcards(
    classId: string,
    resourceId?: string,
    token?: string
  ): Promise<FlashcardsData[]> {
    // This would call your Flask ML service to generate flashcards
    // For now, return empty array - you'll need to integrate with your ML service
    throw new Error("Flashcard generation requires ML service integration");
  },

  async createManualFlashcards(
    classId: string,
    cards: Array<{ question: string; answer: string; topic?: string }>,
    token?: string
  ): Promise<{ count: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const flashcards = cards.map(card => ({
      class_id: classId,
      topic: card.topic || null,
      question: card.question,
      answer: card.answer,
      description: null,
      user_id: user.id,
    }));

    const { data, error } = await supabase
      .from('flashcards')
      .insert(flashcards)
      .select();

    if (error) throw new Error(error.message);

    // Create activity
    await supabase.from('activities').insert({
      user_id: user.id,
      type: 'flashcard_generated',
      description: `Created ${cards.length} flashcards`,
      metadata: { classId },
    });

    return { count: data?.length || cards.length };
  },
};
