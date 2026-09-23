# Northline station management

React + Vite + Tailwind frontend based on the supplied Northline HTML template. IBM Plex Sans/Mono, ivory panels, amber accents, and an animated CSS station illustration. English, Afghanistan Pashto and Afghanistan Dari with RTL layout. Fonts load from Google Fonts with local fallbacks.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Select **Explore demo station** to try all pages without credentials. Demo records persist in this browser only. Settings includes a demo reset button.

```sh
npm run build
npm test
```

## Connect your Supabase project

1. Fill the existing `.env` file:
   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY
   ```
2. Run the entire `supabase/schema.sql` in your project's SQL editor. It includes all three ordered migrations, supports the original schema, and is safe to rerun. See `supabase/README.md` for details.
3. Create an email/password user in Supabase Authentication. This frontend intentionally has no public signup.
4. Restart Vite, then sign in with that user. Authenticated workspaces start with empty transactions and zero stock. Record deliveries to add opening stock.

Only use a publishable or anon key. Vite exposes these values to the browser; never use a secret/service-role key. `.env` is ignored by Git.

## Included

- Login with Supabase email/password authentication and separate demo access.
- Dashboard, tank inventory, manual pump maintenance status.
- Sales and deliveries with stock validation and amount calculation.
- Expenses, searchable records, staff contact records, open/close shift log.
- Daily, current-week (Monday through today), current-month reports and CSV export, using Kabul dates and AFN.
- Language selection, RTL, responsive layouts and reduced-motion support.

## Scope and next production steps

This is a frontend starter. The optional Supabase integration stores one JSON workspace per authenticated user with row-level security and optimistic version checks to avoid silent lost updates. Staff records do not create login accounts or grant permissions. Shared team stations, roles, server-side inventory validation, immutable accounting/audit records, supplier/customer credit, pump hardware integration, shift cash reconciliation, inventory valuation and profit accounting need a normalized backend before production use. The displayed revenue less expenses is explicitly not net profit. Fuel prices/capacities currently come from initial settings; record actual per-liter prices on entries. The illustration is not a live hardware feed. No real Supabase connection can be verified until credentials and schema are provided. Translations should be reviewed by native Afghan speakers before rollout.
