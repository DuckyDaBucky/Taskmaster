/**
 * API Configuration
 * 
 * All config comes from environment variables.
 * See env.example for required variables.
 */

// Feature flags
export const USE_MOCK_DB = false;

// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validation is handled in lib/supabase.ts with console warnings
// DO NOT throw errors here - it causes build/load failures