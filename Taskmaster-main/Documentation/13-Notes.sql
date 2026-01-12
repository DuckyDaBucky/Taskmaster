-- Notes generated from uploaded documents
-- Apply in Supabase SQL editor

create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    class_id uuid not null references public.classes(id) on delete cascade,
    topic text not null,
    resource_id uuid references public.resources(id) on delete set null,
    title text not null,
    content text not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index if not exists notes_user_class_idx
    on public.notes (user_id, class_id);

create index if not exists notes_user_topic_idx
    on public.notes (user_id, topic);

alter table public.notes enable row level security;

create policy "Users can view their notes"
    on public.notes for select
    using (user_id = auth.uid());

create policy "Users can manage their notes"
    on public.notes for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
