# FLOU Pilot

FLOU Pilot is an interactive production finance demonstration built with Next.js App Router, React, TypeScript, Tailwind CSS, Recharts and Lucide.

## Run locally

```bash
npm ci
npm run dev
```

Use Node.js 22 or newer and npm 10 or newer. Open http://localhost:3000. With no Supabase variables set, the seeded demo requires no API key or external service. See [`supabase/README.md`](supabase/README.md) before enabling the authenticated pilot mode.

To run the production build locally:

```bash
npm run build
npm run start
```

Workflow state and preferences are persisted in the current browser profile and origin only; they are not shared between users or devices. Settings can reset preferences, but does not reset production workflow data. To restore the seeded workflow data, remove the `flou-pilot-demo-state` entry from this origin's browser local storage and reload. This reset is browser-local and there is no in-app workflow reset control.

## Application architecture

- `lib/types.ts` defines production, budget, expense, approval, vendor, crew and payment models.
- `lib/demo-data.ts` contains the typed, fictional fixtures.
- `lib/finance.ts` computes production and department financial views using integer paise.
- `lib/finance-state.ts` is the reducer for validated state transitions and activity records.
- `lib/ai-demo.ts` provides deterministic, explainable offline answers based on current state.
- `components/flou-app.tsx` owns the shared workspace, navigation, search and browser persistence.
- Feature screens live in focused component modules; shared elements and currency formatting are in `components/ui.tsx`.
- `supabase/migrations/` defines the PostgreSQL schema, tenant/production membership boundaries, row-level security, guarded financial RPCs and database-generated audit events.
- `supabase/tests/authorization_and_mutations.sql` is a pgTAP security and workflow suite for isolated disposable database testing. `npm run build` also scans browser chunks to ensure seeded demo records are not shipped in client JavaScript.
- `lib/supabase/data-access.ts` is the server-only authorized read layer; `lib/supabase/pilot-action.ts` validates server mutations and invokes transactional database functions.
- `lib/supabase/database.types.ts` contains the checked-in typed schema contract. Regenerate/update it when migrations change.
- `proxy.ts` refreshes Supabase SSR sessions; `app/actions/auth.ts` handles password sign-in and sign-out.
- `.env.example` documents server-only configuration names. No service-role key is required or used by the application.

## Accounting rules

These rules apply to mutations before any pilot financial record is changed:

1. **Actual spend** is the sum of recorded paid expenses and crew/standalone-approval payments. An approval is never actual spend.
2. **Commitments** are unpaid pending/approved expenses and approved standalone requests. Recording payment removes an obligation from commitments; expense payment moves its full approved amount into actuals.
3. **Approval transitions** are `pending → approved|rejected`; only approved expenses or standalone approvals can be paid. Database functions lock rows and reject duplicate/invalid transitions.
4. **Forecast** includes each non-draft/non-rejected expense once plus approved or paid standalone requests. A pending standalone request remains a proposal until approved; it is visible in pending approvals but is not yet a commitment or forecast item.
5. **Remaining against original allocation** is original budget less actual spend; it is not a cash balance and does not deduct commitments. Forecast variance is forecast less original budget.
6. **Budget variance** is department forecast less original department allocation. A revision changes the revised allocation, not the original budget or historical actuals.
7. **Crew payments** cannot exceed the contracted due amount after earlier payments. Amounts are integer paise in the database and application; SQL workflow calls are transactional and audited.

The Project Phoenix headline is a deliberately supplied demo summary, not an imported ledger: ₹10 Cr original budget, ₹4.82 Cr actual spend, ₹5.18 Cr remaining, ₹18.5 L/day burn, 17 pending approvals and ₹10.84 Cr forecast. Art & Sets shows an illustrative ₹16 L overrun. Demo sample expenses and departments are not a complete accounting history and must not be treated as source records.

Authenticated pilot mode starts with no fixture baseline: original/revised budgets derive from real budget allocations, actuals from paid expenses/payments, commitments from pending and approved records, and forecast from those real records. No demo fixture is copied into the pilot database. Cash balances and dated funding schedules are not modeled, so no cash-flow forecast is inferred.

New expenses move through `Draft → Pending → Approved/Rejected → Paid`. Submission creates a linked pending approval; approval creates an obligation; payment records a payment row and moves the expense into actuals. Database triggers record changes to financial entities in the append-only audit table.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:client-bundle
npm audit
```

## Demonstration limits

**Demo mode** remains browser-local and works without credentials. **Supabase mode** is an integration foundation, not a production-ready finance system. It requires Supabase Auth, the migration, tenant and production memberships, RLS policies, and server-side setup described in [`supabase/README.md`](supabase/README.md). When Supabase configuration is present, the app fails closed on missing configuration, requires an authenticated user, loads records through RLS, disables demo-state persistence, and routes supported mutations through authenticated, role-checked database functions. Supabase and AI provider secrets are read only by server modules. Sign-up is disabled; an administrator must provision users.

The current pilot schema and adapters have not been exercised against a provisioned Supabase project in this environment because no project URL, user credentials, or database are configured. Before any real financial data is entered, apply the migration to a disposable Supabase project and run [`supabase/tests/authorization_and_mutations.sql`](supabase/tests/authorization_and_mutations.sql); see [`supabase/README.md`](supabase/README.md) for the test setup and two-session concurrency checks. SQL policy behavior, deployed cookie refresh, RLS role matrices, and concurrent writes remain unverified. Production also requires deployment TLS/secret management, backup and restore tests, monitoring, rate limiting, reconciliation/import controls, and business-owner sign-off. Audit events are transactionally captured, but retention, export, tamper-evidence/immutability under database-owner access, and compliance requirements need a formal policy.

AI Pilot keeps its deterministic rules. The optional server adapter accepts only bounded questions, builds a limited context from authorized server records, sends no client-held secret, imposes an 8-second timeout/output cap, and discards generated figures so displayed amounts/evidence remain application-calculated. Provider narrative is labeled as AI-generated. Configure all of `FLOU_AI_BASE_URL`, `FLOU_AI_API_KEY`, and `FLOU_AI_MODEL` server-side or leave all unset to use deterministic responses.

The dependency audit currently has five high-severity advisories in development-only lint tooling: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. The configured registry does not publish a patched `braces` version, and npm's proposed automatic fix downgrades `eslint-config-next` to an incompatible Next 14 release. The framework lint configuration was retained rather than applying an unsafe workaround. The last production-only audit found no vulnerabilities.

## Remaining production integration work

1. Apply and test migrations in a disposable Supabase project; verify anonymous, viewer, approver, finance, producer, tenant-admin, and cross-tenant access against a role matrix.
2. Add audited membership administration, account recovery/MFA, security monitoring, backups and restore drills, rate limits, and operational runbooks.
3. Reconcile opening budgets, actuals, commitments, invoices and payment evidence against an approved accounting source before loading any pilot values.
4. Obtain finance/legal sign-off on accounting, audit retention, approval separation-of-duties, and payment control design; add concurrency and database integration tests.
5. Integrate a bank/payment provider or cash-flow model only after source balances and dated funding schedules are available. Assess the optional AI provider, retention, privacy and data-processing terms before enabling it.
