import { mlClient } from "./client";
import { USE_MOCK_DB } from "../apiConfig";

export const mlService = {
  async setPoints(): Promise<void> {
    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await mlClient.get("/set_points");
  },

  async matchFriends(userId: string): Promise<{ users: string[] }> {
    if (USE_MOCK_DB) {
      return { users: [] };
    }

    const response = await mlClient.post("/match", { userId });
    return response.data;
  },

  async setPreferences(
    userId: string,
    preferences: {
      personality: number;
      inPerson: number;
      privateSpace: number;
      time: number;
    }
  ): Promise<void> {
    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await mlClient.post("/set", { userId, ...preferences });
  },

  async completeTask(
    taskId: string,
    userId: string
  ): Promise<{ points: number; streak: number; level: number; earnedPoints: number }> {
    if (USE_MOCK_DB) {
      return { points: 0, streak: 0, level: 1, earnedPoints: 0 };
    }

    const response = await mlClient.post("/complete_task", { taskId, userId });
    return response.data;
  },
};

