-- BrainWhim: avatars (Oct 26, 2026). Safe to run more than once.
--
-- Adds three columns to public.profiles:
--   avatar        which avatar the player chose (e.g. 'sunny', 'cobalt', 'queen'); empty = the default Sunny Spark
--   avatar_charm  the room charm they wear (e.g. 'chess'), or empty
--   charms        the room charms they have earned (beating The House at level 10 in that room)
--
-- A check on the server makes sure:
--   * only real avatar and charm names are saved (anything else is cleared),
--   * Club avatars (Constellations and Nebulae) can only be chosen by Club members.
--     (If a membership ends, the site simply shows the default avatar until they choose again.)
--
-- Players can read everyone's avatar (it shows at the tables) and change only their own.
-- Note: charms are earned in the browser, like piece sets, so the server can't prove them yet. They're cosmetic.

alter table public.profiles add column if not exists avatar       text;
alter table public.profiles add column if not exists avatar_charm text;
alter table public.profiles add column if not exists charms       text[] not null default '{}';

create or replace function public.bw_avatar_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_ids text[] := array['sunny','rosy','mint','lilac','ringed','moon','marble','coral','cobalt','magenta','teal','goldm'];
  club_ids text[] := array['queen','archer','owl','knight','rose','aurora','ember'];
  charm_ids text[] := array['chess','checkers','backgammon','yahtzee','dominoes','othello','mancala','cribbage','shutbox','morris'];
begin
  -- unknown names are cleared
  if new.avatar is not null and not (new.avatar = any(free_ids) or new.avatar = any(club_ids)) then
    new.avatar := null;
  end if;
  if new.avatar_charm is not null and not (new.avatar_charm = any(charm_ids)) then
    new.avatar_charm := null;
  end if;
  new.charms := coalesce(array(select distinct c from unnest(coalesce(new.charms, '{}')) c where c = any(charm_ids) order by c), '{}');

  -- choosing a Club avatar needs a Club membership (keeping one you already had is fine)
  if new.avatar = any(club_ids) and not coalesce(new.member, false) then
    if tg_op = 'INSERT' or old.avatar is distinct from new.avatar then
      raise exception 'club_avatar: Club avatars are for Club members';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists bw_avatar_check on public.profiles;
create trigger bw_avatar_check
  before insert or update of avatar, avatar_charm, charms on public.profiles
  for each row execute function public.bw_avatar_check();

-- column permissions (the lock-down script grants column by column, so new columns need their own lines)
grant select (avatar, avatar_charm, charms) on public.profiles to anon, authenticated;
grant update (avatar, avatar_charm, charms) on public.profiles to authenticated;

-- UNDO, if ever needed:
--   drop trigger if exists bw_avatar_check on public.profiles;
--   drop function if exists public.bw_avatar_check();
--   alter table public.profiles drop column if exists avatar, drop column if exists avatar_charm, drop column if exists charms;
