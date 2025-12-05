/**
 * API Configuration
 * Using Supabase for database and authentication
 * 
 * All configuration values come from environment variables.
 * See .env.example for required variables.
 */

export const USE_MOCK_DB = false; // Using Supabase

// Supabase configuration - REQUIRED from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is required in environment variables');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required in environment variables');
}

// ML Service (Flask) - still separate
export const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:6005";
