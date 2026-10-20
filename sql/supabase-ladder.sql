-- BrainWhim Play — presence, guest flag, earned points, daily online cap
-- SQL Editor → New query → paste → Run
-- Also: Authentication → Providers → enable Anonymous

alter table public.profiles
  add column if not exists last_seen timestamptz,
  add column if not exists skill_points integer not null default 0,
  add column if not exists is_guest boolean not null default false,
  add column if not exists online_day date,
  add column if not exists online_count integer not null default 0;

update public.profiles
  set skill_points = coalesce(skill_points, 0),
      online_count = coalesce(online_count, 0);
