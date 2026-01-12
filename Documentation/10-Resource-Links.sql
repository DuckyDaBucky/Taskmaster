-- Resource links cache for class topics
-- Apply in Supabase SQL editor

create table if not exists public.resource_links (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    class_id uuid not null references public.classes(id) on delete cascade,
    topic text not null,
    title text not null,
    url text not null,
    type text not null,
    source text,
    description text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create unique index if not exists resource_links_unique
    on public.resource_links (user_id, class_id, topic, url);

create index if not exists resource_links_topic_idx
    on public.resource_links (user_id, class_id, topic);

alter table public.resource_links enable row level security;

create policy "Users can view their resource links"
    on public.resource_links for select
    using (user_id = auth.uid());

create policy "Users can manage their resource links"
    on public.resource_links for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
