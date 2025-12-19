import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * REQUIRED Environment Variables:
 * ================================
 * 1. VITE_SUPABASE_URL
 *    - Your Supabase project URL
 *    - Example: https://xxxxx.supabase.co
 *    - Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
 * 
 * 2. VITE_SUPABASE_ANON_KEY
 *    - Your Supabase anon/public key (NOT the service role key!)
 *    - This is safe to expose in client-side code
 *    - Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
 * 
 * Setup:
 * ------
 * Local Development:
 *   - Create .env file in taskmaster-web-client/
 *   - Add: VITE_SUPABASE_URL=...
 *   - Add: VITE_SUPABASE_ANON_KEY=...
 * 
 * Vercel Deployment:
 *   - Go to: Vercel Dashboard → Project → Settings → Environment Variables
 *   - Add both variables for Production, Preview, and Development
 *   - Redeploy after adding
 */

// ============================================
// ENVIRONMENT VARIABLES - REQUIRED
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================
// VALIDATION - REQUIRED ENVIRONMENT VARIABLES
// ============================================
if (!supabaseUrl) {
  const error = 'VITE_SUPABASE_URL is not set in environment variables';
  console.error('-----------------------------------------------------------');
  console.error('SUPABASE CONFIGURATION ERROR');
  console.error('-----------------------------------------------------------');
  console.error(error);
  console.error('');
  console.error('Required Environment Variables:');
  console.error('   1. VITE_SUPABASE_URL');
  console.error('   2. VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Local Development:');
  console.error('   - Create .env file in taskmaster-web-client/');
  console.error('   - Add: VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   - Add: VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('');
  console.error('Vercel Deployment:');
  console.error('   - Go to: Vercel Dashboard > Settings > Environment Variables');
  console.error('   - Add both variables for Production, Preview, Development');
  console.error('   - Redeploy after adding');
  console.error('');
  console.error('Get credentials from:');
  console.error('   https://app.supabase.com/project/YOUR_PROJECT/settings/api');
  console.error('-----------------------------------------------------------');
  throw new Error(error);
}

if (!supabaseAnonKey) {
  const error = 'VITE_SUPABASE_ANON_KEY is not set in environment variables';
  console.error('-----------------------------------------------------------');
  console.error('SUPABASE CONFIGURATION ERROR');
  console.error('-----------------------------------------------------------');
  console.error(error);
  console.error('');
  console.error('Required Environment Variables:');
  console.error('   1. VITE_SUPABASE_URL');
  console.error('   2. VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Local Development:');
  console.error('   - Create .env file in taskmaster-web-client/');
  console.error('   - Add: VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   - Add: VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('');
  console.error('Vercel Deployment:');
  console.error('   - Go to: Vercel Dashboard > Settings > Environment Variables');
  console.error('   - Add both variables for Production, Preview, Development');
  console.error('   - Redeploy after adding');
  console.error('');
  console.error('Get credentials from:');
  console.error('   https://app.supabase.com/project/YOUR_PROJECT/settings/api');
  console.error('-----------------------------------------------------------');
  throw new Error(error);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  console.warn('[Warning] Supabase URL should start with https://');
}

// Validate key format (JWT tokens are typically long)
if (supabaseAnonKey.length < 100) {
  console.warn('[Warning] Supabase anon key seems invalid (too short)');
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
  console.log('[Supabase] Configured using environment variables');
  console.log('[Supabase] URL:', supabaseUrl);
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
