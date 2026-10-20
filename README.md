# Magkano Ba?

Philippine compensation intelligence engine and raw record browser across 4,000+ verified community submissions (Liyab First Pay & r/phcareers).

## Features

- **Macroeconomic Inflation Rebasing**: Real-time adjustment to 2026 purchasing power via Philippine Statistics Authority CPI benchmark (2018=100 index: 134.5).
- **Statutory & Tax Engine**: TRAIN Law 2026 brackets + statutory contributions (SSS, PhilHealth, Pag-IBIG) with local-vs-remote contractor net take-home arbitrage.
- **Granular University Analytics**: Starting pay by canonical school (UP Diliman, Ateneo, UST, DLSU, PUP, PLM, UPLB, etc.) with $n \ge 15$ confidence thresholds.
- **Raw Records Grid (`/table`)**: Client-side filtering, multi-column sorting, pagination, and RFC-4180 CSV export with expandable benefits and mentor advice drawers.
- **AI Offer Evaluator**: 100% client-side BYOK Google Gemini offer auditor grounded against dataset percentiles.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling & UI**: Tailwind CSS v4, shadcn/ui (`base-nova`), `@base-ui/react`, Tabler Icons
- **Visuals**: Recharts
- **Validation**: Zod v4

## Quickstart

```bash
# Install dependencies
pnpm install

# Run dev server (http://localhost:3000)
pnpm dev

# Run test suite (33 tests across 4 seams)
pnpm test

# Typecheck
pnpm exec tsc --noEmit

# Production build
pnpm build
```

## Data Sources

- `public/data/records.json`: 4,010 normalized community records ingested from:
  - Liyab First Pay Survey (fresh grad compensation & negotiation outcomes)
  - r/phcareers Work & Career Path Information Sheet (0–10+ YOE career progression)
- `scripts/etl/index.ts`: Offline CSV parser, university normalizer, and taxonomy classifier.
