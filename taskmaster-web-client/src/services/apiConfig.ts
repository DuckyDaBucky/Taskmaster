/**
 * API Configuration
 * Set USE_MOCK_DB to true to use mock database
 * Set to false when MongoDB backend is ready
 */

export const USE_MOCK_DB = false; // Production: Using MongoDB backend

// Use relative path for serverless API (same domain) or absolute URL for separate backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:6005";

