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
                    processing_status: string | null;
                    ai_summary: string | null;
                    extracted_data: unknown | null;
                    classification: string | null;
                    verified_course_number: string | null;
                    verification_status: string | null;
                    nebula_course_id: string | null;
                    verified_course_id: string | null;
                    course_metadata: unknown | null;
                    semester: string | null;
                    professor_name: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['resources']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['resources']['Insert']>;
            };
            calendar_connections: {
                Row: {
                    id: string;
                    user_id: string;
                    provider: string;
                    access_token: string;
                    refresh_token: string;
                    expires_at: string;
                    scope: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['calendar_connections']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['calendar_connections']['Insert']>;
            };
            calendar_oauth_states: {
                Row: {
                    id: string;
                    user_id: string;
                    provider: string;
                    state: string;
                    expires_at: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['calendar_oauth_states']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['calendar_oauth_states']['Insert']>;
            };
            calendar_calendars: {
                Row: {
                    id: string;
                    user_id: string;
                    provider: string;
                    calendar_id: string;
                    name: string;
                    selected: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['calendar_calendars']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['calendar_calendars']['Insert']>;
            };
            resource_links: {
                Row: {
                    id: string;
                    user_id: string;
                    class_id: string;
                    topic: string;
                    title: string;
                    url: string;
                    type: string;
                    source: string | null;
                    description: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['resource_links']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['resource_links']['Insert']>;
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
            flashcard_progress: {
                Row: {
                    id: string;
                    user_id: string;
                    set_id: string;
                    card_id: string;
                    mastery_level: number;
                    last_seen_at: string | null;
                    next_due_at: string | null;
                    total_attempts: number;
                    correct_attempts: number;
                    streak_correct: number;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['flashcard_progress']['Row'], 'id'>;
                Update: Partial<Database['public']['Tables']['flashcard_progress']['Insert']>;
            };
            notes: {
                Row: {
                    id: string;
                    user_id: string;
                    class_id: string;
                    topic: string;
                    resource_id: string | null;
                    title: string;
                    content: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['notes']['Insert']>;
            };
            ai_conversations: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['ai_conversations']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['ai_conversations']['Insert']>;
            };
            ai_messages: {
                Row: {
                    id: string;
                    conversation_id: string;
                    user_id: string;
                    role: string;
                    content: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['ai_messages']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['ai_messages']['Insert']>;
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
