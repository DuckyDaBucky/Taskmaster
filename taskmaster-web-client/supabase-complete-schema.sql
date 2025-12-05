-- =====================================================
-- TASKMASTER COMPLETE DATABASE SCHEMA
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. USERS TABLE (Extended)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    display_name TEXT,
    first_name TEXT DEFAULT '',
    last_name TEXT DEFAULT '',
    email TEXT,
    pfp TEXT,
    streak INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    role TEXT DEFAULT 'user',
    theme TEXT DEFAULT 'dark',
    settings JSONB DEFAULT '{"emailNotifications": true, "pushNotifications": false, "weeklyDigest": true}',
    personality FLOAT DEFAULT 0.5,
    time_preference INTEGER DEFAULT 0,
    in_person INTEGER DEFAULT 0,
    private_space INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    preferred_model TEXT DEFAULT 'gemini',
    friends_list UUID[] DEFAULT '{}',
    last_login_date TIMESTAMPTZ,
    login_dates DATE[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CLASSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    professor TEXT DEFAULT '',
    timing TEXT DEFAULT '',
    location TEXT DEFAULT '',
    description TEXT,
    topics TEXT[] DEFAULT '{}',
    textbooks TEXT[] DEFAULT '{}',
    grading_policy TEXT DEFAULT '',
    contact_info TEXT DEFAULT '',
    exam_dates TIMESTAMPTZ[] DEFAULT '{}',
    color TEXT DEFAULT '#6B6BFF',
    is_personal BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for personal class per user
CREATE UNIQUE INDEX IF NOT EXISTS classes_user_personal_idx ON public.classes (user_id, is_personal) WHERE is_personal = true;

-- =====================================================
-- 3. TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
    points INTEGER,
    earned_points INTEGER DEFAULT 0,
    deadline TIMESTAMPTZ,
    textbook TEXT,
    task_type TEXT,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. EVENTS TABLE (Calendar)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    color TEXT DEFAULT '#6B6BFF',
    event_type TEXT DEFAULT 'event',
    recurrence TEXT,
    reminder_minutes INTEGER,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    description TEXT,
    summary TEXT,
    urls TEXT[] DEFAULT '{}',
    websites TEXT[] DEFAULT '{}',
    file_paths TEXT[] DEFAULT '{}',
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. FLASHCARDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    times_reviewed INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. CHATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. FRIEND REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- =====================================================
-- DROP ALL EXISTING POLICIES
-- =====================================================
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE SIMPLE PERMISSIVE POLICIES (All authenticated)
-- =====================================================

-- Users
CREATE POLICY "users_all" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Classes
CREATE POLICY "classes_all" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks
CREATE POLICY "tasks_all" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Events
CREATE POLICY "events_all" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Resources
CREATE POLICY "resources_all" ON public.resources FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Flashcards
CREATE POLICY "flashcards_all" ON public.flashcards FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Activities
CREATE POLICY "activities_all" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chats
CREATE POLICY "chats_all" ON public.chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Messages
CREATE POLICY "messages_all" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Friend Requests
CREATE POLICY "friend_requests_all" ON public.friend_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.flashcards TO authenticated;
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.friend_requests TO authenticated;

-- =====================================================
-- TRIGGER FOR AUTO USER PROFILE CREATION
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_name TEXT;
BEGIN
    v_user_name := COALESCE(
        NEW.raw_user_meta_data->>'user_name',
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1)
    );
    
    INSERT INTO public.users (
        id, user_name, display_name, first_name, last_name, email,
        streak, points, level, role, theme, created_at
    )
    VALUES (
        NEW.id,
        v_user_name,
        v_user_name,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        0, 0, 1, 'user', 'dark', NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        updated_at = NOW();
    
    -- Create Personal class
    INSERT INTO public.classes (name, user_id, is_personal, created_at)
    VALUES ('Personal', NEW.id, true, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREATE PROFILES/CLASSES FOR EXISTING USERS
-- =====================================================
INSERT INTO public.users (id, user_name, display_name, first_name, last_name, email, streak, points, level, role, theme)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'user_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'display_name', au.raw_user_meta_data->>'user_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    au.email,
    0, 0, 1, 'user', 'dark'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Create Personal class for existing users
INSERT INTO public.classes (name, user_id, is_personal)
SELECT 'Personal', u.id, true
FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.user_id = u.id AND c.is_personal = true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STORAGE BUCKETS (run these separately if they fail)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('syllabi', 'syllabi', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', false) ON CONFLICT DO NOTHING;

SELECT 'SUCCESS! All tables created. Now try creating a task!' as status;

