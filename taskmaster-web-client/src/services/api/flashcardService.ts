import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";
import type { FlashcardsData } from "../types";

export const flashcardService = {
  async getAllFlashcards(token?: string): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<FlashcardsData[]>("/flashcard", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async getFlashcardsByClassId(classId: string, token?: string): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<FlashcardsData[]>(`/flashcard/class/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async generateFlashcards(
    classId: string,
    resourceId?: string,
    token?: string
  ): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.post(
      `/flashcard/${classId}`,
      { resourceId },
      {
        headers: { "x-auth-token": authToken },
      }
    );
    return response.data;
  },

  async createManualFlashcards(
    classId: string,
    cards: Array<{ question: string; answer: string; topic?: string }>,
    token?: string
  ): Promise<{ count: number }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { count: cards.length };
    }

    const response = await apiClient.post(
      `/flashcard/manual/${classId}`,
      { cards },
      {
        headers: { "x-auth-token": authToken },
      }
    );
    return { count: response.data.length || cards.length };
  },
};

