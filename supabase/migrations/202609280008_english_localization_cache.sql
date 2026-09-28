-- English is a cached presentation of the Chinese knowledge card, not a second search index.
-- Deleting a card (including future retention cleanup) deletes its localization automatically.
create table if not exists public.knowledge_item_localizations (
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  locale text not null check (locale in ('en')),
  content jsonb not null,
  model text not null,
  source_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (item_id, locale)
);

alter table public.knowledge_item_localizations enable row level security;

drop policy if exists "users own knowledge item localizations" on public.knowledge_item_localizations;
create policy "users own knowledge item localizations" on public.knowledge_item_localizations
  for all to authenticated
  using (public.user_owns_item(item_id))
  with check (public.user_owns_item(item_id));

drop policy if exists "public read ready knowledge item localizations" on public.knowledge_item_localizations;
create policy "public read ready knowledge item localizations" on public.knowledge_item_localizations
  for select to anon, authenticated using (public.is_public_item(item_id));
