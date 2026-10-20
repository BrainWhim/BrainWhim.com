-- Run once in SQL Editor after the first script.
-- Lets a second player find a table by code and sit as guest.
-- Also turns on live board updates.

drop policy if exists "rooms_select_code" on public.rooms;
create policy "rooms_select_code"
  on public.rooms for select
  to authenticated
  using (true);

drop policy if exists "rooms_claim_guest" on public.rooms;
create policy "rooms_claim_guest"
  on public.rooms for update
  to authenticated
  using (guest is null or auth.uid() = host or auth.uid() = guest)
  with check (guest is null or guest = auth.uid() or auth.uid() = host or auth.uid() = guest);

alter table public.rooms replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.rooms;
  exception when duplicate_object then
    null;
  end;
end $$;
