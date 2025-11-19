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

// ===== Request Interceptor: Inject JWT Token =====
apiClient.interceptors.request.use(
  (config) => {
    // Skip token injection for auth endpoints (login) and signup
    const isAuthEndpoint = config.url?.includes("/auth");
    const isSignupEndpoint = config.url?.includes("/user") && config.method === "post";
    
    if (isAuthEndpoint || isSignupEndpoint) {
      // Still ensure CORS-friendly headers are set
      if (config.headers) {
        config.headers["Content-Type"] = "application/json";
      }
      return config;
    }

    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["x-auth-token"] = token;
    }
    
    // Ensure Content-Type is set for all requests
    if (config.headers && !config.headers["Content-Type"] && config.data) {
      config.headers["Content-Type"] = "application/json";
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

mlClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== Response Interceptor: Handle 401 Unauthorized =====
const handle401 = () => {
  // Clear authentication data
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  
  // Redirect to login page
  if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
    window.location.href = "/login";
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handle401();
    }
    return Promise.reject(error);
  }
);

mlClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handle401();
    }
    return Promise.reject(error);
  }
);

// ===== API Service Class =====
class ApiService {
  // ===== Auth Endpoints =====
  async login(emailOrUsername: string, password: string, isEmail: boolean = true): Promise<string> {
    if (USE_MOCK_DB) {
      const token = mockDB.login(emailOrUsername, password);
      if (!token) {
        throw new Error("Invalid email or password");
      }
      return token;
    }

    // Use apiClient but interceptor will skip token injection for /auth
    // Send email or userName based on what was provided
    const payload = isEmail 
      ? { email: emailOrUsername, password }
      : { userName: emailOrUsername, password };
    
    const response = await apiClient.post("/auth", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }

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
      return mockDB.signup(userData);
    }

    // Map to backend expected format
    const backendData = {
      userName: userData.userName || userData.username || "",
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email,
      password: userData.password,
    };

    console.log("Sending signup request to backend:", { ...backendData, password: "[REDACTED]" });
    const response = await apiClient.post("/user", backendData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Backend signup response:", response.data);
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

  async updateProfile(profileData: { firstName?: string; lastName?: string; pfp?: string }): Promise<any> {
    if (USE_MOCK_DB) {
      // Mock implementation
      return { ...profileData };
    }

    const token = getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await apiClient.patch(
      "/user/me",
      profileData,
      {
        headers: {
          "x-auth-token": token,
        },
      }
    );
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

    const response = await apiClient.get<TasksData[]>(`/task/classid/${classId}`, {
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

    const response = await apiClient.patch(`/task/${taskId}`, updates, {
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
      `/flashcard/class/${classId}`,
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

    const response = await apiClient.post(`/flashcard/${classId}`, {}, {
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

