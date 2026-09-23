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
