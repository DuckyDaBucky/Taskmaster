-- RUN THIS TO CREATE ALL TABLES
-- Copy and paste into Supabase SQL Editor

-- 1. USERS
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
    theme TEXT DEFAULT 'light',
    personality FLOAT DEFAULT 0.5,
    time_preference INTEGER DEFAULT 0,
    in_person INTEGER DEFAULT 0,
    private_space INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    login_dates DATE[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    professor TEXT DEFAULT '',
    timing TEXT DEFAULT '',
    location TEXT DEFAULT '',
    topics TEXT[] DEFAULT '{}',
    textbooks TEXT[] DEFAULT '{}',
    grading_policy TEXT DEFAULT '',
    contact_info TEXT DEFAULT '',
    is_personal BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    status TEXT DEFAULT 'pending',
    points INTEGER,
    earned_points INTEGER DEFAULT 0,
    deadline TIMESTAMPTZ,
    textbook TEXT,
    task_type TEXT,
    completed BOOLEAN DEFAULT false,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    color TEXT DEFAULT '#6B6BFF',
    recurrence TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RESOURCES
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    description TEXT,
    summary TEXT,
    urls TEXT[] DEFAULT '{}',
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FLASHCARDS
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DROP ALL POLICIES
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ALLOW EVERYTHING FOR AUTHENTICATED USERS
CREATE POLICY "all_users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_classes" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_tasks" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_resources" ON public.resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_flashcards" ON public.flashcards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all_activities" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANTS
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.flashcards TO authenticated;
GRANT ALL ON public.activities TO authenticated;

-- TRIGGER FOR AUTO PROFILE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.users (id, user_name, display_name, first_name, last_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email
    ) ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.classes (name, user_id, is_personal)
    VALUES ('Personal', NEW.id, true) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CREATE PROFILES FOR EXISTING USERS
INSERT INTO public.users (id, user_name, display_name, email)
SELECT id, COALESCE(raw_user_meta_data->>'user_name', split_part(email, '@', 1)), 
       COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), email
FROM auth.users ON CONFLICT (id) DO NOTHING;

-- CREATE PERSONAL CLASS FOR EXISTING USERS
INSERT INTO public.classes (name, user_id, is_personal)
SELECT 'Personal', id, true FROM public.users
WHERE NOT EXISTS (SELECT 1 FROM public.classes WHERE user_id = users.id AND is_personal = true)
ON CONFLICT DO NOTHING;

SELECT 'ALL TABLES CREATED!' as result;

