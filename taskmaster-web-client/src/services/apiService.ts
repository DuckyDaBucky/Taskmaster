import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { API_BASE_URL, USE_MOCK_DB, ML_SERVICE_URL } from "./apiConfig";
import type {
  UserData,
  ClassData,
  TasksData,
  ResourceData,
  FlashcardsData
} from "./types";

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
      throw new Error("Mock DB not available");
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
      throw new Error("Mock DB not available");
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
      throw new Error("Mock DB not available");
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
      return [];
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
      // Mock DB not available
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
  async getAllTasks(token?: string): Promise<TasksData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<TasksData[]>("/task", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getTasksByClassId(classId: string, token?: string): Promise<TasksData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<TasksData[]>(`/task/classid/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async deleteTask(taskId: string, token?: string): Promise<void> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await apiClient.delete(`/task/${taskId}`, {
      headers: { "x-auth-token": authToken },
    });
  }

  async updateTask(
    taskId: string,
    updates: Partial<TasksData>,
    token?: string
  ): Promise<TasksData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.patch(`/task/${taskId}`, updates, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  // ===== Resource Endpoints =====
  async getAllResources(token?: string): Promise<ResourceData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<ResourceData[]>("/resources", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getResourcesByClassId(
    classId: string,
    token?: string
  ): Promise<ResourceData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
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
  async getAllFlashcards(token?: string): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<FlashcardsData[]>("/flashcard", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getFlashcardsByClassId(
    classId: string,
    token?: string
  ): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<FlashcardsData[]>(
      `/flashcard/class/${classId}`,
      {
        headers: { "x-auth-token": authToken },
      }
    );
    return response.data;
  }

  async generateFlashcards(classId: string, resourceId?: string, token?: string): Promise<FlashcardsData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.post(`/flashcard/${classId}`, { resourceId }, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async createManualFlashcards(classId: string, cards: Array<{ question: string; answer: string; topic?: string }>, token?: string): Promise<{ count: number }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { count: cards.length };
    }

    const response = await apiClient.post(`/flashcard/manual/${classId}`, { cards }, {
      headers: { "x-auth-token": authToken },
    });
    return { count: response.data.length || cards.length };
  }

  // ===== Task Creation =====
  async createTask(classId: string, taskData: {
    title: string;
    deadline?: string;
    topic?: string;
    status?: "pending" | "completed" | "overdue";
    points?: number;
    textbook?: string;
  }, token?: string): Promise<TasksData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.post(`/task/classid/${classId}`, taskData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  // ===== Event Creation =====
  async createEvent(eventData: {
    title: string;
    start: Date | string;
    end: Date | string;
    taskInput?: string;
    classInput?: string;
    repeatWeekly?: boolean;
    notes?: string[];
    color?: string;
  }, token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { id: `event-${Date.now()}`, ...eventData };
    }

    const payload = {
      ...eventData,
      start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
      end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
    };

    const response = await apiClient.post("/event", payload, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getEvents(userId: string, token?: string): Promise<any[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get(`/event/getAllEvents/${userId}`, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async updateEvent(eventId: string, eventData: {
    title?: string;
    start?: Date | string;
    end?: Date | string;
    taskInput?: string;
    classInput?: string;
    repeatWeekly?: boolean;
    notes?: string[];
    color?: string;
  }, token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { id: eventId, ...eventData };
    }

    const payload = {
      ...eventData,
      start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
      end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
    };

    const response = await apiClient.post(`/event/editEvent/${eventId}`, payload, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async deleteEvent(eventId: string, token?: string): Promise<void> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await apiClient.get(`/event/deleteEvent/${eventId}`, {
      headers: { "x-auth-token": authToken },
    });
  }

  // ===== Class Creation =====
  async createClass(classData: {
    name: string;
    professor?: string;
    timing?: string;
    location?: string;
    topics?: string[];
    textbooks?: string[];
    gradingPolicy?: string;
    contactInfo?: string;
  }, token?: string): Promise<ClassData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.post("/class", classData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getAllClasses(token?: string): Promise<ClassData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<ClassData[]>("/class", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getPersonalClassId(token?: string): Promise<{ personalClassId: string }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { personalClassId: "" };
    }

    const response = await apiClient.get<{ personalClassId: string }>("/class/personal", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async updateClass(classId: string, classData: {
    name?: string;
    professor?: string;
    timing?: string;
    location?: string;
    topics?: string[];
    textbooks?: string[];
    gradingPolicy?: string;
    contactInfo?: string;
  }, token?: string): Promise<ClassData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return {} as ClassData;
    }

    const response = await apiClient.patch(`/class/${classId}`, classData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async deleteClass(classId: string, token?: string): Promise<void> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return;
    }

    await apiClient.delete(`/class/${classId}`, {
      headers: { "x-auth-token": authToken },
    });
  }

  // ===== Resource Creation =====
  async createResource(classId: string, resourceData: {
    urls?: string[];
    websites?: string[];
  }, token?: string): Promise<ResourceData> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      throw new Error("Mock DB not available");
    }

    const response = await apiClient.post(`/resources/classid/${classId}`, resourceData, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async smartUploadResource(formData: FormData, token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return Promise.resolve({});
    }

    const response = await apiClient.post(`/resources/smart-upload`, formData, {
      headers: { 
        "x-auth-token": authToken,
        "Content-Type": "multipart/form-data"
      },
    });
    return response.data;
  }

  // ===== Friend Management =====
  async addHamizAsFriend(token?: string): Promise<any> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { message: "Hamiz Iqbal added as friend successfully" };
    }

    const response = await apiClient.post("/user/add-hamiz", {}, {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }

  async getFriends(_userId?: string, token?: string): Promise<UserData[]> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return [];
    }

    const response = await apiClient.get<UserData[]>("/user/friends", {
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
      return { users: [] };
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
        // Mock DB not available
      }
      return Promise.resolve();
    }

    await mlClient.post("/set", preferences);
  }

  async completeTask(taskId: string, userId: string): Promise<void> {
    if (USE_MOCK_DB) {
      return Promise.resolve();
    }

    await mlClient.post("/complete_task", { taskId, userId });
  }

  // ===== Activity Endpoints =====
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
  }

  // ===== User Endpoints (additional) =====
  async getLoginDates(token?: string): Promise<{ loginDates: string[]; streak: number }> {
    const authToken = token || getToken() || "";

    if (USE_MOCK_DB) {
      return { loginDates: [], streak: 0 };
    }

    const response = await apiClient.get<{ loginDates: string[]; streak: number }>("/user/login-dates", {
      headers: { "x-auth-token": authToken },
    });
    return response.data;
  }
}

// ===== Export Singleton Instance =====
export const apiService = new ApiService();

// ===== Export axios instances for direct use if needed =====
export { apiClient, mlClient };

