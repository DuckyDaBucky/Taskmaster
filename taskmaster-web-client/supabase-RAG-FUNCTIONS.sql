-- =====================================================
-- RAG SEARCH FUNCTIONS
-- Run after supabase-PGVECTOR.sql and supabase-RAG-SHARED.sql
-- =====================================================

-- Function: Search user's document chunks by similarity
CREATE OR REPLACE FUNCTION match_user_documents(
  query_embedding vector(768),
  match_user_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  document_type text,
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
    dc.content,
    dc.document_type,
    dc.resource_id,
    dc.class_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM public.document_chunks dc
  WHERE dc.user_id = match_user_id
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Function: Search shared knowledge chunks by similarity
CREATE OR REPLACE FUNCTION match_shared_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  source_type text,
  class_subject text,
  class_number text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.content,
    sc.source_type,
    sc.class_subject,
    sc.class_number,
    1 - (sc.embedding <=> query_embedding) as similarity
  FROM public.shared_chunks sc
  WHERE sc.embedding IS NOT NULL
    AND 1 - (sc.embedding <=> query_embedding) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Function: Search course catalog by similarity
CREATE OR REPLACE FUNCTION match_courses(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  subject_prefix text,
  course_number text,
  title text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.subject_prefix,
    cc.course_number,
    cc.title,
    cc.description,
    1 - (cc.embedding <=> query_embedding) as similarity
  FROM public.course_catalog cc
  WHERE cc.embedding IS NOT NULL
    AND 1 - (cc.embedding <=> query_embedding) > match_threshold
  ORDER BY cc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_user_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_shared_documents TO authenticated;
GRANT EXECUTE ON FUNCTION match_courses TO authenticated;

