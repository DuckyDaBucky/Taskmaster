import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { API_BASE_URL, ML_SERVICE_URL } from "../apiConfig";

// Create axios instance for real API calls
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export const mlClient: AxiosInstance = axios.create({
  baseURL: ML_SERVICE_URL,
});

// Helper to get token from headers or localStorage
export const getToken = (config?: AxiosRequestConfig): string | null => {
  if (config?.headers?.["x-auth-token"]) {
    return config.headers["x-auth-token"] as string;
  }
  return localStorage.getItem("token");
};

// Handle 401 Unauthorized
const handle401 = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userData");

  if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
    window.location.href = "/login";
  }
};

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const isAuthEndpoint = config.url?.includes("/api/auth");
    const isSignupEndpoint = config.url?.includes("/api/signup");

    if (isAuthEndpoint || isSignupEndpoint) {
      if (config.headers) {
        config.headers["Content-Type"] = "application/json";
      }
      return config;
    }

    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["x-auth-token"] = token;
    }

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (config.headers && !config.headers["Content-Type"] && config.data && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

mlClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
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

