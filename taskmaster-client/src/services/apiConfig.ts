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

// Validate on startup
if (!SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL required. Add to Vercel env or .env.local');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY required. Add to Vercel env or .env.local');
}
