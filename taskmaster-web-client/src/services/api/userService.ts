import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";
import type { UserData } from "../types";

export const userService = {
  async addHamizAsFriend(token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { message: "Hamiz Iqbal added as friend successfully" };
    }

    const response = await apiClient.post(
      "/user/add-hamiz",
      {},
      {
        headers: { "x-auth-token": authToken },
      }
    );
    return response.data;
  },

  async getFriends(_userId?: string, token?: string): Promise<UserData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<UserData[]>("/user/friends", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },
};

