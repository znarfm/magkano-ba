# Enhanced Visuals & Interactive Data UI Spec

## Problem Statement

The initial v1 Filipino Career Dashboard implementation established a rock-solid, verified analytical engine (ETL pipeline, PSA CPI inflation normalizer, 2026 TRAIN tax parity solver, and BYOK Gemini grounded auditor). However, its visual layer relies on raw HTML bars, native select inputs, and static tables. Users looking for high-signal career insights cannot:

1. Visually see compensation bands across YOE as an intuitive, continuous percentile curve (P25 floor, P50 median curve, and P75 upper band).
2. Readily interact with side-by-side distribution charts for fresh graduate negotiation lift and university cohort convergence.
3. Dynamically visualize tax deductions and benefit breakdown layers (TRAIN tax + statutory vs. 8% contractor flat tax) as an interactive stacked comparison.
4. Smoothly filter through 4,000+ records using modern, accessible UI primitives (shadcn Select, Slider, Tooltip, Tabs, Badge, and Card).
5. Seamlessly toggle between dashboard modules using tabbed perspectives (Executive Curves, Net Tax Arbitrage, Benefits Deep-Dive, Alma Mater Convergence, and AI Offer Audit).

## Solution

An enhanced visual presentation layer built entirely with the newly installed shadcn/ui component library (`card`, `badge`, `tabs`, `select`, `dialog`, `slider`, `separator`, `tooltip`, `chart`) and Recharts. 

All existing domain types (`CareerRecord`, `FilterState`), PSA CPI math (`lib/config/psa-cpi.ts`), economic calculations (`lib/economics.ts`), and static precompiled data (`public/data/records.json`) remain unchanged. The upgrade focuses on presentation-grade charts, smooth animations, fluid responsive layouts, and interactive slider controls.

## User Stories

1. As a job seeker, I want to view an interactive Recharts Area/Line curve showing the P25 floor, P50 median, and P75 ceiling across all 5 seniority bands (0 YOE through 10+ YOE), so that I can immediately see the trajectory of earnings over time.
2. As a user hovering over the compensation curve, I want a custom tooltip displaying the exact P25, Median, P75, and sample size ($n$) for that specific YOE band, so that I can inspect exact numbers without visual clutter.
3. As a first-time graduate, I want a grouped Bar Chart comparing starting pay distributions for candidates who negotiated versus those who did not, so that I can visually appreciate the monetary lift.
4. As a user viewing the negotiation lift chart, I want prominent shadcn `Badge` indicators showing the percentage lift and annual monetary extra (including 13th month), so that the takeaway is immediately obvious.
5. As an experienced professional exploring foreign remote contracting, I want an interactive shadcn `Slider` to dynamically adjust my target PH Local monthly gross pay and immediately watch the Break-Even Remote Gross and Net Take-Home numbers react in real-time.
6. As a user comparing local vs. remote employment, I want a stacked visual bar chart showing the composition of total compensation (Base Take-Home, Taxes Paid, Statutory Deductions, Guaranteed Bonus, and HMO/Allowance Valuation) for both local corporate and foreign contractor options.
7. As a student evaluating university outcomes, I want a horizontal Bar Chart comparing median starting pay across Philippine university cohorts (`UP_SYSTEM`, `ADMU_DLSU_UST`, `STATE_UNIV_POLYTECHNIC`, `PRIVATE_METRO`, `PROVINCIAL_UNIV`), so that I can compare institutions at a glance.
8. As a user comparing university cohorts across experience levels, I want to toggle between Entry Level (0 YOE) and Experienced (3+ YOE) within the school convergence module, so that I can observe firsthand how work experience narrows the alma mater gap.
9. As a professional evaluating total rewards, I want an interactive Recharts bar chart showing median guaranteed bonus months (13th through 16th month) and allowances across all 12 Macro Industries.
10. As a user navigating different analytical perspectives, I want top-level shadcn `Tabs` to toggle between "Compensation Curves", "Net Arbitrage Calculator", "Benefits & Total Comp", "University Insights", and "AI Offer Auditor", so that the dashboard is well-organized and not an endless scroll.
11. As a user filtering data, I want shadcn `Select` dropdowns for Macro Industry and Seniority Band with smooth dropdown animations and accessible keyboard navigation.
12. As a user adjusting work scopes, I want toggleable shadcn `Badge` buttons that visually highlight active scopes (`PH_LOCAL`, `FOREIGN_REMOTE`, `LIKELY_REMOTE_INTL`, `OVERSEAS_OFW`) with distinct status colors.
13. As a user inspecting low-sample queries ($n < 5$), I want an eye-catching warning badge with a tooltip advising caution due to small sample size.
14. As a dark mode user, I want all Recharts components and shadcn cards to dynamically adapt using CSS variables (`--color-chart-1` through `--color-chart-5`), ensuring high contrast and seamless theme transitions.
15. As a job seeker using the BYOK Gemini Offer Auditor, I want a visual comparison gauge/bar showing exactly where my offer lands relative to P25, P50, and P75 of my peer group.
16. As a privacy-conscious user, I want the Gemini API key input to use an accessible password field with a clear key button wrapped in a styled shadcn Card.
17. As a user reading peer stories, I want mentor quotes rendered inside shadcn Cards with quote icon indicators, tags for YOE and school, and full-text keyword highlighting.
18. As a user inspecting the methodology, I want the methodology explanation housed inside a shadcn `Dialog` with tabs explaining Data Ingestion, CPI Indexing, and Tax Modeling.

## Implementation Decisions

### 1. Architectural Strategy
* **Zero Engine Regression:** The underlying calculation engine (`lib/economics.ts`, `lib/analytics.ts`, `lib/config/psa-cpi.ts`) remains strictly intact. All existing unit tests in `tests/seams.test.ts` must continue to pass without modification.
* **Component Layering:** UI modules will import shadcn components from `@/components/ui/` and standard `@tabler/icons-react` icons.

### 2. Module Specifications

#### A. Global Filter Bar (`components/filter-bar.tsx`)
* Replace native `<select>` elements with shadcn `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`.
* Replace raw buttons with shadcn `Badge` variants for WorkScope toggles.
* Style the search input with a leading Tabler search icon (`IconSearch`).

#### B. Module 1: Recharts Percentile Curve (`components/percentile-explorer.tsx`)
* Utilize shadcn `ChartContainer` and `ChartTooltip` with a Recharts `ComposedChart`.
* Render a shaded `Area` between P25 and P75 representing the Interquartile Range (IQR).
* Render a prominent `Line` for Median (P50) progression across `ENTRY_0`, `JUNIOR_1_2`, `MID_3_5`, `SENIOR_6_9`, and `STAFF_LEAD_10_PLUS`.
* Show $n$ counts on X-axis ticks or in the hover tooltip.

```typescript
// Chart config binding to CSS chart variables
const chartConfig = {
  p50: {
    label: "Median (P50)",
    color: "var(--color-primary)",
  },
  iqr: {
    label: "P25 - P75 Spread",
    color: "var(--color-chart-2)",
  },
};
```

#### C. Module 2: Negotiation Lift Visualizer (`components/negotiation-lift.tsx`)
* Recharts `BarChart` comparing two vertical bars: "Negotiated Offer" vs "Accepted Initial Offer".
* Header badges displaying computed percentage lift and annual monetary difference.
* Shaded benchmark reference line marking the median entry floor.

#### D. Module 3: Net Arbitrage Simulator (`components/net-arbitrage.tsx`)
* Replace raw numeric inputs with shadcn `Slider` controls (range ₱15,000 to ₱300,000 in steps of ₱5,000) alongside formatted editable text.
* Recharts horizontal stacked `BarChart` breaking down:
  - Local PH: Net Take-Home + Tax Deducted + Statutory Deductions + Annualized Benefits.
  - Foreign Remote: Net Take-Home + 8% Flat Tax + Self-Employed Statutory.
* Clear visual indicator of the Break-Even monthly gross rate.

#### E. Module 4: Total Comp & Benefits Matrix (`components/benefits-matrix.tsx`)
* Recharts horizontal Bar Chart ranking Macro Industries by guaranteed bonus months (13th through 16th month) and median allowances.
* Detailed table view inside a collapsible or tabbed container for users wanting granular numbers.

#### F. Module 5: University Cohort Convergence (`components/school-convergence.tsx`)
* Recharts horizontal Bar Chart rendering median salaries across university tier groups (`UP_SYSTEM`, `ADMU_DLSU_UST`, `STATE_UNIV_POLYTECHNIC`, `PRIVATE_METRO`, `PROVINCIAL_UNIV`).
* Interactive toggle: "Entry Level (0 YOE)" vs "Experienced (3+ YOE)" to visualize convergence.

#### G. Module 6: Searchable Mentor Quotes Feed (`components/mentor-quotes.tsx`)
* Render quote cards using shadcn `Card`, `CardHeader`, `CardContent`, and `CardFooter`.
* Include Tabler icons (`IconQuote`, `IconSchool`, `IconBriefcase`, `IconCash`).
* Truncate long quotes with an accessible "Read more" toggle.

#### H. Module 7: BYOK Gemini Auditor (`components/auditor/offer-auditor.tsx`)
* Visual comparison bar placing the user's current offer against peer P25, P50, and P75 markers.
* Response rendered inside an editorial shadcn `Card` with formatted sections and badge status (e.g., "Top Quartile", "Competitive Market", "Below Floor Warning").

#### I. Methodology Modal (`components/methodology-modal.tsx`)
* Migrate from manual backdrop modal to shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, and `DialogTrigger`.
* Include structured tabs (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) for Data Sources, CPI Math, and Tax Engine.

## Testing Decisions

### Definition of a Good Test
Tests must verify observable external behavior at public boundaries. For the visual overhaul, tests will verify that:
1. Data adapters properly transform filtered `DashboardAnalytics` slices into valid Recharts data series.
2. Slider and Select interactions compute expected outputs without NaN or runaway values.
3. Dark and light theme CSS variable bindings remain consistent.
4. All 12 existing behavioral tests in `tests/seams.test.ts` continue to pass with 0 regressions.

### Modules Tested
* `tests/seams.test.ts`: Continue running the 12 core mathematical, ETL, and grounding seam tests.
* `tests/chart-adapters.test.ts`: New test file verifying data formatting for Recharts (e.g., handling zero counts, calculating IQR spans for AreaCharts, and computing stacked bar parity payloads).

## Out of Scope

* Replacement of Next.js or React 19 framework.
* Live server-side databases or third-party tracking scripts.
* Heavy 3D or WebGL canvas renderers (D3 / Three.js).
* Storing Gemini API keys anywhere outside browser `window.localStorage`.

## Further Notes

* **Responsiveness:** All Recharts visualizations will use `ResponsiveContainer` with responsive heights (min-h-[280px] to max-h-[380px]) so mobile and tablet screens render crisp, legible charts.
* **Palette:** Rely strictly on the configured Olive / Neutral palette variables defined in `app/globals.css`.
