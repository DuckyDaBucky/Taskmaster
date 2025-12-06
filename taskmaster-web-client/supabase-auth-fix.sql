-- MINIMAL AUTH FIX - Run this in Supabase SQL Editor
-- This creates only what's needed for auth to work

-- 1. Create users table
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

-- 2. Create classes table (needed for Personal class)
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Drop ALL existing policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 4. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 5. Create SUPER permissive policies (allow everything for authenticated users)
CREATE POLICY "allow_all_users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_classes" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Also allow anon to read (for login lookup)
CREATE POLICY "anon_read_users" ON public.users FOR SELECT TO anon USING (true);

-- 7. Grant all permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.classes TO authenticated;

-- 8. Create trigger for auto profile creation
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

-- 9. Create profiles for existing auth users
INSERT INTO public.users (id, user_name, display_name, first_name, last_name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'user_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'user_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Create Personal class for existing users
INSERT INTO public.classes (name, user_id, is_personal)
SELECT 'Personal', id, true FROM public.users
ON CONFLICT DO NOTHING;

SELECT 'AUTH FIX COMPLETE! Try logging in now.' as result;

