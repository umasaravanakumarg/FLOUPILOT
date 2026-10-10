# FLOU Pilot

FLOU Pilot is an interactive production finance demonstration built with Next.js App Router, React, TypeScript, Tailwind CSS, Recharts and Lucide.

## Run locally

```bash
npm ci
npm run dev
```

Use Node.js 20.9 or newer and npm 10 or newer. Open http://localhost:3000. No `.env` file, API key, or external service is required for the demo.

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

## Financial assumptions

Amounts are stored as integer paise. The original Project Phoenix headline summary is an explicit demo baseline: ₹10 Cr original budget, ₹4.82 Cr actual spend, ₹5.18 Cr remaining, ₹18.5 L daily burn, 17 pending approvals and ₹10.84 Cr forecast. Remaining is original budget less reported actual spend. Forecast variance is forecast less original budget. Commitments are displayed independently and are not added a second time to the forecast.

Department projections and the sample expense ledger are illustrative and are not a complete transaction history; they are not summed into the headline actual spend. Art & Sets illustrates a ₹16 L forecast overrun (₹1 Cr original allocation and ₹1.16 Cr forecast). Cash balances and dated funding schedules are not modeled, so the interface does not infer a cash-flow forecast.

New expenses move through Draft → Pending → Approved/Rejected → Paid. Only submitted requests create new pending approvals and commitments. Approving a request moves it into committed obligations; payment moves it into actual spend and reduces the outstanding commitment. Crew payments are checked against the member's outstanding amount. Workflow events update the same state used by module screens, reports and AI Pilot.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

## Demonstration limits

This is browser-local demo software, not a production accounting or SaaS backend. It has no user authentication, role enforcement, database synchronization, bank integration, real AI provider, OCR, vendor contract accounting, or transaction reconciliation. AI Pilot is a deterministic rules-based demo and clearly labels the data on which its answers rely. Demo fixtures and the stated financial baseline are illustrative assumptions, not an auditable general ledger; cash-flow forecasting is not modeled.

The launch-readiness dependency audit found five high-severity advisories in development-only lint tooling: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. The configured registry does not publish a patched `braces` version, and npm's proposed automatic fix downgrades `eslint-config-next` to an incompatible Next 14 release. The framework lint configuration was therefore retained rather than applying an unsafe workaround. Production dependencies had no advisories in this review.

## Production integration priorities

1. Replace browser storage and fixture assumptions with a server-backed relational ledger, atomic workflow transactions, schema validation/migrations, and an auditable activity log.
2. Add authenticated users, role-based authorization, tenant/production access controls, and server-side validation before exposing approval or payment actions.
3. Reconcile imported transactions, commitments, invoices, and department budgets against accounting records; only then implement cash-flow forecasting.
4. Add payment-provider/bank integrations and any hosted AI/OCR provider behind explicit configuration, consent, access control, and verified source evidence.
