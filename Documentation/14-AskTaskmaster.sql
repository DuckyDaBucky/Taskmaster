-- AskTaskmaster conversations and messages
-- Apply in Supabase SQL editor

create table if not exists public.ai_conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create index if not exists ai_conversations_user_idx
    on public.ai_conversations (user_id, updated_at desc);

create table if not exists public.ai_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null,
    content text not null,
    created_at timestamp with time zone default now()
);

create index if not exists ai_messages_conversation_idx
    on public.ai_messages (conversation_id, created_at);

create index if not exists ai_messages_user_idx
    on public.ai_messages (user_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "Users can view their AI conversations"
    on public.ai_conversations for select
    using (user_id = auth.uid());

create policy "Users can manage their AI conversations"
    on public.ai_conversations for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Users can view their AI messages"
    on public.ai_messages for select
    using (user_id = auth.uid());

create policy "Users can manage their AI messages"
    on public.ai_messages for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
