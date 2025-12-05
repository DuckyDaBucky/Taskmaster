import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";
import type { UserData } from "../types";

export const authService = {
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<string> {
    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const payload = isEmail
      ? { email: emailOrUsername, password }
      : { userName: emailOrUsername, password };

    const response = await apiClient.post("/api/auth", payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  async signup(userData: {
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    userName?: string;
  }): Promise<string> {
    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const backendData = {
      userName: userData.userName || userData.username || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email,
      password: userData.password,
    };

    const response = await apiClient.post("/api/signup", backendData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  async getUserMe(token?: string): Promise<UserData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.get<UserData>("/user/me", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async updateProfile(profileData: { firstName?: string; lastName?: string; pfp?: string }): Promise<any> {
    if (USE_MOCK_DB) {
      return { ...profileData };
    }

    const token = getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await apiClient.patch("/user/me", profileData, {
      headers: { "x-auth-token": token },
    });
    return response.data;
  },

  async getLoginDates(token?: string): Promise<{ loginDates: string[]; streak: number }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { loginDates: [], streak: 0 };
    }

    const response = await apiClient.get<{ loginDates: string[]; streak: number }>("/user/login-dates", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },
};

