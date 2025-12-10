-- =====================================================
-- UTD COURSE CATALOG CACHE TABLE
-- Stores course data from Nebula API or manual entry
-- Run this in Supabase SQL Editor
-- =====================================================

-- Course catalog table (shared across all users)
CREATE TABLE IF NOT EXISTS public.course_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Course identifiers
  subject_prefix TEXT NOT NULL,           -- e.g., "CS", "MATH", "PHYS"
  course_number TEXT NOT NULL,            -- e.g., "2340", "1325"
  internal_id TEXT,                       -- Nebula _id if available
  
  -- Course info
  title TEXT NOT NULL,                    -- e.g., "Computer Architecture"
  description TEXT,
  credit_hours TEXT DEFAULT '3',
  class_level TEXT,                       -- "Undergraduate", "Graduate"
  school TEXT,                            -- "Engineering and Computer Science"
  
  -- Prerequisites (stored as JSON)
  prerequisites JSONB DEFAULT '[]'::jsonb,
  corequisites JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'manual',           -- 'nebula', 'manual', 'scraped'
  semester TEXT,                          -- e.g., "25s" for Spring 2025
  
  -- Embedding for semantic search
  embedding vector(768),
  
  UNIQUE(subject_prefix, course_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_catalog_prefix ON public.course_catalog(subject_prefix);
CREATE INDEX IF NOT EXISTS idx_course_catalog_number ON public.course_catalog(course_number);
CREATE INDEX IF NOT EXISTS idx_course_catalog_title ON public.course_catalog USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_course_catalog_embedding ON public.course_catalog USING hnsw (embedding vector_cosine_ops);

-- No RLS needed - course catalog is public data
ALTER TABLE public.course_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can read course catalog
CREATE POLICY "Anyone can read course catalog" ON public.course_catalog
FOR SELECT TO authenticated USING (true);

-- Only service role can insert/update (via API routes)
CREATE POLICY "Service role can manage catalog" ON public.course_catalog
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- SEED DATA: Common UTD CS Courses
-- This gives you data to work with before Nebula API
-- =====================================================

INSERT INTO public.course_catalog (subject_prefix, course_number, title, description, credit_hours, class_level, school, source)
VALUES
  ('CS', '1200', 'Introduction to Computer Science', 'Introduction to the concepts and tools of computer science. Covers problem solving, number systems, computer hardware, operating systems, networks, ethics, and programming basics.', '1', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '1336', 'Programming Fundamentals', 'Introduction to computing, including: computing concepts, coding structures, problem solving, coding/documentation, pseudocode, data types, control structures, functions, arrays, strings.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '1337', 'Computer Science I', 'Review of control structures and data types. Object-oriented programming, classes, overloading, inheritance, polymorphism. Exception handling. Recursion. Big-O notation.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '2305', 'Discrete Mathematics I', 'Propositional and predicate logic, mathematical proof techniques, sets, relations, functions, graphs, trees, and applications to computer science.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '2336', 'Computer Science II', 'Advanced data structures including linked lists, stacks, queues, trees, hash tables, and graphs. Algorithm analysis and sorting.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '2340', 'Computer Architecture', 'Digital systems, data representation, instruction sets, CPU design, pipelining, memory hierarchy, I/O systems, and assembly language programming.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '3305', 'Discrete Mathematics II', 'Counting, advanced counting techniques, relations, graphs, trees, Boolean algebra, modeling computation.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '3340', 'Computer Architecture II', 'Advanced computer architecture topics including pipelining, memory systems, parallel processing.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '3345', 'Data Structures and Algorithms', 'Analysis of algorithms. Trees, heaps, hash tables, graphs. Sorting. Graph algorithms. Dynamic programming.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '3354', 'Software Engineering', 'Software development methodologies, requirements analysis, design patterns, testing, project management.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '3377', 'Systems Programming in UNIX', 'UNIX system calls, file I/O, process control, signals, pipes, sockets, and shell programming.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4337', 'Organization of Programming Languages', 'Formal languages, automata theory, parsing, type systems, lambda calculus, functional programming.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4341', 'Digital Logic and Computer Design', 'Boolean algebra, combinational logic, sequential logic, finite state machines, register transfer level design.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4347', 'Database Systems', 'Relational model, SQL, normalization, transaction processing, query optimization, NoSQL databases.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4348', 'Operating Systems Concepts', 'Process management, memory management, file systems, I/O systems, security, distributed systems.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4349', 'Advanced Algorithm Design', 'Advanced techniques for designing and analyzing algorithms. NP-completeness, approximation algorithms.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4352', 'Human-Computer Interaction', 'User interface design, usability evaluation, prototyping, accessibility, user experience.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4365', 'Artificial Intelligence', 'Search, knowledge representation, reasoning, planning, machine learning, neural networks.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4375', 'Introduction to Machine Learning', 'Supervised learning, unsupervised learning, neural networks, deep learning, model evaluation.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4384', 'Automata Theory', 'Finite automata, regular expressions, context-free grammars, pushdown automata, Turing machines.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4390', 'Computer Networks', 'Network protocols, TCP/IP, routing, switching, network security, wireless networks.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4391', 'Introduction to Computer Vision', 'Image processing, feature detection, object recognition, machine learning for vision.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  ('CS', '4393', 'Computer and Network Security', 'Cryptography, authentication, access control, network security, malware, secure programming.', '3', 'Undergraduate', 'Engineering and Computer Science', 'manual'),
  -- Math courses
  ('MATH', '2413', 'Differential Calculus', 'Limits, derivatives, applications of differentiation, introduction to integration.', '4', 'Undergraduate', 'Natural Sciences and Mathematics', 'manual'),
  ('MATH', '2414', 'Integral Calculus', 'Definite integrals, techniques of integration, applications, sequences and series.', '4', 'Undergraduate', 'Natural Sciences and Mathematics', 'manual'),
  ('MATH', '2415', 'Calculus of Several Variables', 'Vectors, partial derivatives, multiple integrals, vector calculus.', '4', 'Undergraduate', 'Natural Sciences and Mathematics', 'manual'),
  ('MATH', '2418', 'Linear Algebra', 'Systems of linear equations, matrices, determinants, vector spaces, eigenvalues.', '4', 'Undergraduate', 'Natural Sciences and Mathematics', 'manual'),
  -- Physics
  ('PHYS', '2325', 'Mechanics', 'Kinematics, dynamics, work and energy, momentum, rotational motion, oscillations.', '3', 'Undergraduate', 'Natural Sciences and Mathematics', 'manual'),
  ('PHYS', '2326', 'Electromagnetism and Waves', 'Electric fields, magnetic fields, circuits, electromagnetic waves, optics.', '3', 'Undergraduate', 'Natural Sciences and Mathematics', 'manual')
ON CONFLICT (subject_prefix, course_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  last_updated = NOW();

-- Function to search courses
CREATE OR REPLACE FUNCTION search_courses(
  search_query TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS SETOF public.course_catalog
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.course_catalog
  WHERE 
    subject_prefix ILIKE '%' || search_query || '%'
    OR course_number ILIKE '%' || search_query || '%'
    OR title ILIKE '%' || search_query || '%'
    OR description ILIKE '%' || search_query || '%'
  ORDER BY subject_prefix, course_number
  LIMIT limit_count;
END;
$$;

