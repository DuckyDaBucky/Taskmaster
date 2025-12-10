-- =====================================================
-- SUPABASE PGVECTOR SETUP FOR RAG
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table (stores parsed text + embeddings)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  
  -- Content
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  
  -- Embedding (Gemini uses 768 dimensions)
  embedding vector(768),
  
  -- Metadata
  document_type TEXT DEFAULT 'document', -- 'syllabus', 'notes', 'homework', 'textbook'
  source_filename TEXT,
  
  -- Privacy
  is_shared BOOLEAN DEFAULT false, -- User opted to share
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON public.document_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Index for user filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_resource_id ON public.document_chunks(resource_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_class_id ON public.document_chunks(class_id);

-- RLS for document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own chunks" ON public.document_chunks;
CREATE POLICY "Users can manage their own chunks" 
ON public.document_chunks FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view shared chunks" ON public.document_chunks;
CREATE POLICY "Users can view shared chunks" 
ON public.document_chunks FOR SELECT 
TO authenticated 
USING (is_shared = true);

-- Add processing columns to resources table
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_parsed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ;

-- Add privacy settings to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS share_resources BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_parsing BOOLEAN DEFAULT true;

-- Function to search documents by similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(768),
  match_user_id uuid,
  match_class_id uuid DEFAULT NULL,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  resource_id uuid,
  class_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.chunk_text,
    dc.resource_id,
    dc.class_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM public.document_chunks dc
  WHERE dc.user_id = match_user_id
    AND (match_class_id IS NULL OR dc.class_id = match_class_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search shared documents (for community knowledge)
CREATE OR REPLACE FUNCTION search_shared_documents(
  query_embedding vector(768),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  resource_id uuid,
  class_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.chunk_text,
    dc.resource_id,
    dc.class_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM public.document_chunks dc
  WHERE dc.is_shared = true
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Done!
SELECT 'pgvector setup complete!' as result;

