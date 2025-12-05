-- Complete Supabase Setup Script
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can read other users' profiles" ON users;

-- Policy: Allow authenticated users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Allow users to read other users' profiles (for friends, matching, etc.)
CREATE POLICY "Users can read other users' profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 2. DATABASE FUNCTION TO AUTO-CREATE PROFILE
-- ============================================

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
  
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
  ON CONFLICT DO NOTHING; -- Don't error if class already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.resources TO authenticated;
GRANT ALL ON public.flashcards TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.chats TO authenticated;
GRANT ALL ON public.messages TO authenticated;

-- ============================================
-- 4. NOTES
-- ============================================
-- 
-- This setup:
-- 1. Creates RLS policies that allow users to manage their own data
-- 2. Auto-creates user profile when auth user is created (via trigger)
-- 3. Auto-creates Personal class for new users
-- 4. Handles email confirmation flow - profile created even if no session
--
-- To disable email confirmation in Supabase:
-- 1. Go to Authentication > Settings
-- 2. Disable "Enable email confirmations"
-- 3. This allows immediate login after signup

