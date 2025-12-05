-- =====================================================
-- SUPABASE SETUP - RUN THIS IN SQL EDITOR
-- =====================================================

-- 1. Drop all existing policies first
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Add settings columns to users table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='theme') THEN
        ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'dark';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='display_name') THEN
        ALTER TABLE users ADD COLUMN display_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='settings') THEN
        ALTER TABLE users ADD COLUMN settings JSONB DEFAULT '{"emailNotifications": true, "pushNotifications": false, "weeklyDigest": true}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='personality') THEN
        ALTER TABLE users ADD COLUMN personality FLOAT DEFAULT 0.5;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='time_preference') THEN
        ALTER TABLE users ADD COLUMN time_preference INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='in_person') THEN
        ALTER TABLE users ADD COLUMN in_person INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='private_space') THEN
        ALTER TABLE users ADD COLUMN private_space INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tags') THEN
        ALTER TABLE users ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='interests') THEN
        ALTER TABLE users ADD COLUMN interests TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='preferred_model') THEN
        ALTER TABLE users ADD COLUMN preferred_model TEXT DEFAULT 'gemini';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='friends_list') THEN
        ALTER TABLE users ADD COLUMN friends_list UUID[] DEFAULT '{}';
    END IF;
END $$;

-- 3. Create activities table if not exists
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 5. Create simple permissive policies
CREATE POLICY "users_all" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "classes_all" ON classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "activities_all" ON activities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.activities TO authenticated;

-- 7. Create trigger function for auto profile creation with display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_name TEXT;
BEGIN
    v_user_name := COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
    
    INSERT INTO public.users (
        id, user_name, display_name, first_name, last_name, email, 
        streak, points, level, role, theme, settings, created_at
    )
    VALUES (
        NEW.id,
        v_user_name,
        v_user_name,  -- display_name same as user_name
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        0, 0, 1, 'user', 'dark',
        '{"emailNotifications": true, "pushNotifications": false, "weeklyDigest": true}',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        user_name = COALESCE(users.user_name, EXCLUDED.user_name);
    
    INSERT INTO public.classes (name, user_id, is_personal)
    VALUES ('Personal', NEW.id, true)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create profiles for any existing auth users without profiles
INSERT INTO public.users (id, user_name, display_name, first_name, last_name, email, streak, points, level, role, theme, settings)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'user_name', au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'user_name', au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    au.email,
    0, 0, 1, 'user', 'dark',
    '{"emailNotifications": true, "pushNotifications": false, "weeklyDigest": true}'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- 10. Update existing users to have display_name if missing
UPDATE public.users SET display_name = user_name WHERE display_name IS NULL;

SELECT 'Done! RLS policies, activities table, and settings columns created.' as status;

