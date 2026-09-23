# Database migrations

## Supabase SQL editor (simplest)

Copy the entire contents of `schema.sql` into Supabase's SQL editor and run it. It combines all three migrations in order. It supports both a new database and the previous Northline schema and is safe to rerun. Existing station data is preserved. Do not run the individual files as well unless you are deliberately checking rerun behavior.

## Migration-file workflow

Apply these files in order through your normal Supabase migration workflow:

1. `migrations/202609230001_workspace.sql` — workspace table and Auth foreign key.
2. `migrations/202609230002_security.sql` — row-level security and minimum browser permissions.
3. `migrations/202609230003_validation.sql` — data validation, automatic timestamps, immutable owner, and version conflict checks.

Create your email/password login through Supabase Authentication, then fill `.env` and restart Vite. Do not insert passwords into SQL. The frontend creates an empty workspace at first sign-in; record a delivery to add fuel. You do not need a storage bucket, realtime publication, seed script, or separate reporting migration for the current app.

## What the database contains

`public.station_workspaces` stores `owner_id`, `data`, `version`, and `updated_at`. `data` contains the tanks, pumps, sales, deliveries, expenses, staff, and shifts arrays expected by the frontend. Reports are derived from the transaction dates. Data is private to its authenticated owner. Staff contact records do not create Auth accounts or shared access.

The database validates required collections, unique record IDs, fuel references, tank limits, positive amounts, transaction calculations, dates, and supported statuses. Updates must increment the version by one; the frontend also filters updates by the previous version to detect concurrent changes.

This matches the current frontend's workspace storage model, not a normalized shared-team accounting backend. Validation does not reconcile stock deltas against every transaction or provide immutable financial history. Those require a separate backend redesign. No existing records are deleted by these migrations. A malformed legacy record must be corrected before its workspace can next be saved.

The combined script contains a transaction per migration. If a step fails, fix the reported error and rerun; completed steps are repeatable. Take your usual database backup before applying changes to an existing production project.
