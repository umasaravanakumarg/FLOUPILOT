# Supabase pilot setup

This integration is intentionally opt-in. With `SUPABASE_URL` and
`SUPABASE_ANON_KEY` both absent, FLOU Pilot stays in the seeded browser-local
demo. Set both in the **server runtime only** to switch to the authenticated
PostgreSQL pilot. A partial configuration is an error, not a fallback to demo.

`SUPABASE_ANON_KEY` is the Supabase project publishable/anon key. It is used by
the server-side SSR client with the signed-in user's session and PostgreSQL RLS.
Registration calls `auth.signUp()` from a server action through this client.
Do not set `SUPABASE_SERVICE_ROLE_KEY`, a database password, or any privileged
key in this application. No service-role client is implemented.

## Provision a disposable project

1. Create a non-production Supabase project for integration testing. Enable
   email sign-ups and configure the desired password policy, email delivery,
   redirect URLs, MFA requirements, backup policy, and allowed origins. Keep
   email confirmation enabled for hosted deployments.
2. Install/use the Supabase CLI, authenticate, and link the project. Apply
   migrations with `supabase db push`; review the migration SQL and resulting
   grants/RLS policies in the Supabase dashboard before connecting the app.
3. Copy `.env.example` to `.env.local` and set `SUPABASE_URL` and
   `SUPABASE_ANON_KEY` from project API settings. Keep the file out of Git and
   restart Next.js. Missing/incomplete settings must not be used to test auth.
4. In Supabase Auth URL Configuration, set the production Site URL and allow
   the production callback URL `https://<your-domain>/auth/callback`. Add
   localhost and Vercel preview callback URLs only for the environments that
   need them, and configure production SMTP so confirmation messages are
   delivered reliably. The app exchanges confirmation codes server-side and
   does not accept arbitrary post-auth redirect destinations.
5. Public registration creates an Auth identity only. It never creates a
   tenant or production membership. As a database administrator, provision a
   tenant, the user's tenant membership, production membership, production,
   departments, and budget allocations. An owner/admin membership grants
   tenant-wide access; other users need a `member` tenant row and an explicit
   production membership. Membership grants should be minimum necessary. The
   first owner/admin is a bootstrap operation and must be performed via the
   trusted dashboard/CLI.
6. Test with separate users and tenants and the access matrix below before
   entering any real financial data.

The app authenticates every page load and server mutation with Supabase Auth.
Reads use a server-only data access layer under the user's RLS identity.
Mutations call PostgreSQL functions that check both production membership and
role; those functions lock affected rows and commit the business update and
database-triggered audit event in the same transaction. The authenticated DB
role has `SELECT` grants only for business tables; finance mutations are
exposed through narrowly granted functions. The migration does not enable
anonymous reads or authenticated direct table writes.

Role intent:

| Role | Read | Submit expense / edit production | Approve | Revise budget / pay |
|---|---|---|---|---|
| Tenant owner/admin | Every production in that tenant | Yes | Yes | Yes |
| Production producer | Assigned production | Yes | Yes | Yes |
| Production finance | Assigned production | Yes | Yes | Yes |
| Production approver | Assigned production | No | Yes | No |
| Production viewer | Assigned production | No | No | No |

“Production Manager” and “Department Head” are not roles in the database
contract and have no implicit permissions. Do not provision those labels as
tenant metadata and assume they map to `producer` or `approver`. Obtain an
approved role mapping and department-scope policy before adding either role.

The executable RPC checks are authoritative. Validate this matrix against a
live database; it is not a substitute for an external security review.

## Disposable database security tests

The pgTAP suite at `supabase/tests/authorization_and_mutations.sql` creates
temporary test users, tenants, productions, budgets, expenses, approvals, and
crew records inside a transaction and rolls the fixtures back. It checks
anonymous grants, no-membership and cross-tenant reads, viewer/approver
restrictions, role-label absence, client-selected production IDs, approval
and payment transitions, rollback on inconsistent linked records, budget
revisions, crew overpayment, and audit actor/value capture.

Use a disposable local Supabase stack or a non-production Supabase project.
Apply the migration first, ensure the `pgtap` extension is enabled, then execute
the test file as the database owner (the fixtures require trusted inserts into
`auth.users`):

```bash
supabase init # only when this repository has not yet been initialized for the CLI
supabase start
supabase db reset
psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres' \
  -v ON_ERROR_STOP=1 \
  -c 'create extension if not exists pgtap with schema extensions'
supabase test db
```

For a hosted disposable project, connect as the database owner and run the
migration, enable `pgtap` if it is not enabled, then execute the test SQL in a
database session:

```bash
supabase link --project-ref <DISPOSABLE_PROJECT_REF>
supabase db push
psql "$DISPOSABLE_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c 'create extension if not exists pgtap with schema extensions'
psql "$DISPOSABLE_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/tests/authorization_and_mutations.sql
```

Do not point these commands at production. The tests use `SET ROLE` and
request JWT claims to exercise Supabase RLS and function behavior; the script
must run with enough database-owner privileges to create its temporary auth
fixtures. A passing pgTAP run is necessary but does not replace deployed Auth,
cookie, API/PostgREST, or browser workflow verification.

The suite checks duplicate transitions sequentially. To verify row-lock
behavior under actual concurrent requests, create one approved test expense
and use two authenticated sessions for the same production:

1. In both sessions, connect to the disposable project's database and set the same test finance user's JWT identity: `set role authenticated; select set_config('request.jwt.claim.sub', '<finance-user-uuid>', false);`
2. In session A, execute `begin; select public.record_expense_payment('<expense-uuid>');` and leave the transaction open.
3. In session B, execute `select public.record_expense_payment('<same-expense-uuid>');`; confirm it waits for A and then fails because the expense is paid.
4. Commit A, then verify exactly one `payments` row exists, the expense and linked approval are `paid`, and matching audit events exist. Roll back/reset the disposable database afterward.

Run the equivalent two-session test with crew payments whose combined amount
would exceed `due_paise`; only the first valid payment may commit.

## Initial records: do not seed demo fixtures

`lib/demo-data.ts` contains fictional, intentionally non-reconciling examples.
The app has no demo-to-pilot migration and no fixture import script. Never copy
Project Phoenix's ₹10 Cr / ₹4.82 Cr / ₹10.84 Cr summary, its 17 approvals, or
the illustrative Art department data into a real tenant.

Before a pilot load:

1. Choose a finance-approved accounting cut-off and identify authoritative
   source documents for original/revised department allocations, unpaid
   approved requests, paid expense records, crew obligations, and payments.
2. Reconcile the opening records outside the app, obtain approval, and preserve
   a versioned source manifest and control totals.
3. Create the first tenant and owner membership through a trusted database
   administration session. Insert production memberships and only the
   independently verified production, department, and budget-allocation
   records. Replace every UUID and amount below with approved values.
4. Import expenses with their true statuses and supporting references using a
   reviewed migration/import process. Every `paid` expense or payment needs a
   corresponding verified payment row. The app currently does not provide a
   bulk import or invoice-evidence workflow.
5. Compare the app's derived totals to the signed-off source manifest before
   permitting approvals or payments.

The minimal SQL shape below illustrates the bootstrap relationship only; it
does not define or imply real budget values:

```sql
begin;

insert into public.tenants (id, name)
values ('<tenant-uuid>'::uuid, '<approved-tenant-name>');

insert into public.tenant_memberships (tenant_id, user_id, role)
values ('<tenant-uuid>'::uuid, '<auth-user-uuid>'::uuid, 'owner');

insert into public.productions (id, tenant_id, name, production_type, industry)
values (
  '<production-uuid>'::uuid,
  '<tenant-uuid>'::uuid,
  '<approved-production-name>',
  '<production-type>',
  '<industry>'
);

insert into public.production_memberships (tenant_id, production_id, user_id, role)
values ('<tenant-uuid>'::uuid, '<production-uuid>'::uuid, '<auth-user-uuid>'::uuid, 'producer');

insert into public.departments (id, tenant_id, production_id, name)
values ('<department-uuid>'::uuid, '<tenant-uuid>'::uuid, '<production-uuid>'::uuid, '<approved-department>');

insert into public.budget_allocations (
  tenant_id, production_id, department_id, original_paise, revised_paise
)
values (
  '<tenant-uuid>'::uuid, '<production-uuid>'::uuid, '<department-uuid>'::uuid,
  <approved_original_paise>, <approved_revised_paise>
);

commit;
```

Rows provisioned through a privileged database session have no end-user Auth
actor in their audit event (`actor_id` is null); record who approved and ran
that bootstrap separately in the source manifest. Do not use this SQL template
to bulk import transactions.

## Accounting semantics and current scope

- Actuals are paid expenses and recorded crew or standalone-approval payments.
- Commitments are pending/approved expenses plus approved standalone requests
  that have not been paid.
- A linked approval updates expense/approval status together. Payment is a
  separate, full-amount operation; partial expense payments are not supported.
- Forecast includes each non-draft/non-rejected expense once plus approved or
  paid standalone requests. Pending standalone requests remain proposals until
  approved; they are visible in approvals but are not yet commitments or forecast
  items. Commitments are a separate display category. Remaining budget is
  original allocation less actuals, not a cash balance.
- Revised allocations do not rewrite original allocations. Variance uses
  forecast less original allocation.
- Crew payments are checked under a row lock against due less prior payments.
- Paise amounts use PostgreSQL `bigint` and must remain within JavaScript's
  safe-integer limit when returned to the app.

The database schema has no separate accruals, tax, invoice evidence, reversals,
partial settlements, multi-currency, exchange rates, chart of accounts, cash
balances, or close-period controls. These must be designed with Finance before
real operational accounting use.

## AI provider configuration

The deterministic rules remain available without an AI credential. To enable
the optional server-side OpenAI-compatible narrative adapter, set all three
`FLOU_AI_BASE_URL`, `FLOU_AI_API_KEY`, and `FLOU_AI_MODEL` values in a secret
manager. Provider requests are made only from an authenticated server action,
with a small selected-production context, an 8-second timeout, bounded input
and output, and application-computed figures/evidence. Generated figures are
rejected; displayed computed facts remain from application calculations.
Provider text can still be inaccurate, is labeled as AI-generated, and must
not be used as an approval, accounting entry, or payment instruction. Review
provider privacy, retention, data-processing, abuse/rate-limit, and regional
requirements before enabling it. A partial provider configuration fails over
to the transparent deterministic explanation.
