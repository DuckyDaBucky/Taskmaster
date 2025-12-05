import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Environment Variables Required:
 * - VITE_SUPABASE_URL: Your Supabase project URL (e.g., https://xxxxx.supabase.co)
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anon/public key
 * 
 * Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
 * 
 * Create a .env file in the root directory with these variables.
 * See .env.example for a template.
 */

// Get environment variables - REQUIRED (no fallbacks for security)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration - throw errors if missing
if (!supabaseUrl) {
  const error = '❌ VITE_SUPABASE_URL is not set in environment variables';
  console.error(error);
  console.error('For local development: Set VITE_SUPABASE_URL in your .env file');
  console.error('For Vercel deployment: Add VITE_SUPABASE_URL in Vercel Dashboard → Settings → Environment Variables');
  console.error('Get your URL from: https://app.supabase.com/project/YOUR_PROJECT/settings/api');
  throw new Error(error);
}

if (!supabaseAnonKey) {
  const error = '❌ VITE_SUPABASE_ANON_KEY is not set in environment variables';
  console.error(error);
  console.error('For local development: Set VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('For Vercel deployment: Add VITE_SUPABASE_ANON_KEY in Vercel Dashboard → Settings → Environment Variables');
  console.error('Get your anon key from: https://app.supabase.com/project/YOUR_PROJECT/settings/api');
  throw new Error(error);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  console.warn('⚠️ Supabase URL should start with https://');
}

// Validate key format (JWT tokens are typically long)
if (supabaseAnonKey.length < 100) {
  console.warn('⚠️ Supabase anon key seems invalid (too short)');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  console.log('✅ Supabase configured using environment variables');
  console.log('📍 Supabase URL:', supabaseUrl);
}

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          user_name: string;
          first_name: string;
          last_name: string;
          email: string;
          pfp: string | null;
          streak: number;
          last_login_date: string | null;
          login_dates: string[];
          last_task_date: string | null;
          points: number;
          level: number;
          group_number: number | null;
          personality: number | null;
          time_preference: number | null;
          in_person: number | null;
          private_space: number | null;
          gpa: number | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          name: string | null;
          professor: string | null;
          timing: string | null;
          exam_dates: string[] | null;
          topics: string[] | null;
          grading_policy: string | null;
          contact_info: string | null;
          textbooks: string[] | null;
          location: string | null;
          description: string | null;
          user_id: string | null;
          is_personal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          topic: string | null;
          title: string | null;
          description: string | null;
          status: string;
          points: number | null;
          task_type: string | null;
          deadline: string | null;
          earned_points: number | null;
          completed: boolean;
          textbook: string | null;
          class_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      resources: {
        Row: {
          id: string;
          title: string | null;
          urls: string[] | null;
          websites: string[] | null;
          files: any[] | null; // JSONB array
          summary: string | null;
          description: string | null;
          class_id: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['resources']['Insert']>;
      };
      flashcards: {
        Row: {
          id: string;
          class_id: string;
          topic: string | null;
          question: string | null;
          answer: string | null;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['flashcards']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['flashcards']['Insert']>;
      };
      events: {
        Row: {
          id: string;
          title: string | null;
          description: string | null;
          task_id: string | null;
          course_id: string | null;
          repeat_weekly: boolean;
          start: string | null;
          end: string | null;
          notes: string[] | null;
          color: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['events']['Insert']>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          description: string;
          metadata: any; // JSONB
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['activities']['Insert']>;
      };
      chats: {
        Row: {
          id: string;
          participant_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chats']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['chats']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          text: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
};
