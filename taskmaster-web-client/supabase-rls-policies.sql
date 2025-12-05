-- Row-Level Security Policies for users table
-- Run this in your Supabase SQL Editor

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert their own profile
-- This is needed during signup when creating the user profile
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
-- This allows the app to show friend profiles, match users, etc.
CREATE POLICY "Users can read other users' profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

-- If you want to allow service role to bypass RLS (for backend operations)
-- Note: Service role already bypasses RLS, so this is optional
-- But if you need it for specific operations, you can add:
-- CREATE POLICY "Service role bypass"
-- ON users
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);

