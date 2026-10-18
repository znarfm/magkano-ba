# Filipino Career & Compensation Intelligence Dashboard Spec

## Problem Statement

Filipino job seekers—both first-time graduates entering the workforce and experienced professionals evaluating career progression or foreign remote arbitrage—lack normalized, transparent compensation and career trajectory benchmarks. Publicly available crowd-sourced spreadsheets (such as the Liyab First Pay Survey and the Work/Career Path Information Sheet) contain over 3,500 combined rows of high-signal salary, benefits, school, and mentorship data, but are practically unusable for analytical decision-making due to:

1. Unstructured free-text industries, roles, and combined occupation strings.
2. Unparsed text salaries (`"100k - 150k"`, `"Gross: 15000"`, `"Good"`).
3. Severe temporal inflation distortion across entries spanning 2005 to 2021+ without Philippine Consumer Price Index (CPI) normalization to 2026 PHP purchasing power.
4. Untracked work-scope distinctions between PH Local employment, Foreign Remote/Direct contracts, and Overseas (OFW/Expat) roles, alongside the tax and statutory benefit trade-offs (graduated TRAIN tax + 13th month + HMO vs. 8% flat freelance tax).

## Solution

A zero-backend, static-compiled Next.js analytical web dashboard that unifies and normalizes historical Filipino compensation and career path datasets into a 2-tier canonical taxonomy (~12 macro Industries mapped to ~50 Role Families and Seniority Bands).

Users can instantaneously filter and compare compensation curves across Years of Experience (YOE), toggle between Nominal PHP and 2026 PSA CPI-Adjusted PHP, switch between Gross Monthly Base and Annualized Net Take-Home (accounting for PH TRAIN vs. 8% contractor tax and statutory benefits), inspect fresh graduate negotiation lift and alma mater convergence, read matched insider career advice, and optionally supply a client-side Gemini API key (BYOK) for deterministic, dataset-grounded offer and career path auditing.

## User Stories

1. As a first-time Filipino job seeker, I want to filter starting salaries by macro industry and canonical role family, so that I know the P25, Median, and P75 entry-level floor before accepting a job offer.
2. As a first-time job seeker, I want to compare starting pay distributions between candidates who negotiated their first offer versus those who did not, so that I can quantify the expected monetary lift of negotiating.
3. As a user viewing historical salary records from 2005–2021, I want to toggle between Nominal PHP and 2026 Inflation-Adjusted PHP (via PSA CPI multipliers), so that older compensation figures reflect current purchasing power.
4. As an experienced professional, I want to view P25, Median, and P75 salary progression curves across Years of Experience (0 YOE, 1–2 YOE, 3–5 YOE, 6–9 YOE, 10+ YOE), so that I can benchmark whether my compensation growth is stagnating.
5. As a Filipino worker comparing local corporate employment against foreign remote contracting, I want to toggle between Monthly Gross Base and Estimated Monthly Net + Annualized Benefits, so that I can compare true take-home parity after TRAIN graduated tax + SSS/PhilHealth/Pag-IBIG + 13th-month pay + HMO versus the 8% flat gross receipts tax.
6. As a user evaluating international opportunities, I want PH-Based roles (`PH_LOCAL` and `FOREIGN_REMOTE`) isolated from `OVERSEAS_OFW` roles by default with an explicit scope switcher, so that high-cost-of-living overseas salaries do not distort local purchasing power percentiles.
7. As a student or career shifter, I want to compare entry-level compensation across normalized university cohorts and observe how those gaps narrow across YOE bands, so that I can see how work experience outweighs alma mater over time.
8. As a professional evaluating non-cash compensation, I want to view a structured breakdown of typical monthly allowances, guaranteed bonus months (13th to 16th month), leave credits, and HMO coverage by industry, so that I can evaluate total compensation packages holistically.
9. As a job seeker looking for qualitative guidance, I want to search and filter long-form mentor quotes and career stories by industry, role family, YOE, and keyword, so that I can learn from real career pivots and workplace warnings.
10. As a user with a specific job offer or career dilemma, I want to enter my own Gemini API key (stored strictly in browser `localStorage`) and submit my offer/profile parameters, so that I receive an AI audit grounded strictly in the dashboard's computed percentiles and matched mentor quotes without hallucinated benchmarks.
11. As a privacy-conscious user using the BYOK Gemini auditor, I want a one-click option to clear my stored API key from `localStorage` and verify that keys never touch a backend server, so that my credentials remain completely under my control.
12. As a user inspecting a low-sample role or filter combination (fewer than 5 matching records), I want to see a clear low-confidence warning badge alongside individual anonymized data points rather than misleading percentile curves, so that I do not make decisions on statistically insignificant slices.

## Implementation Decisions

### 1. System Architecture & Data Engine

* **Framework:** Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui).
* **Execution Model:** 100% static/client-side analytical engine for v1. No database hosting or live community submission endpoints.
* **Data Artifact:** An offline build-time ETL pipeline ingests the raw CSV exports of both Google Sheets, normalizes records into a strict schema, and outputs a pre-compiled static dataset (`public/data/records.json` + pre-computed taxonomy/CPI lookup tables).
* **Client Query Layer:** Pure TypeScript in-memory typed filter and percentile aggregator (with `useMemo` / Web Worker offloading if filtered slices exceed 5,000 rows) delivering sub-10ms reactive updates.

### 2. Canonical Data Schema & TypeScript Contracts

```typescript
export type WorkScope = 'PH_LOCAL' | 'FOREIGN_REMOTE' | 'LIKELY_REMOTE_INTL' | 'OVERSEAS_OFW';

export type SeniorityBand = 'ENTRY_0' | 'JUNIOR_1_2' | 'MID_3_5' | 'SENIOR_6_9' | 'STAFF_LEAD_10_PLUS';

export type MacroIndustry =
  | 'TECH_IT'
  | 'FINANCE_BANKING'
  | 'FMCG_RETAIL'
  | 'BPO_SHARED_SERVICES'
  | 'ENGINEERING_CONSTRUCTION'
  | 'MEDIA_ADVERTISING'
  | 'GOVERNMENT_PUBLIC_SECTOR'
  | 'EDUCATION_ACADEME'
  | 'HEALTHCARE_PHARMA'
  | 'CONSULTING_MARKET_RESEARCH'
  | 'MANUFACTURING_LOGISTICS'
  | 'OTHER';

export interface BenefitBreakdown {
  guaranteedMonths: number; // Default 13 for PH_LOCAL, 12 for FOREIGN_REMOTE unless specified
  monthlyAllowancePhp: number;
  hmoCoveragePhp: number | null;
  vacationLeaveDays: number | null;
  rawBenefitsSummary: string | null;
}

export interface CareerRecord {
  id: string;
  sourceSheet: 'LIYAB_FIRST_PAY' | 'CAREER_PATH_INFO';
  cohortYear: number; // Start year (Sheet 1) or derived submission/start year (Sheet 2)
  macroIndustry: MacroIndustry;
  roleFamily: string; // ~50 canonical role families (e.g., "Software Engineering", "Brand & Marketing")
  rawTitle: string;
  yoeYears: number; // 0 for all Sheet 1 rows; parsed numeric YOE for Sheet 2
  seniorityBand: SeniorityBand;
  workScope: WorkScope;
  nominalMonthlyGrossPhp: {
    min: number;
    median: number; // Point estimate (equal to min/max if single number reported)
    max: number;
  };
  negotiatedOffer: boolean | null; // Populated from Sheet 1; null for Sheet 2
  schoolCanonical: string | null; // e.g., "UP Diliman", "DLSU", "ADMU", "PUP", "UST", "SLU"
  schoolTierGroup: 'UP_SYSTEM' | 'ADMU_DLSU_UST' | 'STATE_UNIV_POLYTECHNIC' | 'PRIVATE_METRO' | 'PROVINCIAL_UNIV' | 'UNKNOWN';
  gender: 'FEMALE' | 'MALE' | 'NON_BINARY_OTHER' | 'UNDISCLOSED';
  benefits: BenefitBreakdown;
  mentorAdviceQuote: string | null; // Populated from Sheet 2
}

```

### 3. Offline ETL Pipeline (`scripts/etl/`)

* **Ingestion:** Reads raw CSV exports from Sheet 1 (`Liyab First Pay Survey`) and Sheet 2 (`Work/Career Path Information Sheet`).
* **Salary Parser & Sanitizer:**
* Strips currency symbols, commas, and labels (`"Gross: 15000"` -> `15000`).
* Expands `k` notation (`"100k - 150k"` -> `min: 100000, median: 125000, max: 150000`).
* Extracts upper bounds from narrative strings (`"Varies per month... around 70k"` -> `min: 70000, median: 70000, max: 70000`).
* Drops rows with non-numeric qualitative pay (`"Good"`, `"Secret"`, `"N/A"`) from quantitative percentile calculations while retaining them in the `MentorAdviceFeed` if `mentorAdviceQuote` is non-empty.
* Rejects corrupted/troll numbers below ₱3,000/month or above ₱2,000,000/month.


* **2-Tier Taxonomy Resolution:**
* Deterministic dictionary + LLM-assisted batch classification (cached to `scripts/etl/taxonomy-map.json` so builds are deterministic) maps free-text `Industry` + `Role` (Sheet 1) and composite `Occupation` (Sheet 2) to `(macroIndustry, roleFamily, rawTitle)`.


* **Work-Scope Heuristic Classifier:**
1. `OVERSEAS_OFW`: Matches explicit overseas location/currency markers (`SGD`, `AED`, `JPY`, `OFW`, `"based in Singapore"`, etc.).
2. `FOREIGN_REMOTE`: Matches explicit remote/offshore/freelance terms (`"remote"`, `"US client"`, `"Upwork"`, `"freelance"`, `"offshore"`, `USD`, `AUD`).
3. `LIKELY_REMOTE_INTL`: Flags PH-based entries without explicit remote keywords whose `nominalMonthlyGrossPhp.median` exceeds `3.0 * P75` of their `(macroIndustry, seniorityBand, cohortYear)` cohort (e.g., ₱350,000/mo entry-level DevOps in 2018).
4. `PH_LOCAL`: Default assignment for all remaining records.


* **University Normalization:** Regex + alias lookup maps variations (`"UP"`, `"UPD"`, `"University of the Philippines - Diliman"`, `"U.P. Diliman"`) into canonical school names and assigns `schoolTierGroup`.

### 4. Financial & Economic Math Engine (`src/lib/economics.ts`)

#### A. 2026 PSA CPI Inflation Adjustment

Historical nominal PHP salaries are scaled to 2026 purchasing power using Philippine Statistics Authority (PSA) Consumer Price Index annual averages:

$$\text{AdjustedSalary}_{2026} = \text{NominalSalary}_{y} \times \left(\frac{\text{CPI}_{2026}}{\text{CPI}_{y}}\right)$$

* `cohortYear` values prior to 2005 clamp to the 2005 CPI index; future or missing years fall back to `2020` (for Sheet 1) or `2018` (for Sheet 2) based on form timestamp.

#### B. Compensation Parity (Gross Monthly vs. Annualized Monthly Net Equivalent)

When the user switches from **Monthly Gross Base** to **Estimated Monthly Net + Annualized Benefits**, each record or simulator input is evaluated on a normalized 12-month equivalent take-home basis:

1. **PH Local Corporate (`PH_LOCAL`):**
* **Mandatory Statutory Contributions:** Computes 2026 employee share deductions for SSS (up to MSC ceiling), PhilHealth (5% premium split, employee share 2.5%), and Pag-IBIG (₱200/mo cap).
* **TRAIN Law Income Tax (2023–2026 Schedule):** Applies graduated annual tax brackets on annual taxable income:

$$\text{AnnualTaxable} = (12 \times (\text{MonthlyGross} - \text{MonthlyStatutory})) + \max(0, \text{BonusPay} - 90000)$$


* **Annualized Net Equivalent:**

$$\text{MonthlyNetEquivalent}_{\text{Local}} = \frac{(12 \times \text{MonthlyGross}) + \text{BonusPay} - (12 \times \text{MonthlyStatutory}) - \text{AnnualTRAINTax} + (12 \times \text{MonthlyAllowance}) + \text{HMOValuation}}{12}$$



*(Where default `BonusPay` = 1× `MonthlyGross` (13th month), and default `HMOValuation` = ₱2,000/mo equivalent if unspecified).*


2. **Foreign Remote / Independent Contractor (`FOREIGN_REMOTE` / `LIKELY_REMOTE_INTL`):**
* **8% Flat Gross Receipts Tax Option:** For annual gross receipts $\le$ ₱3,000,000 (the VAT threshold), computes tax as:

$$\text{AnnualTax}_{8\%} = \max\left(0, (\text{AnnualGross} - 250000) \times 0.08\right)$$


* **Voluntary Self-Employed Statutory Contributions:** Deducts optional/configurable self-employed SSS + PhilHealth + Pag-IBIG allocation.
* **Annualized Net Equivalent:**

$$\text{MonthlyNetEquivalent}_{\text{Remote}} = \frac{(12 \times \text{MonthlyGross}) - \text{AnnualTax}_{8\%} - \text{AnnualVoluntaryStatutory}}{12}$$





### 5. Core v1 UI Modules & Component Architecture

* **Global Filter & Control Bar:** Sticky header controlling `MacroIndustry`, `RoleFamily`, `WorkScope` inclusion (`PH_LOCAL` + `FOREIGN_REMOTE` default; opt-in toggle for `LIKELY_REMOTE_INTL` and `OVERSEAS_OFW`), **CPI Toggle** (`2026 Inflation-Adjusted PHP` vs. `Nominal PHP`), and **Parity Toggle** (`Monthly Gross` vs. `Monthly Net Equivalent`).
* **Module 1: Role & Industry Percentile Explorer:** Visualizes P25, Median (P50), and P75 across Seniority/YOE bands (`ENTRY_0` through `STAFF_LEAD_10_PLUS`). Displays sample count ($n$) per bucket and switches to a scatter/dot plot when $n$ is less than 5.
* **Module 2: Fresh Grad Starting Floor & Negotiation Lift Analyzer:** Focuses on `ENTRY_0` records from Sheet 1. Renders side-by-side distribution boxplots and percentage lift metrics comparing `negotiatedOffer === true` vs. `negotiatedOffer === false` per industry and school tier.
* **Module 3: PH Local vs. Foreign Remote Net Arbitrage Simulator:** Interactive calculator where users input a target PH Local Gross offer (with 13th–16th month and HMO) and compute the exact **Break-Even Foreign Remote Monthly Rate** (and vice versa) under 2026 TRAIN vs. 8% tax rules.
* **Module 4: Total Comp & Benefits Matrix:** Aggregates Sheet 2 benefit structures by `MacroIndustry`, displaying median guaranteed months (13th–16th), typical rice/meal/de minimis allowances, vacation/sick leave averages, and HMO coverage ceilings.
* **Module 5: University Starting Pay & YOE Convergence View:** Plots `schoolCanonical` and `schoolTierGroup` pay distributions at `ENTRY_0` alongside `MID_3_5` and `SENIOR_6_9` cohorts to visualize whether initial alma mater premiums converge with work experience.
* **Module 6: Searchable Mentor Advice & Career Stories Feed:** Full-text filterable card grid of Sheet 2 `mentorAdviceQuote` entries tagged with the mentor's canonical role, YOE, CPI-adjusted salary band, and school.
* **Module 7: BYOK Gemini Grounded Offer & Path Auditor (`src/components/auditor/`):**
* **Key Storage:** Reads/writes user's Gemini API key exclusively in `window.localStorage` (`ph_career_gemini_key`). Calls Gemini API directly from the browser via `@google/generative-ai` (or `fetch` to `generativelanguage.googleapis.com`).
* **Deterministic Grounding Payload:** When the user submits their profile (Role, YOE, Offer/Current Pay, Work Scope, School), the client serializes:
1. Exact computed P25/P50/P75 numbers for their matching `(macroIndustry, roleFamily, seniorityBand)` in 2026 CPI-adjusted PHP.
2. Exact net take-home comparison between PH Local and Foreign Remote at their pay level.
3. Top 5 BM25/keyword-matched `mentorAdviceQuote` records from the static dataset.


* **System Prompt Contract:** Instructs Gemini to act as a pragmatic Filipino career advisor that *must only cite the injected dataset percentiles, tax computations, and mentor quotes*, prohibiting fabricated salary figures.



## Testing Decisions

### Definition of a Good Test

Tests must verify observable external behavior across public module boundaries—given a raw dataset row or filter state, assert the exact normalized output, percentile value, tax net figure, or rendered UI state. Never test private helper internals or implementation details.

### Identified Test Seams

1. **Seam 1: Offline ETL Normalization Boundary (`parseAndNormalizeRecord(rawRow, sourceSheet) -> CareerRecord | null`)**
* **Behavior Tested:** Feeds messy real-world spreadsheet strings (`"100k - 150k"`, `"Gross: 15000"`, `"Varies... around 70k"`, `"UP Diliman"` vs `"U.P. Diliman"`, `"350000"` entry-level DevOps) and asserts exact numeric `nominalMonthlyGrossPhp`, `workScope` classification (`LIKELY_REMOTE_INTL` outlier tagging), and canonical school/industry mapping.


2. **Seam 2: Economic & Tax Math Engine (`computeCompensationView(record, options) -> ComputedComp` & `calculateNetArbitrage(input) -> ArbitrageResult`)**
* **Behavior Tested:** Asserts exact 2026 CPI inflation scaling across cohort years, exact 2026 TRAIN Law bracket tax deductions (including the ₱90,000 tax-exempt 13th-month/bonus ceiling), 8% flat freelance tax calculations above the ₱250,000 deduction, and accurate PH Local vs. Foreign Remote break-even parity numbers.


3. **Seam 3: Client Analytical Query & Percentile Engine (`queryDashboardSlice(records, filterState) -> DashboardAnalytics`)**
* **Behavior Tested:** Verifies P25/P50/P75 interpolation accuracy, `negotiatedOffer` lift calculation, low-sample flagging when matching records fall below $n = 5$, and default exclusion of `OVERSEAS_OFW` from PH-based percentile curves.


4. **Seam 4: Grounded BYOK Prompt Builder (`buildGroundedAuditPrompt(userProfile, analyticsSlice) -> PromptPayload`)**
* **Behavior Tested:** Verifies that the prompt payload injected into the client-side Gemini request contains the exact deterministic P25/P50/P75 numbers and matched mentor quotes from the active filter slice.



## Out of Scope

* **Live Crowd-Sourced Submissions & Backend Database:** No user submission forms, Supabase/PostgreSQL instances, OAuth login flows, or outlier quarantine queues in v1.
* **Server-Side AI Proxy or Hosted LLM Keys:** The application will not host or proxy LLM API calls on a backend server; AI auditing works strictly via client-side BYOK.
* **Live Google Sheets Sync:** The app will not poll the Google Sheets API at runtime; updates to source spreadsheets require re-running the offline ETL build script.
* **Granular Overseas City-by-City PPP Tax Calculators:** While `OVERSEAS_OFW` rows can be viewed in an isolated filter, v1 will not maintain foreign tax tables (e.g., IRAS Singapore, ATO Australia).

## Further Notes

* **PSA CPI Reference Table Maintenance:** Store the annual PSA CPI index table (2005–2026) in a single versioned configuration constant (`src/config/psa-cpi.ts`) so future annual updates require editing a single line.
* **Dataset Attribution:** Include a footer crediting the original crowd-sourced creators of the *Liyab First Pay Survey* and *Work/Career Path Information Sheet* alongside a methodology modal explaining the 2026 CPI adjustment, 3× IQR outlier tagging, and TRAIN vs. 8% tax assumptions.
