import axios, { AxiosInstance } from "axios";
import { ML_SERVICE_URL } from "../apiConfig";
import { supabase } from "../../lib/supabase";

// API client (not used with Supabase, but kept for compatibility)
export const apiClient: AxiosInstance = axios.create({
  baseURL: '',
});

// ML Service client (Flask) - still separate
export const mlClient: AxiosInstance = axios.create({
  baseURL: ML_SERVICE_URL,
});

// Helper to get Supabase session token
export const getToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// Handle 401 Unauthorized
const handle401 = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("userData");

  if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
    window.location.href = "/login";
  }
};

// ML Client interceptor - add Supabase token for Flask service
mlClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

mlClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await handle401();
    }
    return Promise.reject(error);
  }
);
