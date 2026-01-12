import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import { resourceService } from "./resourceService";
import type { NoteData } from "../types";

export interface GenerateNotesInput {
  classId: string;
  topic: string;
  file: File;
  createFlashcards?: boolean;
  flashcardCount?: number;
}

export const notesService = {
  async getAllNotes(): Promise<NoteData[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from("notes")
      .select("id, class_id, topic, title, content, resource_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    return (data || []).map((note) => ({
      _id: note.id,
      classId: note.class_id,
      topic: note.topic,
      title: note.title,
      content: note.content,
      resourceId: note.resource_id,
      createdAt: note.created_at,
    }));
  },

  async deleteNote(noteId: string): Promise<void> {
    const userId = await getCachedUserId();
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },

  async generateNotes(input: GenerateNotesInput) {
    const resource = await resourceService.smartUploadResource(input.file, input.classId, {
      skipProcessing: true,
    });

    const resourceId = resource?._id || resource?.id;
    const response = await fetch("/api/notes/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource_id: resourceId,
        class_id: input.classId,
        topic: input.topic,
        create_flashcards: input.createFlashcards,
        card_count: input.flashcardCount,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate notes");
    }

    return data;
  },
};
