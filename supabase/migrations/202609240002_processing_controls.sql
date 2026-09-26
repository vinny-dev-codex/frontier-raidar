-- Cost and operational guardrails for the personal, single-user deployment.
create table public.processing_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null references public.sources(id),
  external_id text not null,
  item_id uuid references public.knowledge_items(id) on delete set null,
  status text not null check (status in ('processing', 'succeeded', 'failed')),
  manual_retry_required boolean not null default false,
  error_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_id, external_id)
);

create table public.model_usage_events (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid references public.processing_attempts(id) on delete set null,
  item_id uuid references public.knowledge_items(id) on delete set null,
  provider text not null check (provider in ('deepseek', 'dashscope')),
  model text not null,
  operation text not null,
  status text not null check (status in ('succeeded', 'failed')),
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  error_summary text,
  created_at timestamptz not null default now()
);

create index model_usage_events_daily_limit_idx
  on public.model_usage_events (user_id, provider, operation, status, created_at desc);

alter table public.processing_attempts enable row level security;
alter table public.model_usage_events enable row level security;

create policy "users read own processing attempts" on public.processing_attempts
  for select to authenticated using (auth.uid() = user_id);
create policy "users read own model usage" on public.model_usage_events
  for select to authenticated using (auth.uid() = user_id);

-- The warning threshold is 350 MiB, leaving room below Supabase Free's 500 MB database cap.
create or replace function public.database_quota_status()
returns table (database_bytes bigint, warning_threshold_bytes bigint, warning boolean)
language sql stable security definer set search_path = '' as $$
  select
    pg_catalog.pg_database_size(pg_catalog.current_database()),
    367001600::bigint,
    pg_catalog.pg_database_size(pg_catalog.current_database()) >= 367001600::bigint;
$$;

grant execute on function public.database_quota_status() to authenticated;
