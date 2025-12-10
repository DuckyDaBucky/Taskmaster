-- =====================================================
-- RAG SHARED KNOWLEDGE BASE
-- Run after supabase-PGVECTOR.sql
-- =====================================================

-- Shared knowledge: anonymized chunks from users who allow sharing
-- Used for cross-referencing and improving responses for all users
CREATE TABLE IF NOT EXISTS public.shared_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info (anonymized - no user_id)
  source_type TEXT NOT NULL,              -- 'syllabus', 'notes', 'homework', 'textbook'
  class_subject TEXT,                      -- e.g., 'CS', 'MATH', 'PHYS'
  class_number TEXT,                       -- e.g., '2340', '2413'
  
  -- Content
  content TEXT NOT NULL,
  embedding vector(768),
  
  -- Metadata
  chunk_count INTEGER DEFAULT 1,           -- How many times this chunk appears
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shared_chunks
CREATE INDEX IF NOT EXISTS idx_shared_chunks_subject ON public.shared_chunks(class_subject);
CREATE INDEX IF NOT EXISTS idx_shared_chunks_number ON public.shared_chunks(class_number);
CREATE INDEX IF NOT EXISTS idx_shared_chunks_type ON public.shared_chunks(source_type);
CREATE INDEX IF NOT EXISTS idx_shared_chunks_embedding ON public.shared_chunks USING hnsw (embedding vector_cosine_ops);

-- RLS: Anyone authenticated can read shared chunks
ALTER TABLE public.shared_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared chunks" ON public.shared_chunks
FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (done via API routes)
CREATE POLICY "Service can manage shared chunks" ON public.shared_chunks
FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =====================================================
-- ADD SHARING SETTINGS TO USERS
-- =====================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS allow_data_sharing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_deleted_retention BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.users.allow_data_sharing IS 'If true, anonymized document chunks can be added to shared knowledge base';
COMMENT ON COLUMN public.users.allow_deleted_retention IS 'If true, keep anonymized copies when user deletes resources';


-- =====================================================
-- ARCHIVE TABLE FOR DELETED CONTENT (if user allows)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.archived_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original source (anonymized)
  original_resource_id uuid,               -- Reference (resource may be deleted)
  source_type TEXT,
  class_subject TEXT,
  class_number TEXT,
  
  -- Content
  content TEXT NOT NULL,
  embedding vector(768),
  
  -- Metadata
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT DEFAULT 'user_deleted'       -- 'user_deleted', 'expired', 'migrated'
);

CREATE INDEX IF NOT EXISTS idx_archived_chunks_embedding ON public.archived_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.archived_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage archived chunks" ON public.archived_chunks
FOR ALL TO service_role USING (true) WITH CHECK (true);


-- =====================================================
-- FUNCTION: Archive chunks before deletion
-- Call this when a resource is deleted
-- =====================================================

CREATE OR REPLACE FUNCTION archive_user_chunks(
  p_resource_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allow_retention BOOLEAN;
BEGIN
  -- Check if user allows retention
  SELECT allow_deleted_retention INTO v_allow_retention
  FROM public.users WHERE id = p_user_id;
  
  IF v_allow_retention = TRUE THEN
    -- Copy to archived_chunks (anonymized)
    INSERT INTO public.archived_chunks (original_resource_id, source_type, class_subject, class_number, content, embedding)
    SELECT 
      dc.resource_id,
      dc.document_type,
      c.name,  -- Will need to extract subject from class name
      NULL,    -- Could parse from class name if structured
      dc.content,
      dc.embedding
    FROM public.document_chunks dc
    LEFT JOIN public.resources r ON r.id = dc.resource_id
    LEFT JOIN public.classes c ON c.id = r.class_id
    WHERE dc.resource_id = p_resource_id;
  END IF;
  
  -- Delete user's chunks
  DELETE FROM public.document_chunks WHERE resource_id = p_resource_id;
END;
$$;


-- =====================================================
-- FUNCTION: Promote chunks to shared knowledge
-- Call after processing a document (if user allows sharing)
-- =====================================================

CREATE OR REPLACE FUNCTION promote_to_shared(
  p_resource_id uuid,
  p_user_id uuid,
  p_class_subject TEXT,
  p_class_number TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_allow_sharing BOOLEAN;
BEGIN
  -- Check if user allows sharing
  SELECT allow_data_sharing INTO v_allow_sharing
  FROM public.users WHERE id = p_user_id;
  
  IF v_allow_sharing = TRUE THEN
    -- Copy to shared_chunks (no user reference)
    INSERT INTO public.shared_chunks (source_type, class_subject, class_number, content, embedding)
    SELECT 
      dc.document_type,
      p_class_subject,
      p_class_number,
      dc.content,
      dc.embedding
    FROM public.document_chunks dc
    WHERE dc.resource_id = p_resource_id;
  END IF;
END;
$$;

