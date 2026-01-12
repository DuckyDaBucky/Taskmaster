import { supabase } from "../../lib/supabase";
import { getCachedUserId } from "./authCache";
import type { AiConversation, AiMessage } from "../types";

export const askTaskmasterService = {
  async getConversations(): Promise<AiConversation[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      _id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createConversation(title?: string | null): Promise<AiConversation> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: userId, title: title || null })
      .select("id, title, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);

    return {
      _id: data.id,
      title: data.title,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    const userId = await getCachedUserId();
    const { error } = await supabase
      .from("ai_conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  },

  async getMessages(conversationId: string): Promise<AiMessage[]> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from("ai_messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((row) => ({
      _id: row.id,
      conversationId: row.conversation_id,
      role: row.role === "assistant" ? "assistant" : "user",
      content: row.content,
      createdAt: row.created_at,
    }));
  },

  async addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<AiMessage> {
    const userId = await getCachedUserId();

    const { data, error } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
      })
      .select("id, conversation_id, role, content, created_at")
      .single();

    if (error) throw new Error(error.message);

    await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("user_id", userId);

    return {
      _id: data.id,
      conversationId: data.conversation_id,
      role: data.role === "assistant" ? "assistant" : "user",
      content: data.content,
      createdAt: data.created_at,
    };
  },
};
