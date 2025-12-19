-- Document Analysis Migration
-- Adds columns to resources table for AI-extracted metadata
-- Run this in Supabase SQL Editor

-- ============================================
-- ADD COLUMNS TO RESOURCES TABLE
-- For storing AI-extracted document metadata
-- ============================================

-- Add ai_summary column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'ai_summary'
  ) THEN
    ALTER TABLE resources ADD COLUMN ai_summary TEXT;
  END IF;
END $$;

-- Add extracted_data JSONB column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'extracted_data'
  ) THEN
    ALTER TABLE resources ADD COLUMN extracted_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add processing_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE resources ADD COLUMN processing_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add classification column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'classification'
  ) THEN
    ALTER TABLE resources ADD COLUMN classification TEXT;
  END IF;
END $$;

-- ============================================
-- CREATE INDEX FOR FASTER QUERIES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_resources_processing_status 
  ON resources(processing_status);

CREATE INDEX IF NOT EXISTS idx_resources_user_status 
  ON resources(user_id, processing_status);

-- ============================================
-- EXTRACTED_DATA JSONB STRUCTURE
-- ============================================
-- The extracted_data column stores:
-- {
--   "document_type": "syllabus|assignment|notes|exam|lecture|project|other",
--   "course_number": "CS3305",
--   "course_name": "Data Structures",
--   "professor": "Dr. Smith",
--   "key_topics": ["arrays", "linked lists", "trees"],
--   "due_dates": [
--     {"date": "2025-01-15", "description": "Homework 1"}
--   ],
--   "analyzed_at": "2025-01-01T00:00:00Z"
-- }

-- ============================================
-- OPTIONAL: Drop old RAG tables
-- Uncomment if you had the old pgvector setup
-- ============================================
-- DROP TABLE IF EXISTS document_chunks CASCADE;
-- DROP TABLE IF EXISTS file_search_stores CASCADE;
-- DROP TABLE IF EXISTS file_search_files CASCADE;
