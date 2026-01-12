-- Outlook calendar connections and selections
-- Apply in Supabase SQL editor

create table if not exists public.calendar_connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    access_token text not null,
    refresh_token text not null,
    expires_at timestamp with time zone not null,
    scope text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create unique index if not exists calendar_connections_unique
    on public.calendar_connections (user_id, provider);

create table if not exists public.calendar_oauth_states (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    state text not null,
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now()
);

create unique index if not exists calendar_oauth_states_unique
    on public.calendar_oauth_states (state);

create table if not exists public.calendar_calendars (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    calendar_id text not null,
    name text not null,
    selected boolean not null default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create unique index if not exists calendar_calendars_unique
    on public.calendar_calendars (user_id, provider, calendar_id);

create index if not exists calendar_calendars_selected_idx
    on public.calendar_calendars (user_id, provider, selected);

alter table public.calendar_connections enable row level security;
alter table public.calendar_oauth_states enable row level security;
alter table public.calendar_calendars enable row level security;

create policy "Users can view their calendar connections"
    on public.calendar_connections for select
    using (user_id = auth.uid());

create policy "Users can manage their calendar connections"
    on public.calendar_connections for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users can manage their calendar oauth states"
    on public.calendar_oauth_states for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users can view their calendar list"
    on public.calendar_calendars for select
    using (user_id = auth.uid());

create policy "Users can manage their calendar list"
    on public.calendar_calendars for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
