create table public.homepage_views (
  singleton boolean primary key default true check (singleton),
  view_count bigint not null default 0 check (view_count >= 0)
);

insert into public.homepage_views default values;
alter table public.homepage_views enable row level security;
revoke all on public.homepage_views from public, anon, authenticated;
grant select, update on public.homepage_views to service_role;

create function public.record_homepage_view()
returns bigint
language sql
security invoker
set search_path = ''
as $$
  update public.homepage_views
  set view_count = view_count + 1
  where singleton
  returning view_count;
$$;

revoke all on function public.record_homepage_view() from public, anon, authenticated;
grant execute on function public.record_homepage_view() to service_role;
