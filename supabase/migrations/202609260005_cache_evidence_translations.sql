create table public.evidence_translations (
  evidence_id uuid primary key references public.evidence(id) on delete cascade,
  translation_zh text not null,
  model text not null,
  created_at timestamptz not null default now()
);

alter table public.evidence_translations enable row level security;

create or replace function public.is_public_evidence(candidate_evidence_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.evidence
    where id = candidate_evidence_id and public.is_public_claim(claim_id)
  );
$$;

create policy "public read evidence translations" on public.evidence_translations
  for select to anon, authenticated using (public.is_public_evidence(evidence_id));
