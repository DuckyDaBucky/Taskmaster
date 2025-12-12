-- ============================================================================
-- ADD CLASSIFICATION COLUMN TO RESOURCES
-- For document type classification (syllabus, homework, assignment, etc.)
-- ============================================================================

-- Add classification column
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'misc' 
  CHECK (classification IN (
    'syllabus', 'homework', 'assignment', 'project', 'exam', 'quiz', 
    'textbook', 'lecture_notes', 'class_material', 'study_guide', 'misc'
  ));

-- Add index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_resources_classification 
  ON public.resources(classification);

-- Update existing resources that have "syllabus" in the title
UPDATE public.resources
SET classification = 'syllabus'
WHERE LOWER(title) LIKE '%syllabus%' 
  AND classification = 'misc';

-- Stats query to see current classifications
SELECT 
  classification,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE files IS NOT NULL) as with_files
FROM public.resources
GROUP BY classification
ORDER BY count DESC;

-- ============================================================================
-- DONE! Resources now have classification field
-- ============================================================================
