-- ============================================================================
-- SYLLABUS VERIFICATION SYSTEM
-- Links uploaded syllabi to Nebula course catalog
-- ============================================================================

-- 1. Add course verification fields to resources table
ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS verified_course_number TEXT,
ADD COLUMN IF NOT EXISTS verified_course_id UUID REFERENCES public.course_catalog(id),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' 
  CHECK (verification_status IN ('pending', 'verified', 'failed', 'manual')),
ADD COLUMN IF NOT EXISTS nebula_course_id TEXT,
ADD COLUMN IF NOT EXISTS course_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS semester TEXT,
ADD COLUMN IF NOT EXISTS professor_name TEXT;

-- 2. Add indexes for course matching
CREATE INDEX IF NOT EXISTS idx_resources_verified_course 
  ON public.resources(verified_course_number, verification_status);

CREATE INDEX IF NOT EXISTS idx_resources_class_verification 
  ON public.resources(class_id, verification_status);

CREATE INDEX IF NOT EXISTS idx_resources_semester 
  ON public.resources(semester) WHERE semester IS NOT NULL;

-- 3. Create view for verified syllabi
CREATE OR REPLACE VIEW public.verified_syllabi AS
SELECT 
  r.id as resource_id,
  r.title as syllabus_title,
  r.verified_course_number,
  r.verification_status,
  r.semester,
  r.professor_name,
  r.created_at as uploaded_at,
  r.updated_at,
  c.name as class_name,
  cc.title as official_course_title,
  cc.description as course_description,
  cc.credit_hours,
  cc.prerequisites,
  u.display_name as uploaded_by
FROM public.resources r
LEFT JOIN public.classes c ON r.class_id = c.id
LEFT JOIN public.course_catalog cc ON r.verified_course_id = cc.id
LEFT JOIN public.users u ON r.user_id = u.id
WHERE r.verification_status = 'verified'
  AND r.files IS NOT NULL;

-- 4. Create view for courses with available syllabi
CREATE OR REPLACE VIEW public.courses_with_syllabi AS
SELECT 
  cc.id as course_id,
  cc.course_number,
  cc.subject_prefix,
  cc.title as course_title,
  cc.description,
  cc.credit_hours,
  cc.prerequisites,
  COUNT(r.id) as syllabus_count,
  MAX(r.semester) as latest_semester,
  MAX(r.updated_at) as last_updated,
  ARRAY_AGG(DISTINCT r.professor_name) FILTER (WHERE r.professor_name IS NOT NULL) as professors,
  ARRAY_AGG(r.id) as resource_ids
FROM public.course_catalog cc
LEFT JOIN public.resources r 
  ON cc.course_number = r.verified_course_number 
  AND r.verification_status = 'verified'
GROUP BY cc.id, cc.course_number, cc.subject_prefix, cc.title, cc.description, cc.credit_hours, cc.prerequisites
HAVING COUNT(r.id) > 0
ORDER BY cc.course_number;

-- 5. Function to auto-match course from resource title
CREATE OR REPLACE FUNCTION public.extract_course_number(resource_title TEXT)
RETURNS TEXT AS $$
DECLARE
  course_pattern TEXT := '\y([A-Z]{2,4})\s*(\d{4})\y';
  matched_course TEXT;
BEGIN
  -- Extract course number like "CS3305", "MATH 2413", etc.
  SELECT CONCAT(matches[1], matches[2])
  INTO matched_course
  FROM regexp_matches(resource_title, course_pattern, 'gi') AS matches
  LIMIT 1;
  
  RETURN matched_course;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Trigger to auto-extract course number on resource insert/update
CREATE OR REPLACE FUNCTION public.auto_extract_course_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if title exists and no verified course yet
  IF NEW.title IS NOT NULL AND NEW.verified_course_number IS NULL THEN
    NEW.verified_course_number := public.extract_course_number(NEW.title);
    
    -- Try to match with course_catalog
    IF NEW.verified_course_number IS NOT NULL THEN
      SELECT id INTO NEW.verified_course_id
      FROM public.course_catalog
      WHERE course_number = NEW.verified_course_number
      LIMIT 1;
      
      IF NEW.verified_course_id IS NOT NULL THEN
        NEW.verification_status := 'verified';
      ELSE
        NEW.verification_status := 'pending';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_extract_course ON public.resources;
CREATE TRIGGER trigger_auto_extract_course
  BEFORE INSERT OR UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_extract_course_number();

-- 7. Test the extraction function
SELECT 
  'Test course extraction' as test,
  public.extract_course_number('CS3305 Syllabus Fall 2024') as test1,
  public.extract_course_number('MATH 2413 - Calculus I') as test2,
  public.extract_course_number('Database Systems CS 3305') as test3,
  public.extract_course_number('Random Document') as test4;

-- 8. Stats query
SELECT 
  'Syllabus verification stats' as report,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending,
  COUNT(*) FILTER (WHERE verification_status = 'failed') as failed,
  COUNT(*) FILTER (WHERE verification_status = 'manual') as manual_only,
  COUNT(DISTINCT verified_course_number) as unique_courses
FROM public.resources
WHERE files IS NOT NULL;

-- ============================================================================
-- DONE!
-- - resources table enhanced with course verification
-- - Auto-extraction of course numbers from titles
-- - Views for verified syllabi and courses with syllabi
-- - Trigger for automatic course matching
-- ============================================================================
