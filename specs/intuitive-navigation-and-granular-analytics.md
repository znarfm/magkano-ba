# Data Transparency, UI Decluttering & Granular Analytics Spec

## Problem Statement

Regular Filipino job seekers and early-career professionals find the current Magkano Ba dashboard overwhelming and unintuitive. The interface is crowded with technical economic jargon ("Macro Industry", "Seniority Band", "Take-Home Parity", "Net Arbitrage Simulator", "BYOK Offer Auditor") and dense tabbed views lacking plain-language labels, clear icons, and contextual guidance.

Furthermore, users lack visibility into the underlying 4,000+ salary data points:
1. Raw records cannot be directly inspected, searched, filtered, or exported to verify accuracy.
2. The dataset originates from two distinct community surveys—Liyab First Pay (entry-level only, 2,942 records) and r/phcareers (cross-seniority, 1,068 records)—yet users have no way to compare these sources or understand why experience bands differ between them.
3. Salary negotiation statistics are hidden behind a single summary metric rather than an intuitive distribution comparison (negotiated vs. non-negotiated offers).
4. Universities are grouped into broad institutional buckets ("State University & Polytechnic", "Private Metro") instead of displaying specific, recognizable schools (e.g., UP Diliman, Ateneo, UST, DLSU, PUP, PLM, UPLB).
5. Uncurated quote cards clutter the interface instead of being cleanly accessible alongside their associated salary records.

## Solution

Revamp the user experience and analytical transparency across three core pillars:

1. **Intuitive Navigation & Decluttered UI**:
   - Introduce a persistent top navigation bar with three primary routes:
     - `/` (**Overview**): Decluttered core compensation benchmarks with human-friendly terminology, Lucide/Tabler icons, and plain-English tooltips.
     - `/compare` (**Dataset Comparison**): A dedicated page comparing Liyab First Pay vs. r/phcareers at the entry-level baseline and illustrating seniority coverage across cohorts.
     - `/table` (**Raw Records**): A transparent, searchable, sortable data grid with CSV export and expandable row details showing benefits and mentor advice.
   - Replace complex economic jargon with everyday terms across all pages.
   - Remove the standalone quotes feed tab from the main page, embedding advice quotes contextually within individual record rows in the data table.

2. **Granular University Separation**:
   - Upgrade the School Convergence analytics to compute and rank individual canonical universities (e.g., UP Diliman, Ateneo de Manila, UST, DLSU Manila, PUP, UPLB, PLM, Mapua, FEU) that meet a sample threshold ($n \ge 15$).
   - Provide a searchable school selector for granular drill-downs alongside sample count indicators.

3. **Visual Negotiation Lift & Dataset Deep-Dives**:
   - Replace static negotiation metrics with a direct distribution chart comparing negotiated vs. non-negotiated compensation (P25, Median, P75) with sample count callouts ($n=427$ vs. $n=2,515$).
   - Provide dedicated visualization in `/compare` showing the distribution overlap at Entry Level between Liyab and phcareers, highlighting variance and survey origins.

## User Stories

1. As a regular job seeker, I want plain-language labels like "Experience Level" and "Take-Home After Taxes" instead of technical jargon, so that I can understand the data without an economics degree.
2. As a first-time visitor, I want clear icons alongside filter inputs, navigation items, and benchmark cards, so that I can visually scan and navigate the app quickly.
3. As an everyday user, I want a top navigation bar linking to "Overview", "Dataset Comparison", and "Raw Records", so that I can switch between high-level insights and granular data without feeling lost in deep tabs.
4. As a researcher or skeptical applicant, I want to access a dedicated `/table` page, so that I can view the actual raw salary entries behind the aggregated charts.
5. As an applicant exploring raw data, I want to search records by keyword (e.g., job title or company type), so that I can find compensation for my exact target position.
6. As a job seeker, I want to sort the data table by columns like salary, year of graduation, or years of experience, so that I can rank the highest and lowest paying opportunities.
7. As a job seeker, I want to paginate through raw records in chunks of 25, 50, or 100, so that the table renders quickly without freezing my browser.
8. As a community analyst, I want to export filtered salary records to a CSV file, so that I can perform custom analysis in Excel or Google Sheets.
9. As a candidate reviewing a specific table row, I want to expand the row to view the full benefits breakdown and mentor advice quote, so that qualitative context is attached directly to the numbers.
10. As an entry-level applicant, I want to visit `/compare` to see how Liyab's first-pay data compares with r/phcareers entry-level reports, so that I can understand baseline compensation discrepancies between different communities.
11. As an experienced professional, I want to see a chart showing that r/phcareers covers mid to senior bands while Liyab is exclusively entry-level, so that I understand why seniority filters reflect specific cohorts.
12. As a job seeker preparing to negotiate, I want to see a side-by-side distribution chart comparing negotiated offers vs. non-negotiated offers (P25, Median, P75), so that I have concrete proof of the financial upside of negotiating.
13. As a graduate of PUP or PLM, I want to see my specific university listed separately rather than lumped into a generic "State University" bucket, so that I can gauge the true market value of my degree.
14. As a graduate of UP Diliman or Ateneo, I want to see specific university benchmarks with sample sizes displayed, so that I can evaluate the statistical confidence of the data.
15. As a candidate from a provincial or smaller college, I want a searchable university dropdown, so that I can look up my school even if it is not in the top 15 list.
16. As an everyday user, I want the quotes tab removed from the main dashboard tabs, so that the main overview page remains focused, clean, and fast.
17. As a remote contractor, I want the "Remote vs Local Calculator" to clearly explain statutory deductions and taxes in simple steps, so that I can understand my real take-home pay.
18. As a candidate evaluating an offer, I want the AI Offer Evaluator tab to have clear action prompts and security disclaimers, so that I know my API key is safe in my browser.

## Implementation Decisions

### 1. Routing & Information Architecture

- Implement shared top header navigation in a reusable component `components/navigation-header.tsx`:
  - Active route highlighting using `next/navigation` (`usePathname()`).
  - Links:
    - `/` $\rightarrow$ **Overview** (Core dashboards, filters, compensation curves, remote vs local calculator, school benchmarks, AI offer auditor).
    - `/compare` $\rightarrow$ **Dataset Comparison** (Liyab vs. phcareers comparative analysis, experience band coverage, entry-level parity).
    - `/table` $\rightarrow$ **Raw Records** (Searchable, sortable, paginated data grid with CSV export and expandable advice rows).
- Remove `MentorQuotesFeed` from the main tab strip in `app/page.tsx`.

### 2. Plain-Language Jargon Replacement

Update all user-facing labels and terminology across filters, cards, and tabs:

| Previous Jargon | New Human-Friendly Label | Icon (Tabler / Lucide) |
|---|---|---|
| Macro Industry | Industry | `IconBuilding` |
| Seniority Band | Experience Level | `IconBriefcase` |
| Work Scope | Employment Location | `IconMapPin` |
| School Tier Group | University / College | `IconSchool` |
| Take-Home Parity | Take-Home After Taxes | `IconReceipt2` |
| 2026 PSA CPI Rebased | Adjusted for 2026 Inflation (PSA CPI) | `IconTrendingUp` |
| Net Arbitrage Simulator | Remote vs Local Calculator | `IconScale` |
| BYOK Offer Auditor | AI Offer Evaluator | `IconSparkles` |
| Compensation Curves | Salary Ranges & Negotiation | `IconChartBar` |
| Schools & Benefits | University & Perks Breakdown | `IconSchool` |

### 3. Granular University Analytics

- File: `lib/analytics.ts`
- Enhance `queryDashboardSlice` or introduce `getGranularSchoolAnalytics`:
  ```ts
  export interface GranularSchoolStat {
    canonicalName: string
    tierGroup: SchoolTierGroup
    sampleCount: number
    nominalMedian: number
    cpiMedian: number
    p25: number
    p75: number
  }
  ```
- Logic:
  - Aggregate records by `record.schoolCanonical`.
  - Filter for schools with `sampleCount >= 15` (e.g., UP Diliman, Ateneo de Manila, UST, DLSU Manila, PUP, UPLB, PLM, Mapua, FEU, DLS-CSB, UP Manila, UE).
  - Sort by median compensation descending.
  - Provide a fallback "Other Recognized Schools" category or searchable selector.

### 4. Negotiation Lift Distribution Visualization

- File: `components/negotiation-lift.tsx` and `lib/chart-adapters.ts`
- Upgrade from a single scalar tile to an interactive comparison chart:
  - Compares `Negotiated (n=427)` vs. `Not Negotiated (n=2,515)`:
    - 25th Percentile (P25)
    - Median (P50)
    - 75th Percentile (P75)
  - Displays nominal PHP difference and percentage uplift (+18.2% median uplift).
  - Explicit disclaimer explaining that negotiation data is sourced from the Liyab First Pay cohort.

### 5. Dataset Comparison Page (`/compare`)

- File: `app/compare/page.tsx`
- Slices the data into two cohorts:
  - `LIYAB_FIRST_PAY` (2,942 records): Entry-level first salaries (2018–2024).
  - `CAREER_PATH_INFO` (1,068 records): r/phcareers salary sharing across 0 to 10+ YoE.
- Visualizations:
  1. **Entry-Level Head-to-Head**:
     - Compares entry-level salaries in Liyab vs. phcareers for common roles (Software Engineering, Data, Marketing, Finance).
     - Median, P25, P75 bar charts with sample sizes.
  2. **Experience Coverage Matrix**:
     - Stacked or grouped bar chart displaying sample distribution across experience bands (`ENTRY_0`, `JUNIOR_1_2`, `MID_3_5`, `SENIOR_6_9`, `STAFF_LEAD_10_PLUS`).
     - Clarifies that phcareers provides progressive career benchmarks, while Liyab provides large-sample entry-level statistical certainty.

### 6. Raw Data Table Page (`/table`)

- File: `app/table/page.tsx`
- Features:
  - Client-side filtering synchronized with search query, industry, experience level, and school.
  - Sorting on key columns: Job Title, Industry, Experience, Gross Monthly Pay, School, Year.
  - Pagination controls: 25 / 50 / 100 rows per page with page index indicators.
  - Row Expansion: Clicking a row expands an accordion detailing:
    - Full benefits breakdown (guaranteed months, allowances, HMO, leave days).
    - Mentor Advice Quote (if present).
    - Source survey badge (`Liyab First Pay` or `r/phcareers`).
  - Export to CSV button generating clean, RFC-4180 compliant CSV downloads of the currently filtered slice.

## Testing Decisions

### What Makes a Good Test

Tests must verify external observable behavior and domain invariants rather than transient React DOM structure or internal component state:
1. Mathematical invariants must hold (P25 $\le$ Median $\le$ P75).
2. Slicing and aggregation logic must accurately partition records by source sheet, negotiation status, and canonical school name.
3. Pagination, search matching, and sorting must yield deterministic results.
4. Export transformations must escape commas, quotes, and newlines correctly without data corruption.

### Single High-Level Test Seam

All tests exercise the **Analytical Query & Transformation Seam** in `lib/analytics.ts` and `lib/chart-adapters.ts`. This acts as the single boundary between raw static JSON records and presentation components.

### Test Additions (`tests/granular-analytics.test.ts` & `tests/chart-adapters.test.ts`)

- Test 1: `queryGranularSchoolStats`:
  - Verifies schools are grouped by canonical name.
  - Verifies minimum sample count threshold filter ($n \ge 15$).
  - Verifies sorting by median descending.
- Test 2: `queryDatasetComparison`:
  - Verifies entry-level separation between `LIYAB_FIRST_PAY` and `CAREER_PATH_INFO`.
  - Verifies experience band distribution counts match canonical totals (Liyab = 2,942 Entry; phcareers = 1,068 across 5 bands).
- Test 3: `queryNegotiationComparison`:
  - Verifies statistical breakdown for `negotiatedOffer === true` vs. `false`.
  - Verifies records with `negotiatedOffer === null` (phcareers) are safely excluded from the negotiation lift computation.
- Test 4: `tableFilterAndSort`:
  - Verifies multi-field search against `rawTitle`, `schoolCanonical`, and `roleFamily`.
  - Verifies sorting by numerical salary and string columns ascending/descending.
  - Verifies pagination boundaries (slice offset/limit).
- Test 5: `formatRecordsToCsv`:
  - Verifies CSV headers match schema.
  - Verifies proper string escaping for mentor quotes containing commas or line breaks.

### Prior Art

Existing test files in `tests/`:
- `tests/seams.test.ts`: Tests ETL parsing, statutory economics, CPI multipliers, and dashboard slicing.
- `tests/chart-adapters.test.ts`: Tests chart data shape adapters for Recharts.
- `tests/zod-schemas.test.ts`: Tests Zod validation boundaries for CareerRecord and FilterState.

## Out of Scope

- User authentication, login sessions, or user accounts.
- Cloud database backends or remote SQL queries (all data is statically hosted in `/public/data/records.json`).
- Direct crowdsourced submission forms (ETL ingestion remains offline via CSV processing scripts).
- WebGL or 3D graph visualizers.
- Server-side rendering (SSR) of charts (recharts runs strictly in client-side components).

## Further Notes

- The raw dataset consists of 4,010 records (2,942 from Liyab and 1,068 from r/phcareers).
- Keeping all client-side processing in memory using Web APIs guarantees zero network latency after initial static JSON fetch (~1.2MB uncompressed, ~280KB gzipped).
- All changes maintain 100% compatibility with existing PSA CPI rebasing (2026 CPI factor 134.5) and TRAIN tax computation engines.
