import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";
import type { ClassData } from "../types";

export const classService = {
  async getAllClasses(token?: string): Promise<ClassData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<ClassData[]>("/class", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async getClassesByUserId(userId: string, token?: string): Promise<ClassData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<ClassData[]>(`/class/user/${userId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async getPersonalClassId(token?: string): Promise<{ personalClassId: string }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { personalClassId: "" };
    }

    const response = await apiClient.get<{ personalClassId: string }>("/class/personal", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async createClass(
    classData: {
      name: string;
      professor?: string;
      timing?: string;
      location?: string;
      topics?: string[];
      textbooks?: string[];
      gradingPolicy?: string;
      contactInfo?: string;
    },
    token?: string
  ): Promise<ClassData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.post("/class", classData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async updateClass(
    classId: string,
    classData: {
      name?: string;
      professor?: string;
      timing?: string;
      location?: string;
      topics?: string[];
      textbooks?: string[];
      gradingPolicy?: string;
      contactInfo?: string;
    },
    token?: string
  ): Promise<ClassData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return {} as ClassData;
    }

    const response = await apiClient.patch(`/class/${classId}`, classData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async deleteClass(classId: string, token?: string): Promise<void> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return;
    }

    await apiClient.delete(`/class/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
  },

  async uploadSyllabus(userId: string, file: File, token?: string): Promise<{ message: string }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { message: "Syllabus uploaded successfully" };
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post(`/user/aisyllabus/${userId}/api/upload`, formData, {
      headers: {
        "x-auth-token": authToken,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

