# Northline station management

React, Vite and Tailwind frontend with Supabase email/password sign-in. English, Afghanistan Pashto and Afghanistan Dari, RTL layouts, AFN currency and Kabul dates. The public demo button has been removed.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Fill `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then restart Vite. Use only a public publishable/anon key, never a service-role key. Create your email/password account through Supabase Authentication.

## Database and sample data

- New database: run all of `supabase/schema.sql` in Supabase SQL Editor.
- If migrations 001–003 are already installed: run `supabase/migrations/202609230004_management.sql`.
- To add sample records to your account: replace `YOUR_LOGIN_EMAIL_HERE` in `supabase/mock-data.sql` with your login email, run the script, and refresh the app. Existing records and tank quantities are preserved; sample sales and deliveries balance each other for existing tanks.
- See `supabase/README.md` for details.

## Workflows

Staff includes an editable monthly salary, month-specific paid/remaining balances and payment history. Salaries use Gregorian calendar months, are not prorated, and do not automatically accrue cumulative arrears. Select the salary month when paying; the payment date records when money was actually paid. The first payment snapshots the month's salary, so later salary edits do not change that month's existing balance. Overpayments are rejected. Salary payments appear once in expenses and are included in expense totals.

Shifts lists every staff member with Start shift / End shift controls. Starting after ending creates a new shift and keeps the completed history. Only one open shift is allowed per staff member. Old free-text shifts remain in history.

Expenses require a reason, date and positive amount. Pay salary selects a staff member and month, records a payment date/amount and immediately updates their remaining balance.

Settings saves station name, address and light/dark theme to the workspace. Language is a browser preference. Changes to the station identity appear in the sidebar and page headers.

Reports cover daily, Monday-through-today weekly, month-to-date and all-time periods. Complete CSV includes sales, deliveries, expenses/payroll, shifts and current snapshots of inventory, staff, salary balances and pumps. Snapshot sections are explicitly labeled: they are not historical inventory valuations. JSON export contains all workspace records. Revenue less expenses is not net profit; it excludes cost-of-goods accounting.

## Verification

```sh
npm test
npx playwright test
npm run build
```

Database tests use local PostgreSQL via PGlite. Browser tests run an isolated Vite server on port 5174 with mocked Supabase authentication and data; they do not use the real project or bypass production login. Install Google Chrome for the configured browser tests.

## Current architecture

One JSON workspace per authenticated owner, row-level access policies, validation and optimistic version checks. Staff records are not login accounts; shared stations, granular permissions, immutable accounting/audit history and hardware integration require additional backend work. SQL scripts are prepared and locally tested, not automatically applied to your Supabase project.

## Main dashboard totals

Overview shows today's sales, all-time sales/expenses through today, current fuel liters and selling value, total staff, staff currently on duty, and salary remaining for the current calendar month. On-duty staff are distinct registered staff with an open linked shift; legacy unlinked shifts are counted separately under open shifts. Detailed cards separate general expenses from salary payments, delivery purchases, monthly payroll and storage/pump status. Inventory selling value is stock times current selling price, not accounting cost. Summary cards open their related pages.
