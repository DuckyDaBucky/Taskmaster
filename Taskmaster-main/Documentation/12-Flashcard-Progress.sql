-- Flashcard learn progress tracking
-- Apply in Supabase SQL editor

create table if not exists public.flashcard_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    set_id text not null,
    card_id uuid not null references public.flashcards(id) on delete cascade,
    mastery_level int not null default 0,
    last_seen_at timestamp with time zone,
    next_due_at timestamp with time zone,
    total_attempts int not null default 0,
    correct_attempts int not null default 0,
    streak_correct int not null default 0,
    updated_at timestamp with time zone not null default now()
);

create unique index if not exists flashcard_progress_unique
    on public.flashcard_progress (user_id, set_id, card_id);

create index if not exists flashcard_progress_due_idx
    on public.flashcard_progress (user_id, set_id, next_due_at);

create index if not exists flashcard_progress_mastery_idx
    on public.flashcard_progress (user_id, set_id, mastery_level);

alter table public.flashcard_progress enable row level security;

create policy "Users can view their flashcard progress"
    on public.flashcard_progress for select
    using (user_id = auth.uid());

create policy "Users can manage their flashcard progress"
    on public.flashcard_progress for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
