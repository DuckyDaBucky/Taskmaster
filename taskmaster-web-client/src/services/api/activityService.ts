import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";

export const activityService = {
  async getActivities(limit: number = 20, token?: string): Promise<any[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<any[]>("/activity", {
      params: { limit },
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },
};

