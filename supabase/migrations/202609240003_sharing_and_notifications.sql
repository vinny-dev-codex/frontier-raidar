-- One owner can grant a family member read-only access without duplicating cards.
create table public.library_members (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'reader' check (role = 'reader'),
  created_at timestamptz not null default now(),
  unique (owner_id, member_id),
  check (owner_id <> member_id)
);

create table public.notification_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null check (channel = 'email'),
  status text not null check (status in ('sent', 'failed', 'skipped')),
  provider_message_id text,
  error_summary text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (item_id, recipient_user_id, channel)
);

alter table public.library_members enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "owners manage their readers" on public.library_members for all to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "readers see their memberships" on public.library_members for select to authenticated
  using (auth.uid() = member_id);
create policy "recipients read their notification log" on public.notification_deliveries for select to authenticated
  using (auth.uid() = recipient_user_id);

create or replace function public.can_read_library(candidate_owner_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select candidate_owner_id = auth.uid()
    or exists (
      select 1 from public.library_members
      where owner_id = candidate_owner_id and member_id = auth.uid()
    );
$$;

create or replace function public.user_can_read_item(candidate_item_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.knowledge_items
    where id = candidate_item_id and public.can_read_library(user_id)
  );
$$;

create or replace function public.user_can_read_evidence(candidate_claim_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.claims c
    join public.knowledge_items k on k.id = c.item_id
    where c.id = candidate_claim_id and public.can_read_library(k.user_id)
  );
$$;

create policy "shared readers read knowledge items" on public.knowledge_items for select to authenticated
  using (public.can_read_library(user_id));
create policy "shared readers read platform versions" on public.platform_versions for select to authenticated
  using (public.user_can_read_item(item_id));
create policy "shared readers read transcript sources" on public.transcript_sources for select to authenticated
  using (public.user_can_read_item(item_id));
create policy "shared readers read claims" on public.claims for select to authenticated
  using (public.user_can_read_item(item_id));
create policy "shared readers read analyses" on public.analyses for select to authenticated
  using (public.user_can_read_item(item_id));
create policy "shared readers read visuals" on public.visuals for select to authenticated
  using (public.user_can_read_item(item_id));
create policy "shared readers read search documents" on public.search_documents for select to authenticated
  using (public.user_can_read_item(item_id));
create policy "shared readers read evidence" on public.evidence for select to authenticated
  using (public.user_can_read_evidence(claim_id));
