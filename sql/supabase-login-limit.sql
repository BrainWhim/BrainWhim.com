-- BrainWhim, Nov 20 2026: a brake on password guessing for username sign-in (the bw-login Edge Function).
-- A username gets 5 wrong passwords in 15 minutes; one internet address gets 20. After that, "Too many tries"
-- until the oldest miss is 15 minutes old. A right password clears that username's misses.
-- Only the Edge Function (service role) can use these; browsers can't. Run once in the SQL Editor. Safe to run again.

create table if not exists public.login_misses (
  id    bigint generated always as identity primary key,
  uname text not null,
  ip    text not null default '',
  at    timestamptz not null default now()
);
create index if not exists login_misses_uname_at on public.login_misses (uname, at);
create index if not exists login_misses_ip_at on public.login_misses (ip, at);
alter table public.login_misses enable row level security;
revoke all on table public.login_misses from anon, authenticated;

-- true = allowed to try
create or replace function public.bw_login_gate(p_uname text, p_ip text)
returns boolean language sql security definer stable set search_path = public as $$
  select (select count(*) from public.login_misses where uname = lower(p_uname) and at > now() - interval '15 minutes') < 5
     and (coalesce(p_ip,'') = '' or (select count(*) from public.login_misses where ip = p_ip and at > now() - interval '15 minutes') < 20);
$$;

create or replace function public.bw_login_miss(p_uname text, p_ip text)
returns void language sql security definer set search_path = public as $$
  delete from public.login_misses where at < now() - interval '1 day';
  insert into public.login_misses (uname, ip) values (lower(p_uname), coalesce(p_ip,''));
$$;

create or replace function public.bw_login_ok(p_uname text)
returns void language sql security definer set search_path = public as $$
  delete from public.login_misses where uname = lower(p_uname);
$$;

revoke all on function public.bw_login_gate(text, text) from public, anon, authenticated;
revoke all on function public.bw_login_miss(text, text) from public, anon, authenticated;
revoke all on function public.bw_login_ok(text) from public, anon, authenticated;
grant execute on function public.bw_login_gate(text, text) to service_role;
grant execute on function public.bw_login_miss(text, text) to service_role;
grant execute on function public.bw_login_ok(text) to service_role;
