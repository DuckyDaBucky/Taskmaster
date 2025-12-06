-- QUICK FIX FOR SLOW LOADING
-- Run this in Supabase SQL Editor

-- 1. Remove the restrictive CHECK constraint on activities.type
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- 2. Make sure all RLS policies are permissive
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. Enable RLS and create open policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Super permissive policies
CREATE POLICY "all" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.flashcards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.chats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "all" ON public.friend_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Fix flashcards - class_id should be nullable
ALTER TABLE public.flashcards ALTER COLUMN class_id DROP NOT NULL;

-- 5. Create Personal class for you if missing
INSERT INTO public.classes (name, user_id, is_personal)
SELECT 'Personal', id, true FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.classes c WHERE c.user_id = u.id AND c.is_personal = true)
ON CONFLICT DO NOTHING;

SELECT 'FIXES APPLIED! Try again.' as result;

