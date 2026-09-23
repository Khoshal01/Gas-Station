begin;
alter table public.station_workspaces enable row level security;
revoke all on public.station_workspaces from public, anon, authenticated;
grant select on public.station_workspaces to authenticated;
grant insert (owner_id, data, version) on public.station_workspaces to authenticated;
grant update (data, version) on public.station_workspaces to authenticated;

-- Drop only the policies owned by this app so this also upgrades the original schema.sql.
drop policy if exists "Read own station" on public.station_workspaces;
drop policy if exists "Create own station" on public.station_workspaces;
drop policy if exists "Update own station" on public.station_workspaces;
create policy "Read own station" on public.station_workspaces
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Create own station" on public.station_workspaces
  for insert to authenticated with check ((select auth.uid()) = owner_id and version = 0);
create policy "Update own station" on public.station_workspaces
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
-- No anonymous access, cross-user access or client delete permission.
commit;
