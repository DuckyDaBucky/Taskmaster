/**
 * API Service - Switches between Mock Database and Real API
 * When USE_MOCK_DB is true, uses mockDatabase
 * When false, uses real axios calls
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { USE_MOCK_DB, API_BASE_URL, ML_SERVICE_URL } from "./apiConfig";
import { mockDB } from "./mockDatabase";
import type {
  UserData,
  ClassData,
  TasksData,
  ResourceData,
  FlashcardsData,
} from "./mockDatabase";

// Create axios instance for real API calls
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

const mlClient: AxiosInstance = axios.create({
  baseURL: ML_SERVICE_URL,
});

// ===== Helper to get token from headers or localStorage =====
const getToken = (config?: AxiosRequestConfig): string | null => {
  if (config?.headers?.["x-auth-token"]) {
    return config.headers["x-auth-token"] as string;
  }
  return localStorage.getItem("token");
};

// ===== API Service Class =====
class ApiService {
  // ===== Auth Endpoints =====
  async login(email: string, password: string): Promise<string> {
    if (USE_MOCK_DB) {
      const token = mockDB.login(email, password);
      if (!token) {
        throw new Error("Invalid email or password");
      }
      return token;
    }

    const response = await axios.post(`${API_BASE_URL}/auth`, { email, password });
    return response.data;
  }

  async signup(userData: {
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  }): Promise<string> {
    if (USE_MOCK_DB) {
      return mockDB.signup(userData);
    }

    const response = await apiClient.post("/user", userData);
    return response.data;
  }

  // ===== User Endpoints =====
  async getUserMe(token?: string): Promise<UserData> {
    const authToken = token || getToken() || "";
    
    if (USE_MOCK_DB) {
      const user = mockDB.getUserByToken(authToken);
      if (!user) {
        throw new Error("Unauthorized");
      }
      return user;
    }

    const response = await apiClient.get<UserData>("/user/me", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  // ===== Class Endpoints =====
  async getClassesByUserId(userId: string, token?: string): Promise<ClassData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return mockDB.getClassesByUserId(userId);
    }

    const response = await apiClient.get<ClassData[]>(`/class/user/${userId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async uploadSyllabus(
    userId: string,
    file: File,
    token?: string
  ): Promise<{ message: string }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      // Simulate class creation from syllabus
      const classData: Partial<ClassData> = {
        name: file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension
        professor: "Extracted from Syllabus",
        timing: "TBA",
        examDates: [],
        topics: [],
        gradingPolicy: "TBA",
        contactInfo: "",
        textbooks: [],
        location: "TBA",
      };
      mockDB.createClass(classData, userId);
      return { message: "Syllabus uploaded successfully" };
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(
      `/user/aisyllabus/${userId}/api/upload`,
      formData,
      {
        headers: {
          "x-auth-token": authToken,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  // ===== Task Endpoints =====
  async getTasksByClassId(classId: string, token?: string): Promise<TasksData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return mockDB.getTasksByClassId(classId);
    }

    const response = await apiClient.get<TasksData[]>(`/tasks/classid/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async updateTask(
    taskId: string,
    updates: Partial<TasksData>,
    token?: string
  ): Promise<TasksData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      const updated = mockDB.updateTask(taskId, updates);
      if (!updated) throw new Error("Task not found");
      return updated;
    }

    const response = await apiClient.patch(`/tasks/${taskId}`, updates, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  // ===== Resource Endpoints =====
  async getResourcesByClassId(
    classId: string,
    token?: string
  ): Promise<ResourceData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return mockDB.getResourcesByClassId(classId);
    }

    const response = await apiClient.get<ResourceData[]>(
      `/resources/class/${classId}`,
      {
        headers: { "x-auth-token": authToken },
      }
    );
    return response.data;
  }

  // ===== Flashcard Endpoints =====
  async getFlashcardsByClassId(
    classId: string,
    token?: string
  ): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return mockDB.getFlashcardsByClassId(classId);
    }

    const response = await apiClient.get<FlashcardsData[]>(
      `/cards/class/${classId}`,
      {
        headers: { "x-auth-token": authToken },
      }
    );
    return response.data;
  }

  async generateFlashcards(classId: string, token?: string): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return mockDB.generateFlashcards(classId);
    }

    const response = await apiClient.post(`/cards/${classId}`, {}, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  // ===== ML Service Endpoints (Port 6005) =====
  async setPoints(): Promise<void> {
    if (USE_MOCK_DB) {
      // Mock implementation - no-op
      return Promise.resolve();
    }

    await mlClient.get("/set_points");
  }

  async matchFriends(userId: string): Promise<{ users: string[] }> {
    if (USE_MOCK_DB) {
      const matchedIds = mockDB.getMatchedFriends(userId);
      return { users: matchedIds };
    }

    const response = await mlClient.post("/match", { userId });
    return response.data;
  }

  async setPreferences(preferences: {
    personality: number;
    inPerson: number;
    privateSpace: number;
    time: number;
  }): Promise<void> {
    if (USE_MOCK_DB) {
      const token = getToken();
      if (token) {
        const user = mockDB.getUserByToken(token);
        if (user) {
          mockDB.updateUserPreferences(user._id, preferences);
        }
      }
      return Promise.resolve();
    }

    await mlClient.post("/set", preferences);
  }

  async completeTask(taskId: string, userId: string): Promise<void> {
    if (USE_MOCK_DB) {
      mockDB.updateTask(taskId, { status: "completed" });
      return Promise.resolve();
    }

    await mlClient.post("/complete_task", { taskId, userId });
  }
}

// ===== Export Singleton Instance =====
export const apiService = new ApiService();

// ===== Export axios instances for direct use if needed =====
export { apiClient, mlClient };

