-- =====================================================
-- SUPABASE DATABASE INDEXES FOR PERFORMANCE
-- Run this in Supabase SQL Editor to speed up queries
-- =====================================================

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_class_id ON public.tasks(class_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON public.tasks(user_id, created_at DESC);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_user_id ON public.classes(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_user_personal ON public.classes(user_id, is_personal);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_start ON public.events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_class_id ON public.resources(class_id);

-- Flashcards indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_class_id ON public.flashcards(class_id);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON public.activities(user_id, created_at DESC);

-- Users index for email lookup (used in login)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON public.users(display_name);

-- Analyze tables to update statistics
ANALYZE public.tasks;
ANALYZE public.classes;
ANALYZE public.events;
ANALYZE public.resources;
ANALYZE public.flashcards;
ANALYZE public.activities;
ANALYZE public.users;

-- Done!
SELECT 'Indexes created successfully!' as result;

