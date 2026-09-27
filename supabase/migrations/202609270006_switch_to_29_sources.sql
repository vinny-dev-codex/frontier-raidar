-- Final source registry: the document is a channel index, while collection uses
-- deterministic official endpoints and a strict priority order.
alter table public.sources add column if not exists priority smallint;
alter table public.sources add column if not exists youtube_channel_id text;
alter table public.sources add column if not exists publication_policy text not null default 'standard';

update public.sources set enabled = false, priority = null;

insert into public.sources (
  id, name, category, homepage, enabled, phase, priority, youtube_channel_id, publication_policy
) values
  ('acquired', 'Acquired', '公司史与战略', 'https://www.acquired.fm/', true, 1, 1, 'UCyFqFYfTW2VoIQKylJ04Rtw', 'standard'),
  ('hidden-brain', 'Hidden Brain', '心理学与决策', 'https://www.hiddenbrain.org/', true, 1, 2, 'UCgjZeiV0Ks3Shx8xPgvm7pQ', 'standard'),
  ('huberman-lab', 'Huberman Lab', '神经科学与健康', 'https://www.hubermanlab.com/', true, 1, 3, 'UC2D2CMWXMOVWx7giW1n3LIg', 'external_corroboration_required'),
  ('lennys-podcast', 'Lenny''s Podcast', '产品与增长', 'https://www.lennyspodcast.com/', true, 1, 4, 'UC6t1O76G0jYXOAoYCm153dA', 'standard'),
  ('freakonomics-radio', 'Freakonomics Radio Network', '行为经济与公共政策', 'https://freakonomics.com/', true, 1, 5, 'UCXjf7anLJA4NqUv8kPFIJWA', 'standard'),
  ('dwarkesh-patel', 'Dwarkesh Patel', 'AI 前沿访谈', 'https://www.dwarkesh.com/', true, 1, 6, 'UCXl4i9dYBrFOabk0xGmbkRA', 'standard'),
  ('stanford-hai', 'Stanford HAI', 'AI 研究与治理', 'https://hai.stanford.edu/', true, 1, 7, 'UChugFTK0KyrES9terTid8vA', 'standard'),
  ('google-deepmind', 'Google DeepMind', 'AI 研究', 'https://deepmind.google/', true, 1, 8, 'UCP7jMXSY2xbc3KCAE0MHQ-A', 'standard'),
  ('stanford-gsb', 'Stanford Graduate School of Business', '管理与组织', 'https://www.gsb.stanford.edu/', true, 1, 9, 'UCGwuxdEeCf0TIA2RbPOj-8g', 'standard'),
  ('y-combinator', 'Y Combinator', '创业与产品', 'https://www.ycombinator.com/library', true, 1, 10, 'UCcefcZRL2oaA_uBNeo5UOWg', 'standard'),
  ('no-priors', 'No Priors', 'AI 创业与模型', 'https://www.youtube.com/channel/UCSI7h9hydQ40K5MJHnCrQvw', true, 2, 11, 'UCSI7h9hydQ40K5MJHnCrQvw', 'standard'),
  ('harvard-business-review', 'Harvard Business Review', '管理与战略', 'https://hbr.org/', true, 2, 12, 'UCWo4IA01TXzBeGJJKWHOG9g', 'standard'),
  ('knowledge-project', 'The Knowledge Project', '决策与领导力', 'https://fs.blog/knowledge-project-podcast/', true, 2, 13, 'UCLtTf_uKt0Itd0NG7txrwXA', 'standard'),
  ('lex-fridman', 'Lex Fridman', '科学技术访谈', 'https://lexfridman.com/podcast/', true, 2, 14, 'UCSHZKyawb77ixDdsGog4iWA', 'standard'),
  ('ai-explained', 'AI Explained', '模型与行业解释', 'https://www.youtube.com/channel/UCNJ1Ymd5yFuUPtn21xtRbbw', true, 2, 15, 'UCNJ1Ymd5yFuUPtn21xtRbbw', 'standard'),
  ('brain-inspired', 'Brain Inspired', '神经科学与 AI', 'https://www.youtube.com/channel/UCZCA4LUirmPL61KHeUC0YRQ', true, 2, 16, 'UCZCA4LUirmPL61KHeUC0YRQ', 'standard'),
  ('radiolab', 'Radiolab', '科学与社会', 'https://radiolab.org/', true, 2, 17, 'UCaum_fMDGgFQCmKHUBPq_xg', 'standard'),
  ('big-think', 'Big Think', '跨学科解释', 'https://bigthink.com/', true, 2, 18, 'UCvQECJukTDE2i6aCoMnS-Vg', 'standard'),
  ('oxford-union', 'OxfordUnion', '公共议题与演讲', 'https://www.youtube.com/channel/UCY7dD6waquGnKTZSumPMTlQ', true, 2, 19, 'UCY7dD6waquGnKTZSumPMTlQ', 'standard'),
  ('a16z', 'a16z', '科技投资', 'https://a16z.com/', true, 2, 20, 'UC9cn0TuPq4dnbTY-CBsm8XA', 'standard'),
  ('johnathan-bi', 'Johnathan Bi', '思想与哲学', 'https://www.youtube.com/channel/UCCrl9a26fDCZvofnCnA5A8g', true, 2, 21, 'UCCrl9a26fDCZvofnCnA5A8g', 'standard'),
  ('cosmic-skeptic', 'Alex O''Connor', '哲学', 'https://www.youtube.com/channel/UC7kIy8fZavEni8Gzl8NLjOQ', true, 2, 22, 'UC7kIy8fZavEni8Gzl8NLjOQ', 'standard'),
  ('plasticpills', 'PlasticPills', '哲学与文化', 'https://www.youtube.com/channel/UC9XFvuObhfVUNAGNcH8Y_fw', true, 2, 23, 'UC9XFvuObhfVUNAGNcH8Y_fw', 'standard'),
  ('wayde-ai', 'Wayde AI', 'AI 与心理学', 'https://www.youtube.com/channel/UC8kfx6xEt6NAvn8A9Q_wAGw', true, 2, 24, 'UC8kfx6xEt6NAvn8A9Q_wAGw', 'external_corroboration_required'),
  ('ali-abdaal', 'Ali Abdaal', '学习与生产力', 'https://www.youtube.com/channel/UCoOae5nYA7VqaXzerajD0lg', true, 2, 25, 'UCoOae5nYA7VqaXzerajD0lg', 'standard'),
  ('school-of-hard-knocks', 'School of Hard Knocks', '创业案例', 'https://www.youtube.com/channel/UCmtBqvOp6xHlecDO0Un9O4w', true, 2, 26, 'UCmtBqvOp6xHlecDO0Un9O4w', 'standard'),
  ('my-first-million', 'My First Million', '商业创意', 'https://www.youtube.com/channel/UCyaN6mg5u8Cjy2ZI4ikWaug', true, 2, 27, 'UCyaN6mg5u8Cjy2ZI4ikWaug', 'standard'),
  ('dan-koe', 'Dan Koe', '创作与个人商业', 'https://www.youtube.com/channel/UCWXYDYv5STLk-zoxMP2I1Lw', true, 2, 28, 'UCWXYDYv5STLk-zoxMP2I1Lw', 'standard'),
  ('erin-meryl-mcgurk', 'erin meryl mcgurk', '学习与研究方法', 'https://www.youtube.com/channel/UCmC01dEB_LBMTYhSLPs1CWw', true, 2, 29, 'UCmC01dEB_LBMTYhSLPs1CWw', 'standard')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  homepage = excluded.homepage,
  enabled = excluded.enabled,
  phase = excluded.phase,
  priority = excluded.priority,
  youtube_channel_id = excluded.youtube_channel_id,
  publication_policy = excluded.publication_policy;

create unique index if not exists sources_enabled_priority_idx
  on public.sources (priority) where enabled;

-- Final decision: this project does not send email notifications.
drop table if exists public.notification_deliveries;
