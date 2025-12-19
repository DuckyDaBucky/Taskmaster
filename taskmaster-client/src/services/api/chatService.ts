/**
 * Chat Service - Supabase
 * Handles messages and chats
 */

import { supabase } from "../../lib/supabase";

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Chat {
  id: string;
  participant_ids: string[];
  created_at: string;
  updated_at: string;
}

export const chatService = {
  /**
   * Get all messages for a chat
   */
  async getMessages(chatId: string): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Verify user is participant in chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('participant_ids')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      throw new Error("Chat not found");
    }

    if (!chat.participant_ids.includes(user.id)) {
      throw new Error("Not authorized to view this chat");
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []) as Message[];
  },

  /**
   * Send a message
   */
  async sendMessage(chatId: string, text: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Verify user is participant
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('participant_ids')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      throw new Error("Chat not found");
    }

    if (!chat.participant_ids.includes(user.id)) {
      throw new Error("Not authorized to send messages in this chat");
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        text: text,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Update chat updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return data as Message;
  },

  /**
   * Get or create a chat between users
   */
  async getOrCreateChat(participantIds: string[]): Promise<Chat> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Ensure current user is in participants
    if (!participantIds.includes(user.id)) {
      participantIds.push(user.id);
    }

    // Sort to ensure consistent lookup
    const sortedIds = [...participantIds].sort();

    // Try to find existing chat
    const { data: existingChats, error: searchError } = await supabase
      .from('chats')
      .select('*');

    if (searchError) throw new Error(searchError.message);

    // Find chat with exact same participants
    const existingChat = existingChats?.find(chat => {
      const chatParticipants = [...(chat.participant_ids || [])].sort();
      return JSON.stringify(chatParticipants) === JSON.stringify(sortedIds);
    });

    if (existingChat) {
      return existingChat as Chat;
    }

    // Create new chat
    const { data: newChat, error: createError } = await supabase
      .from('chats')
      .insert({
        participant_ids: sortedIds,
      })
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    return newChat as Chat;
  },

  /**
   * Get all chats for current user
   */
  async getUserChats(): Promise<Chat[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .contains('participant_ids', [user.id])
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []) as Chat[];
  },

  /**
   * Get friends (users in chats with current user)
   */
  async getFriends(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get all chats user is in
    const chats = await this.getUserChats();

    // Extract all participant IDs
    const friendIds = new Set<string>();
    chats.forEach(chat => {
      chat.participant_ids.forEach(id => {
        if (id !== user.id) {
          friendIds.add(id);
        }
      });
    });

    if (friendIds.size === 0) {
      return [];
    }

    // Get user profiles
    const { data: friends, error } = await supabase
      .from('users')
      .select('id, user_name, first_name, last_name, email, pfp')
      .in('id', Array.from(friendIds));

    if (error) throw new Error(error.message);

    return (friends || []).map(friend => ({
      _id: friend.id,
      username: friend.user_name,
      firstName: friend.first_name,
      lastName: friend.last_name,
      email: friend.email,
      profileImageUrl: friend.pfp,
    }));
  },
};

