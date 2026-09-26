-- Publish only completed knowledge cards. All writes and operational data remain private.
create or replace function public.is_public_item(candidate_item_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.knowledge_items
    where id = candidate_item_id and status = 'ready'
  );
$$;

create or replace function public.is_public_claim(candidate_claim_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.claims c
    join public.knowledge_items k on k.id = c.item_id
    where c.id = candidate_claim_id and k.status = 'ready'
  );
$$;

create policy "public read sources" on public.sources for select to anon, authenticated using (true);
create policy "public read ready knowledge items" on public.knowledge_items for select to anon, authenticated using (status = 'ready');
create policy "public read platform versions" on public.platform_versions for select to anon, authenticated using (public.is_public_item(item_id));
create policy "public read transcript sources" on public.transcript_sources for select to anon, authenticated using (public.is_public_item(item_id));
create policy "public read claims" on public.claims for select to anon, authenticated using (public.is_public_item(item_id));
create policy "public read analyses" on public.analyses for select to anon, authenticated using (public.is_public_item(item_id));
create policy "public read visuals" on public.visuals for select to anon, authenticated using (public.is_public_item(item_id));
create policy "public read evidence" on public.evidence for select to anon, authenticated using (public.is_public_claim(claim_id));
