-- BrainWhim, Nov 20 2026: the launch / studio-news email list.
-- Browsers can only ADD an address through join_email_list(); nobody can read the list
-- from the browser (no table grants at all). Read it in Supabase → Table Editor → email_list.
-- Run once in the SQL Editor. Safe to run again.

create table if not exists public.email_list (
  id          bigint generated always as identity primary key,
  email       text not null,
  source      text not null default 'home',
  created_at  timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create unique index if not exists email_list_email_key on public.email_list (lower(email));

alter table public.email_list enable row level security;
-- no policies: with RLS on and no policies, anon/authenticated can't select, insert, update or delete.
revoke all on table public.email_list from anon, authenticated;

create or replace function public.join_email_list(p_email text, p_source text default 'home')
returns text
language plpgsql security definer
set search_path = public
as $$
declare e text := lower(trim(coalesce(p_email,'')));
        s text := coalesce(nullif(trim(p_source),''),'home');
begin
  if length(e) > 254 or e !~ '^[a-z0-9._%+''-]+@[a-z0-9.-]+\.[a-z]{2,}$' then
    return 'bad';
  end if;
  if s not in ('home','puzzles','play','learn','live','create','lobby') then s := 'home'; end if;
  -- a simple brake on scripted floods: at most 60 new sign-ups a minute site-wide
  if (select count(*) from public.email_list where created_at > now() - interval '1 minute') >= 60 then
    return 'busy';
  end if;
  insert into public.email_list (email, source) values (e, s)
    on conflict ((lower(email))) do update set unsubscribed_at = null;
  return 'ok';   -- same answer whether the address was new or already there
end;
$$;
revoke all on function public.join_email_list(text, text) from public;
grant execute on function public.join_email_list(text, text) to anon, authenticated;

-- check: select public.join_email_list('test@example.com','home');  then  select * from public.email_list;
-- tidy up the test row:  delete from public.email_list where email = 'test@example.com';
