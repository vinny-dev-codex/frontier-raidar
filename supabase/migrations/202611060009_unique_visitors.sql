create table public.unique_visitors (
  digest text primary key check (digest ~ '^[0-9a-f]{64}$')
);

alter table public.unique_visitors enable row level security;
revoke all on public.unique_visitors from public, anon, authenticated;
grant select, insert on public.unique_visitors to service_role;

create function public.record_unique_visitor(visitor_digest text)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.unique_visitors (digest) values (visitor_digest)
  on conflict (digest) do nothing;

  return (select count(*) from public.unique_visitors);
end;
$$;

revoke all on function public.record_unique_visitor(text) from public, anon, authenticated;
grant execute on function public.record_unique_visitor(text) to service_role;
