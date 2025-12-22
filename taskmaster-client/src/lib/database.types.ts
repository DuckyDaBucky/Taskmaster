/**
 * Database type definitions (Supabase schema)
 * Auto-generate with: npx supabase gen types typescript --linked
 */

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
                    files: unknown[] | null;
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
                    metadata: unknown;
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
