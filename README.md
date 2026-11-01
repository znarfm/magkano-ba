# Magkano Ba?

Philippine compensation intelligence engine and raw record browser across 4,000+ verified community submissions ([Liyab First Pay](https://docs.google.com/spreadsheets/d/1gnA91Tjr_3UCNV8x1_LoE0oC56r-pXXRdJcgTfOLlm0/edit?gid=549575995#gid=549575995) & [this r/phcareers thread](https://www.reddit.com/r/phcareers/comments/11rtmw3/rolesalary_master_list/) ([sheet](https://docs.google.com/spreadsheets/d/14RExibfpaRE0-81jjLvm374_BihMpq7zjUyFKwAqetU/edit?gid=392097489#gid=392097489))).

> [!NOTE]
> Data is not updated live, I basically took a snapshot of the two spreadsheets on October 20, 2026. Will updated only when I feel like it. 

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

# Run test suite
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
