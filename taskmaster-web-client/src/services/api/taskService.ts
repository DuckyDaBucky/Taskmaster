import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";
import type { TasksData } from "../types";

export const taskService = {
  async getAllTasks(token?: string): Promise<TasksData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<TasksData[]>("/task", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async getTasksByClassId(classId: string, token?: string): Promise<TasksData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<TasksData[]>(`/task/classid/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async createTask(
    classId: string,
    taskData: {
      title: string;
      deadline?: string;
      topic?: string;
      status?: "pending" | "completed" | "overdue";
      points?: number;
      textbook?: string;
    },
    token?: string
  ): Promise<TasksData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.post(`/task/classid/${classId}`, taskData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async updateTask(taskId: string, updates: Partial<TasksData>, token?: string): Promise<TasksData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.patch(`/task/${taskId}`, updates, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async deleteTask(taskId: string, token?: string): Promise<void> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await apiClient.delete(`/task/${taskId}`, {
      headers: { "x-auth-token": authToken },
    });
  },
};

