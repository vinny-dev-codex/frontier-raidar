-- Rebalance the source queue and remove the two former manual publication gates.
-- Priorities are temporarily cleared to avoid collisions with the partial unique index.
update public.sources set priority = null where enabled;

update public.sources
set priority = case id
  when 'hidden-brain' then 1
  when 'huberman-lab' then 2
  when 'lennys-podcast' then 3
  when 'freakonomics-radio' then 4
  when 'dwarkesh-patel' then 5
  when 'stanford-hai' then 6
  when 'google-deepmind' then 7
  when 'stanford-gsb' then 8
  when 'y-combinator' then 9
  when 'acquired' then 10
  when 'no-priors' then 11
  when 'harvard-business-review' then 12
  when 'knowledge-project' then 13
  when 'lex-fridman' then 14
  when 'ai-explained' then 15
  when 'brain-inspired' then 16
  when 'radiolab' then 17
  when 'big-think' then 18
  when 'oxford-union' then 19
  when 'a16z' then 20
  when 'johnathan-bi' then 21
  when 'cosmic-skeptic' then 22
  when 'plasticpills' then 23
  when 'wayde-ai' then 24
  when 'ali-abdaal' then 25
  when 'school-of-hard-knocks' then 26
  when 'my-first-million' then 27
  when 'dan-koe' then 28
  when 'erin-meryl-mcgurk' then 29
end,
publication_policy = case when id in ('huberman-lab', 'wayde-ai') then 'standard' else publication_policy end
where enabled;

update public.knowledge_items
set status = 'ready', unavailable_reason_zh = null, updated_at = now()
where status = 'pending_review' and source_id in ('huberman-lab', 'wayde-ai');
