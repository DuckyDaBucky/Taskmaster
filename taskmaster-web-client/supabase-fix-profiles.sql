-- Quick fix for profile creation
-- Run this in Supabase SQL Editor

-- 1. First, allow inserts with a simpler policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Allow profile inserts" ON users;
DROP POLICY IF EXISTS "Service role can insert profiles" ON users;

-- Allow anyone authenticated to insert a profile with their own ID
CREATE POLICY "Allow profile inserts"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2. Make sure SELECT works
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can read other users' profiles" ON users;

CREATE POLICY "Users can read any profile"
ON users
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow updates
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Create trigger function with SECURITY DEFINER (bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_name,
    first_name,
    last_name,
    email,
    streak,
    points,
    level,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    0,
    0,
    1,
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    user_name = EXCLUDED.user_name,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email;
  
  -- Create default Personal class
  INSERT INTO public.classes (
    name,
    professor,
    timing,
    location,
    topics,
    textbooks,
    grading_policy,
    contact_info,
    user_id,
    is_personal
  )
  VALUES (
    'Personal',
    '',
    '',
    '',
    ARRAY[]::text[],
    ARRAY[]::text[],
    '',
    '',
    NEW.id,
    true
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE WARNING 'Failed to create user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Done! Try signing up again.

