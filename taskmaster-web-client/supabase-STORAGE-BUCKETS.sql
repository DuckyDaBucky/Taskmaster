-- =====================================================
-- SUPABASE STORAGE BUCKETS
-- Run this in Supabase SQL Editor to create storage buckets
-- =====================================================

-- Create resources storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create avatars storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create syllabi storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabi', 'syllabi', TRUE)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for resources bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload resources" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload resources"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow authenticated users to view resources" ON storage.objects;
CREATE POLICY "Allow authenticated users to view resources"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow authenticated users to update their resources" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their resources"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Allow authenticated users to delete their resources" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their resources"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resources');

-- Done!
SELECT 'Storage buckets created!' as result;

