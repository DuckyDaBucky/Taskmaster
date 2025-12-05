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

-- 2. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Create simple permissive policies for users
CREATE POLICY "users_all" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Enable RLS on classes table
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- 5. Create simple permissive policies for classes  
CREATE POLICY "classes_all" ON classes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.classes TO authenticated;

-- 7. Create trigger function for auto profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id, user_name, first_name, last_name, email, 
        streak, points, level, role, created_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        0, 0, 1, 'user', NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.classes (name, user_id, is_personal)
    VALUES ('Personal', NEW.id, true)
    ON CONFLICT DO NOTHING;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create profiles for any existing auth users without profiles
INSERT INTO public.users (id, user_name, first_name, last_name, email, streak, points, level, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'user_name', split_part(au.email, '@', 1)),
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    au.email,
    0, 0, 1, 'user'
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

SELECT 'Done! RLS policies created and trigger set up.' as status;

