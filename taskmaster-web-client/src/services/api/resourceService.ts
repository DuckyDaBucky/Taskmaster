import { apiClient, getToken } from "./client";
import { USE_MOCK_DB } from "../apiConfig";
import type { ResourceData } from "../types";

export const resourceService = {
  async getAllResources(token?: string): Promise<ResourceData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<ResourceData[]>("/resources", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async getResourcesByClassId(classId: string, token?: string): Promise<ResourceData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<ResourceData[]>(`/resources/class/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async createResource(
    classId: string,
    resourceData: { urls?: string[]; websites?: string[] },
    token?: string
  ): Promise<ResourceData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.post(`/resources/classid/${classId}`, resourceData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  },

  async smartUploadResource(formData: FormData, token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return Promise.resolve({});
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    const response = await apiClient.post(`/resources/smart-upload`, formData, {
      headers: {
        "x-auth-token": authToken,
        // Let browser set Content-Type automatically for FormData
      },
    });
    return response.data;
  },
};

