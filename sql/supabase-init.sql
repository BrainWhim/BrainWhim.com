-- BrainWhim Play — run once in SQL Editor on brainwhim-play-us
-- Project → SQL Editor → New query → paste all → Run

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  member boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game text not null,
  status text not null default 'lobby',
  state jsonb not null default '{}'::jsonb,
  host uuid references auth.users(id) on delete set null,
  guest uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists rooms_status_idx on public.rooms (status);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "rooms_select_mine" on public.rooms;
create policy "rooms_select_mine"
  on public.rooms for select
  to authenticated
  using (auth.uid() = host or auth.uid() = guest);

drop policy if exists "rooms_insert_host" on public.rooms;
create policy "rooms_insert_host"
  on public.rooms for insert
  to authenticated
  with check (auth.uid() = host);

drop policy if exists "rooms_update_seated" on public.rooms;
create policy "rooms_update_seated"
  on public.rooms for update
  to authenticated
  using (auth.uid() = host or auth.uid() = guest)
  with check (auth.uid() = host or auth.uid() = guest);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
