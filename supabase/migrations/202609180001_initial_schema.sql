create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.content_status as enum (
  'ready', 'no_transcript', 'no_article_body', 'pending_review', 'processing_failed'
);
create type public.content_kind as enum ('article', 'podcast', 'video');

create table public.sources (
  id text primary key,
  name text not null,
  category text not null,
  homepage text not null,
  enabled boolean not null default true,
  phase smallint not null check (phase in (1, 2)),
  created_at timestamptz not null default now()
);

insert into public.sources (id, name, category, homepage, enabled, phase) values
  ('the-batch', 'The Batch', 'AI and technology', 'https://www.deeplearning.ai/the-batch', true, 1),
  ('one-useful-thing', 'One Useful Thing', 'AI and work', 'https://www.oneusefulthing.org/', true, 2),
  ('mit-technology-review', 'MIT Technology Review', 'Technology and future trends', 'https://www.technologyreview.com/', true, 2),
  ('bloomberg-primer', 'Bloomberg Primer', 'Business and markets', 'https://www.bloomberg.com/', true, 2),
  ('stanford-gsb-view-from-the-top', 'Stanford GSB View From The Top', 'Leadership interviews', 'https://www.gsb.stanford.edu/experience/learning/guest-speakers/view-top', true, 2),
  ('hbr-ideacast', 'HBR IdeaCast', 'Business and management', 'https://hbr.org/podcast/ideacast', true, 2),
  ('knowledge-at-wharton', 'Knowledge at Wharton', 'Business analysis', 'https://knowledge.wharton.upenn.edu/', true, 2),
  ('acquired', 'Acquired', 'Company history and strategy', 'https://www.acquired.fm/', true, 1),
  ('lennys-podcast', 'Lenny’s Podcast', 'Product and entrepreneurship', 'https://www.lennyspodcast.com/', true, 2),
  ('hidden-brain', 'Hidden Brain', 'Psychology and society', 'https://www.hiddenbrain.org/', true, 1),
  ('speaking-of-psychology', 'Speaking of Psychology', 'Psychology', 'https://www.apa.org/news/podcasts/speaking-of-psychology', true, 2),
  ('freakonomics-radio', 'Freakonomics Radio', 'Economics and society', 'https://freakonomics.com/series/freakonomics-radio/', true, 2)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  homepage = excluded.homepage,
  enabled = excluded.enabled,
  phase = excluded.phase;

create table public.knowledge_items (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_id text not null references public.sources(id),
  external_id text not null,
  title text not null,
  canonical_url text not null,
  kind public.content_kind not null,
  status public.content_status not null default 'pending_review',
  published_at timestamptz,
  summary_zh text,
  unavailable_reason_zh text,
  tags text[] not null default '{}',
  people text[] not null default '{}',
  companies text[] not null default '{}',
  terms jsonb not null default '[]',
  retry_count integer not null default 0,
  next_transcript_check_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, source_id, external_id)
);

create table public.platform_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  platform text not null,
  url text not null,
  duration_seconds integer,
  published_at timestamptz,
  match_score real,
  match_status text not null check (match_status in ('exact', 'likely', 'edited', 'related')),
  unique (item_id, platform, url)
);

create table public.transcript_sources (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  source_kind text not null check (source_kind in ('OS', 'CC', 'RSS', 'PLT', 'EXT')),
  label text not null,
  platform text not null,
  url text not null,
  has_timestamps boolean not null default false,
  verified boolean not null default false,
  selected boolean not null default false,
  checked_at timestamptz not null default now(),
  unique (item_id, url)
);

create table public.claims (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  claim_code text not null,
  position smallint not null,
  title_zh text not null,
  information_type text not null check (information_type in ('fact', 'opinion', 'prediction', 'advice')),
  assessment_zh text not null,
  unique (item_id, claim_code)
);

create table public.evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_code text not null,
  relation text not null check (relation in ('PRIMARY','SUP','ADD','EX','CTX','QUAL','CMP','REF','RISK','UNC')),
  locator text not null,
  speaker text not null,
  source_kind text not null check (source_kind in ('OS', 'CC', 'RSS', 'PLT', 'EXT')),
  quote text not null,
  unique (claim_id, evidence_code)
);

create table public.analyses (
  item_id uuid primary key references public.knowledge_items(id) on delete cascade,
  why_zh jsonb not null default '[]',
  horizontal_zh jsonb not null default '[]',
  cross_disciplinary_zh jsonb not null default '[]',
  application_zh jsonb not null default '[]',
  personal_zh jsonb not null default '[]',
  memory_zh jsonb not null default '{}'
);

create table public.visuals (
  item_id uuid primary key references public.knowledge_items(id) on delete cascade,
  timeline jsonb not null default '[]',
  tree jsonb not null default '{}',
  comparison jsonb not null default '[]'
);

create table public.search_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  document_type text not null check (document_type in ('summary', 'claim', 'evidence_group', 'tags')),
  reference_id text,
  content text not null,
  embedding extensions.vector(768),
  fts tsvector generated always as (to_tsvector('simple', coalesce(content, ''))) stored,
  unique (item_id, document_type, reference_id)
);

create table public.reading_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  saved boolean not null default false,
  read_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index knowledge_items_user_published_idx on public.knowledge_items(user_id, published_at desc);
create index search_documents_fts_idx on public.search_documents using gin(fts);
create index search_documents_embedding_idx on public.search_documents
  using hnsw (embedding extensions.vector_cosine_ops) with (m = 16, ef_construction = 64);

alter table public.sources enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.platform_versions enable row level security;
alter table public.transcript_sources enable row level security;
alter table public.claims enable row level security;
alter table public.evidence enable row level security;
alter table public.analyses enable row level security;
alter table public.visuals enable row level security;
alter table public.search_documents enable row level security;
alter table public.reading_states enable row level security;

create policy "authenticated users read sources" on public.sources for select to authenticated using (true);
create policy "users own knowledge items" on public.knowledge_items for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.user_owns_item(candidate_item_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.knowledge_items
    where id = candidate_item_id and user_id = auth.uid()
  );
$$;

create policy "users own platform versions" on public.platform_versions for all to authenticated
  using (public.user_owns_item(item_id)) with check (public.user_owns_item(item_id));
create policy "users own transcript sources" on public.transcript_sources for all to authenticated
  using (public.user_owns_item(item_id)) with check (public.user_owns_item(item_id));
create policy "users own claims" on public.claims for all to authenticated
  using (public.user_owns_item(item_id)) with check (public.user_owns_item(item_id));
create policy "users own analyses" on public.analyses for all to authenticated
  using (public.user_owns_item(item_id)) with check (public.user_owns_item(item_id));
create policy "users own visuals" on public.visuals for all to authenticated
  using (public.user_owns_item(item_id)) with check (public.user_owns_item(item_id));
create policy "users own search documents" on public.search_documents for all to authenticated
  using (public.user_owns_item(item_id)) with check (public.user_owns_item(item_id));
create policy "users own reading states" on public.reading_states for all to authenticated
  using (auth.uid() = user_id and public.user_owns_item(item_id))
  with check (auth.uid() = user_id and public.user_owns_item(item_id));
create policy "users own evidence" on public.evidence for all to authenticated using (
  exists (
    select 1 from public.claims c
    join public.knowledge_items k on k.id = c.item_id
    where c.id = evidence.claim_id and k.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.claims c
    join public.knowledge_items k on k.id = c.item_id
    where c.id = evidence.claim_id and k.user_id = auth.uid()
  )
);

create or replace function public.hybrid_search(
  query_text text,
  query_embedding extensions.vector(768),
  match_count integer default 20,
  text_weight real default 0.55,
  vector_weight real default 0.45
) returns table (
  item_id uuid,
  document_type text,
  content text,
  score real
) language sql stable security invoker set search_path = '' as $$
  with ranked as (
    select
      sd.item_id,
      sd.document_type,
      sd.content,
      ts_rank_cd(sd.fts, plainto_tsquery('simple', query_text)) as text_score,
      case when sd.embedding is null then 0
        else 1 - (sd.embedding OPERATOR(extensions.<=>) query_embedding) end as vector_score
    from public.search_documents sd
    join public.knowledge_items ki on ki.id = sd.item_id
    where ki.user_id = auth.uid()
      and (sd.fts @@ plainto_tsquery('simple', query_text) or sd.embedding is not null)
  )
  select item_id, document_type, content,
    (text_score * text_weight + vector_score * vector_weight)::real as score
  from ranked
  order by score desc
  limit greatest(1, least(match_count, 100));
$$;
