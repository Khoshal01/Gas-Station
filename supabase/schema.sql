-- Complete SQL for the current Northline frontend. Run this entire file in Supabase SQL Editor.
-- Alternatively apply the three files in supabase/migrations in filename order.

-- Compatible with the existing React frontend. No demo records are inserted.
begin;
create table if not exists public.station_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);
comment on table public.station_workspaces is
  'One workspace per auth user: tanks, pumps, sales, deliveries, expenses, shifts and staff. Reports are computed from dated entries.';
commit;


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


begin;
create or replace function public.validate_station_data(payload jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare
  collection text;
  item jsonb;
  tank_ids text[] := array[]::text[];
  seen_ids text[];
begin
  if jsonb_typeof(payload) is distinct from 'object' then return false; end if;
  foreach collection in array array['tanks','pumps','sales','deliveries','expenses','staff','shifts'] loop
    if jsonb_typeof(payload->collection) is distinct from 'array' then return false; end if;
    seen_ids := array[]::text[];
    for item in select value from jsonb_array_elements(payload->collection) loop
      if jsonb_typeof(item) is distinct from 'object'
        or jsonb_typeof(item->'id') is distinct from 'string'
        or length(item->>'id') = 0 or (item->>'id') = any(seen_ids) then return false; end if;
      seen_ids := array_append(seen_ids,item->>'id');
      if collection = 'tanks' then
        if jsonb_typeof(item->'name') is distinct from 'string'
          or jsonb_typeof(item->'capacity') is distinct from 'number'
          or jsonb_typeof(item->'stock') is distinct from 'number'
          or jsonb_typeof(item->'price') is distinct from 'number' then return false; end if;
        if (item->>'capacity')::numeric <= 0 or (item->>'stock')::numeric < 0
          or (item->>'stock')::numeric > (item->>'capacity')::numeric
          or (item->>'price')::numeric <= 0 then return false; end if;
        tank_ids := array_append(tank_ids,item->>'id');
      else
        if collection in ('sales','deliveries','expenses','staff','shifts') then
          if jsonb_typeof(item->'date') is distinct from 'string'
            or (item->>'date') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
          perform (item->>'date')::date;
        end if;
        if collection in ('pumps','sales','deliveries') then
          if jsonb_typeof(item->'fuel') is distinct from 'string'
            or not ((item->>'fuel') = any(tank_ids)) then return false; end if;
        end if;
        if collection in ('sales','deliveries','expenses') then
          if jsonb_typeof(item->'amount') is distinct from 'number' then return false; end if;
          if (item->>'amount')::numeric <= 0 then return false; end if;
        end if;
        if collection in ('sales','deliveries') then
          if jsonb_typeof(item->'liters') is distinct from 'number'
            or jsonb_typeof(item->'price') is distinct from 'number' then return false; end if;
          if (item->>'liters')::numeric <= 0 or (item->>'price')::numeric <= 0
            or abs((item->>'amount')::numeric - round((item->>'liters')::numeric * (item->>'price')::numeric,2)) > 0.01 then return false; end if;
        end if;
        if collection in ('staff','shifts') then
          if jsonb_typeof(item->'name') is distinct from 'string'
            or length(btrim(item->>'name')) = 0 then return false; end if;
        end if;
        if collection = 'staff' and coalesce(item->>'role','') not in ('operator','manager') then return false; end if;
        if collection = 'shifts' and coalesce(item->>'status','') not in ('open','closed') then return false; end if;
        if collection = 'pumps' and coalesce(item->>'status','') not in ('ready','service') then return false; end if;
      end if;
    end loop;
  end loop;
  return true;
exception when others then return false;
end;
$$;
revoke all on function public.validate_station_data(jsonb) from public, anon;
grant execute on function public.validate_station_data(jsonb) to authenticated;

create or replace function public.touch_station_workspace()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.version != 0 then raise exception 'Initial version must be zero'; end if;
  else
    if new.owner_id is distinct from old.owner_id then raise exception 'Owner cannot change'; end if;
    if new.version != old.version + 1 then raise exception 'Version must advance by one'; end if;
  end if;
  if not public.validate_station_data(new.data) then raise exception 'Invalid station data'; end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.touch_station_workspace() from public, anon;
drop trigger if exists station_workspace_updated on public.station_workspaces;
create trigger station_workspace_updated before insert or update on public.station_workspaces
  for each row execute function public.touch_station_workspace();
-- Existing rows are preserved. Validation applies to future inserts and updates.
commit;
