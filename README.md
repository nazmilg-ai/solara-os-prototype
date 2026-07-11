# Solara Pricing Engine

Prototype quote builder replacing the Excel pricing engine for **Solara Shades** and
**Blinds Kingdom**. See `PROJECT_BRIEF.md` for the full business requirements.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind), Server Actions for all reads/writes
- Prisma ORM + PostgreSQL
- Vitest for pricing-logic unit tests

## What's implemented

- **Quote Builder** (`/quotes/new`): multi-line cart. Per line: Category → Fabric
  (→ optional Colour) → Band lookup, Category+Band+Width+Drop → price lookup,
  discount (with default fallback), VAT + Premium/Negotiation margin multiplier,
  and a max-size check against Category+System. "No match" and "multiple match"
  are surfaced explicitly and block adding the line — never silently guessed.
  Deposit %/Balance are computed across the whole quote.
- **Two suppliers**: Decora (`NEGOTIATED_DISCOUNT` — list price minus a discount %)
  and Beverley Blinds (`FIXED_PRICE` — list price is the cost, no discount ever
  applied, regardless of what's configured). The schema also models a `PROFORMA`
  supplier type for future pay-before-dispatch suppliers, but none is seeded.
- **Customers** (`/customers`): CRUD, empty by default.
- **Admin → Import** (`/admin/import`): CSV upload (with downloadable templates)
  for Fabrics & Colours, Fabric→Band Mappings, Price List Rows, Discount Rates,
  and Max Size Rules, per supplier. Re-uploading is safe — exact duplicate rows
  are skipped. Ambiguous source data (e.g. a fabric name that legitimately maps
  to two different bands) is preserved rather than deduplicated, since the app
  is designed to surface that ambiguity to the advisor.
- **Admin → Settings** (`/admin/settings`): VAT % and the Premium/Negotiation
  margin multipliers. Multipliers seed at a neutral `1.0000` placeholder — the
  business hasn't supplied real margin figures yet.
- **Admin → Catalogue** (`/admin/catalogue`): read-only view of what's configured.

No fabrics, prices, discounts, or max-size data are seeded — only the structural
scaffolding named in the brief (suppliers, categories, VAT setting, mode
multipliers). Real data arrives via CSV import.

## Local development

Requires a PostgreSQL database.

```bash
npm install
echo 'DATABASE_URL="postgresql://user:pass@localhost:5432/solara_os?schema=public"' > .env
npx prisma migrate dev
npm run db:seed        # structural reference data only, no fake prices
npm run dev
```

Run the pricing-logic test suite (needs a second, disposable Postgres database
for isolation — see `vitest.config.ts` for the `DATABASE_URL` it expects):

```bash
npm test
```

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this on the deployed branch).
2. In Vercel, "Add New Project" → import the repo.
3. Add a Postgres database — the easiest path is the **Vercel Postgres** or
   **Neon** integration from the Vercel dashboard, which sets `DATABASE_URL`
   for you automatically. (Any managed Postgres works — just set `DATABASE_URL`
   in the project's Environment Variables.)
4. Deploy. `npm run build` runs `prisma generate && next build` automatically
   (see `package.json`).
5. Run migrations against the production database once, e.g. via `vercel env pull`
   locally and then `npm run db:migrate`, or via a one-off Vercel deployment hook.
6. Optionally run `npm run db:seed` against production the same way, to populate
   suppliers/categories/VAT/multiplier defaults before importing real CSVs via
   `/admin/import`.

## Data model notes

- `FabricBandMapping` is intentionally **not** unique per (supplier, fabric) —
  source spreadsheets sometimes carry two rows for what looks like one fabric
  name (e.g. a plain vs "with tapes" variant never disambiguated in the sheet).
  The app surfaces that as "multiple matches — refine selection" instead of
  guessing, which requires the duplicates to be importable in the first place.
- `QuoteLine` snapshots the resolved band, price, discount, VAT and size-check
  at save time, so edits to price tables later don't retroactively change a
  saved quote. `createQuote` always recomputes every line server-side from the
  raw selection — client-provided totals are never trusted.
- Brand (`SOLARA_SHADES` / `BLINDS_KINGDOM`) tags Customers and Quotes and
  drives the header switcher; pricing logic itself is brand-agnostic, per the
  brief ("same backend").
