-- Enhanced Resources Table with Classification
-- Run this in Supabase SQL Editor

-- Add new columns to resources table
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS classification TEXT,
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}'::jsonb;

-- Create document classification enum
DO $$ BEGIN
    CREATE TYPE document_classification AS ENUM (
        'syllabus',
        'homework',
        'assignment',
        'project',
        'exam',
        'quiz',
        'textbook',
        'lecture_notes',
        'class_material',
        'study_guide',
        'misc'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update classification column type (if it exists without enum)
ALTER TABLE public.resources 
ALTER COLUMN classification TYPE TEXT;

-- Create shared resources table (for cross-user resource sharing)
CREATE TABLE IF NOT EXISTS public.shared_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    source_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_hash TEXT, -- For deduplication
    classification TEXT,
    summary TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    usage_count INTEGER DEFAULT 1,
    quality_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on file hash for deduplication
CREATE INDEX IF NOT EXISTS idx_shared_resources_hash ON public.shared_resources(file_hash);
CREATE INDEX IF NOT EXISTS idx_shared_resources_classification ON public.shared_resources(classification);
CREATE INDEX IF NOT EXISTS idx_resources_classification ON public.resources(classification);
CREATE INDEX IF NOT EXISTS idx_resources_user_class ON public.resources(user_id, class_id);

-- RLS for shared_resources
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all_shared_resources" ON public.shared_resources 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.shared_resources TO authenticated;

-- Function to classify document based on content
CREATE OR REPLACE FUNCTION public.classify_document(
    p_title TEXT,
    p_content TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_title_lower TEXT;
    v_classification TEXT;
BEGIN
    v_title_lower := LOWER(p_title);
    
    -- Syllabus detection
    IF v_title_lower LIKE '%syllabus%' OR v_title_lower LIKE '%course outline%' THEN
        RETURN 'syllabus';
    
    -- Homework detection
    ELSIF v_title_lower LIKE '%homework%' OR v_title_lower LIKE '%hw%' OR v_title_lower LIKE '%problem set%' THEN
        RETURN 'homework';
    
    -- Assignment detection
    ELSIF v_title_lower LIKE '%assignment%' OR v_title_lower LIKE '%assmt%' THEN
        RETURN 'assignment';
    
    -- Project detection
    ELSIF v_title_lower LIKE '%project%' OR v_title_lower LIKE '%proj%' THEN
        RETURN 'project';
    
    -- Exam detection
    ELSIF v_title_lower LIKE '%exam%' OR v_title_lower LIKE '%test%' OR v_title_lower LIKE '%midterm%' OR v_title_lower LIKE '%final%' THEN
        RETURN 'exam';
    
    -- Quiz detection
    ELSIF v_title_lower LIKE '%quiz%' THEN
        RETURN 'quiz';
    
    -- Textbook detection
    ELSIF v_title_lower LIKE '%textbook%' OR v_title_lower LIKE '%book%' OR v_title_lower LIKE '%chapter%' THEN
        RETURN 'textbook';
    
    -- Lecture notes detection
    ELSIF v_title_lower LIKE '%lecture%' OR v_title_lower LIKE '%notes%' OR v_title_lower LIKE '%lec%' THEN
        RETURN 'lecture_notes';
    
    -- Study guide detection
    ELSIF v_title_lower LIKE '%study guide%' OR v_title_lower LIKE '%review%' OR v_title_lower LIKE '%cheat sheet%' THEN
        RETURN 'study_guide';
    
    -- Default
    ELSE
        RETURN 'misc';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to auto-classify on insert/update
CREATE OR REPLACE FUNCTION public.auto_classify_resource()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.classification IS NULL OR NEW.classification = '' THEN
        NEW.classification := public.classify_document(NEW.title, NEW.description);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-classification
DROP TRIGGER IF EXISTS trigger_auto_classify_resource ON public.resources;
CREATE TRIGGER trigger_auto_classify_resource
BEFORE INSERT OR UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.auto_classify_resource();

-- Function to archive chunks (for delete operation)
CREATE OR REPLACE FUNCTION public.archive_user_chunks(
    p_resource_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- If document_chunks table exists, archive them to shared_resources
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_chunks') THEN
        -- Move to shared resources (simplified version)
        -- In production, this would aggregate chunks and deduplicate
        UPDATE public.document_chunks
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{archived}',
            'true'::jsonb
        )
        WHERE resource_id = p_resource_id AND user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill classifications for existing resources
UPDATE public.resources
SET classification = public.classify_document(title, description)
WHERE classification IS NULL;

SELECT 'Resource classification system installed!' as result;
