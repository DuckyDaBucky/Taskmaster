/**
 * API Configuration
 * Using Supabase for database and authentication
 */

export const USE_MOCK_DB = false; // Using Supabase

// Supabase configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://oyvdwqzbuevcbgrmtmvp.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dmR3cXpidWV2Y2Jncm10bXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzgzMTIsImV4cCI6MjA4MDQ1NDMxMn0.Cv_xBgXLIjS-Cy33wf1z45zYMopcQHsIVoLVVFy3zPo';

// ML Service (Flask) - still separate
export const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:6005";

