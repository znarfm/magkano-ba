# Zod Runtime Schema Validation & Single-Source Type System Spec

## Problem Statement

The Magkano Ba platform currently defines its core domain contracts (`CareerRecord`, `WorkScope`, `SeniorityBand`, `MacroIndustry`, `SchoolTierGroup`, `BenefitBreakdown`, `FilterState`, and `AuditProfile`) purely as static TypeScript interfaces in `lib/types.ts`. Because TypeScript types are completely erased at compile time:

1. **Unenforced ETL Ingestion Boundary:** The offline ETL pipeline sanitizes strings and constructs JavaScript objects, but cannot guarantee at runtime that every emitted record strictly adheres to required field types, valid enum values, and numeric sanity constraints before serializing into `public/data/records.json`.
2. **Unvalidated Client-Side JSON Hydration:** In `app/page.tsx`, the client blindly casts the result of `res.json()` to `CareerRecord[]`. If the static JSON is corrupted, truncated, or has breaking schema mutations, the application crashes silently or renders `NaN`/`undefined` in charts without a helpful error boundary.
3. **Unvalidated BYOK Auditor Inputs:** User-submitted values in the Gemini Auditor (role name, YOE, offered salary, work scope, university) are passed directly into prompt builders without runtime schema validation, risking prompt injection, negative salaries, or absurd YOE numbers (e.g. negative or > 70 years).
4. **Duplication of Domain Truth:** Valid enum values (such as the 12 macro industries and 4 work scopes) are defined as union types in `lib/types.ts` and then duplicated as runtime arrays in UI select components, creating maintenance drift.

## Solution

Refactor the platform's domain contract layer to use **Zod** as the single source of truth for all domain entities. All TypeScript types will be inferred directly from Zod schemas via `z.infer<typeof ...>`. 

Zod schemas will be enforced at three runtime boundaries:
1. **ETL Ingestion Seam (`scripts/etl/index.ts`):** Validate every normalized candidate record with `CareerRecordSchema.safeParse()`. If a record fails validation, it is rejected and logged rather than corrupting `records.json`.
2. **Client Hydration Seam (`app/page.tsx`):** Safely validate the fetched static JSON with `z.array(CareerRecordSchema).safeParse()`, displaying a graceful recovery message if corruption is detected.
3. **Auditor & Simulator Input Seams (`lib/auditor.ts`, `components/auditor/offer-auditor.tsx`):** Validate user profile inputs with `AuditProfileSchema.safeParse()` prior to executing prompt compilation and API calls.

## User Stories

1. As a data engineer running `bun run etl`, I want the pipeline to validate every record against `CareerRecordSchema`, so that corrupt rows with missing IDs, negative salaries, or invalid macro industries never enter `public/data/records.json`.
2. As a data engineer running the ETL, I want invalid rows to be rejected with detailed Zod error paths and reasons logged to stdout, so that I can immediately debug upstream spreadsheet format changes.
3. As a dashboard user loading the application, I want the client to safely validate the static JSON payload upon fetch, so that broken or incomplete network responses don't cause unhandled runtime exceptions.
4. As a user with a slow or interrupted connection, I want to see a clear error banner if `records.json` fails schema validation, so that I understand why charts aren't rendering.
5. As a job seeker using the BYOK Gemini Offer Auditor, I want my submitted role, YOE, and salary validated by `AuditProfileSchema` before sending, so that invalid inputs (like negative YOE or empty role strings) are caught with clear validation messages.
6. As a job seeker submitting an offer, I want the monthly offer salary to be validated within realistic boundaries (₱3,000 to ₱5,000,000), so that the auditor does not process nonsensical or malicious numbers.
7. As a job seeker submitting an experience level, I want YOE validated between 0 and 60, so that extreme negative or centenary inputs are rejected.
8. As a user interacting with the Net Arbitrage Simulator, I want slider and input parameters validated against `ArbitrageInputSchema`, so that computations never receive `NaN` or `undefined`.
9. As a developer modifying domain types, I want TypeScript types inferred directly from Zod schemas (`export type CareerRecord = z.infer<typeof CareerRecordSchema>`), so that I only maintain a single source of truth.
10. As a developer building filter dropdowns, I want Zod enum options exported directly (e.g. `MacroIndustryEnum.options`), so that UI options and validation rules never go out of sync.
11. As a developer inspecting validation errors, I want readable error formatting (via `z.ZodError.format()` or structured issues), so that debugging failed payloads is fast and descriptive.
12. As an open-source contributor, I want automated unit tests in `tests/zod-schemas.test.ts` asserting that valid records pass and specific invalid mutations (wrong enum, out-of-range salary, null ID) fail as expected.
13. As a privacy-conscious user, I want the Gemini API key string validated (non-empty string starting with standard key patterns) before storage in `localStorage`, so that accidental blank submissions are blocked.
14. As an analyst evaluating compensation metrics, I want the `nominalMonthlyGrossPhp` object validated to ensure `min <= median <= max`, guaranteeing internal mathematical consistency for every single record.
15. As a user viewing benefits, I want `BenefitBreakdownSchema` to ensure guaranteed bonus months fall within 12 to 24 months and allowances are non-negative, preventing corrupted bonus metrics.

## Implementation Decisions

### 1. Schema Architecture (`lib/types.ts`)

Replace manual TypeScript types with Zod schemas and inferred types:

```typescript
import { z } from 'zod';

// Primitive Enums
export const WorkScopeSchema = z.enum([
  'PH_LOCAL',
  'FOREIGN_REMOTE',
  'LIKELY_REMOTE_INTL',
  'OVERSEAS_OFW',
]);
export type WorkScope = z.infer<typeof WorkScopeSchema>;

export const SeniorityBandSchema = z.enum([
  'ENTRY_0',
  'JUNIOR_1_2',
  'MID_3_5',
  'SENIOR_6_9',
  'STAFF_LEAD_10_PLUS',
]);
export type SeniorityBand = z.infer<typeof SeniorityBandSchema>;

export const MacroIndustrySchema = z.enum([
  'TECH_IT',
  'FINANCE_BANKING',
  'FMCG_RETAIL',
  'BPO_SHARED_SERVICES',
  'ENGINEERING_CONSTRUCTION',
  'MEDIA_ADVERTISING',
  'GOVERNMENT_PUBLIC_SECTOR',
  'EDUCATION_ACADEME',
  'HEALTHCARE_PHARMA',
  'CONSULTING_MARKET_RESEARCH',
  'MANUFACTURING_LOGISTICS',
  'OTHER',
]);
export type MacroIndustry = z.infer<typeof MacroIndustrySchema>;

export const SchoolTierGroupSchema = z.enum([
  'UP_SYSTEM',
  'ADMU_DLSU_UST',
  'STATE_UNIV_POLYTECHNIC',
  'PRIVATE_METRO',
  'PROVINCIAL_UNIV',
  'UNKNOWN',
]);
export type SchoolTierGroup = z.infer<typeof SchoolTierGroupSchema>;

export const GenderSchema = z.enum([
  'FEMALE',
  'MALE',
  'NON_BINARY_OTHER',
  'UNDISCLOSED',
]);
export type Gender = z.infer<typeof GenderSchema>;

// Benefits Breakdown Schema
export const BenefitBreakdownSchema = z.object({
  guaranteedMonths: z.number().min(12).max(24).default(13),
  monthlyAllowancePhp: z.number().min(0).default(0),
  hmoCoveragePhp: z.number().min(0).nullable(),
  vacationLeaveDays: z.number().min(0).max(90).nullable(),
  rawBenefitsSummary: z.string().nullable(),
});
export type BenefitBreakdown = z.infer<typeof BenefitBreakdownSchema>;

// Nominal Monthly Gross Schema (with mathematical invariant min <= median <= max)
export const SalaryRangeSchema = z
  .object({
    min: z.number().min(0),
    median: z.number().min(0),
    max: z.number().min(0),
  })
  .refine((data) => data.min <= data.median && data.median <= data.max, {
    message: 'min must be <= median and median must be <= max',
  });

// Core Career Record Schema
export const CareerRecordSchema = z.object({
  id: z.string().min(1),
  sourceSheet: z.enum(['LIYAB_FIRST_PAY', 'CAREER_PATH_INFO']),
  cohortYear: z.number().int().min(1990).max(2030),
  macroIndustry: MacroIndustrySchema,
  roleFamily: z.string().min(1),
  rawTitle: z.string().min(1),
  yoeYears: z.number().min(0).max(60),
  seniorityBand: SeniorityBandSchema,
  workScope: WorkScopeSchema,
  nominalMonthlyGrossPhp: SalaryRangeSchema,
  negotiatedOffer: z.boolean().nullable(),
  schoolCanonical: z.string().nullable(),
  schoolTierGroup: SchoolTierGroupSchema,
  gender: GenderSchema,
  benefits: BenefitBreakdownSchema,
  mentorAdviceQuote: z.string().nullable(),
});
export type CareerRecord = z.infer<typeof CareerRecordSchema>;

// Filter State Schema
export const FilterStateSchema = z.object({
  macroIndustry: z.union([MacroIndustrySchema, z.literal('ALL')]).default('ALL'),
  roleFamily: z.string().default('ALL'),
  seniorityBand: z.union([SeniorityBandSchema, z.literal('ALL')]).default('ALL'),
  workScopes: z.array(WorkScopeSchema).min(1),
  cpiAdjusted: z.boolean().default(true),
  takeHomeParity: z.boolean().default(false),
  schoolTier: z.union([SchoolTierGroupSchema, z.literal('ALL')]).default('ALL'),
  searchQuery: z.string().default(''),
});
export type FilterState = z.infer<typeof FilterStateSchema>;

// Auditor Input Schema
export const AuditProfileSchema = z.object({
  role: z.string().min(1, 'Target role is required'),
  yoe: z.number().min(0, 'YOE cannot be negative').max(60, 'YOE exceeds maximum realistic limit'),
  monthlyOfferPhp: z.number().min(3000, 'Monthly offer below statutory minimum').max(5000000, 'Monthly offer exceeds maximum ceiling'),
  workScope: WorkScopeSchema,
  school: z.string().default(''),
  macroIndustry: MacroIndustrySchema,
});
export type AuditProfile = z.infer<typeof AuditProfileSchema>;
```

### 2. ETL Ingestion Enforcement (`scripts/etl/index.ts`)
In `runETL()`, wrap every candidate record before pushing to `records`:
```typescript
const parsed = CareerRecordSchema.safeParse(candidate);
if (!parsed.success) {
  console.warn(`[ETL Warning] Dropping invalid record ${candidate.id}:`, parsed.error.format());
  continue;
}
records.push(parsed.data);
```

### 3. Client Hydration Enforcement (`app/page.tsx`)
In `useEffect`:
```typescript
fetch('/data/records.json')
  .then((res) => res.json())
  .then((raw) => {
    const parsed = z.array(CareerRecordSchema).safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid records schema: ${parsed.error.issues.length} validation errors.`);
    }
    setRecords(parsed.data);
    setLoading(false);
  })
  .catch((err) => {
    setError(err.message);
    setLoading(false);
  });
```

### 4. Auditor Profile Enforcement (`lib/auditor.ts`)
In `buildGroundedAuditPrompt()`:
```typescript
const validProfile = AuditProfileSchema.parse(profile);
```
Throws a clean, typed `ZodError` if parameters are invalid.

## Testing Decisions

### Definition of a Good Test
Tests must verify observable behavior at schema boundaries—asserting that conformant inputs parse without error and produce exact typed objects, while malformed inputs fail with precise Zod issue codes and paths. Never test internal Zod library mechanics.

### Seams Under Test
1. **Seam 1: `CareerRecordSchema` Boundary (`tests/zod-schemas.test.ts`)**
   - Assert valid full records parse cleanly.
   - Assert salary mathematical invariant (`min <= median <= max`) fails when `median < min` or `max < median`.
   - Assert invalid enum values (e.g. `workScope: 'INVALID'`) fail.
   - Assert out-of-range bounds (e.g. `cohortYear: 1980` or `yoe: -5`) fail.
2. **Seam 2: `AuditProfileSchema` Boundary (`tests/zod-schemas.test.ts`)**
   - Assert valid user profiles parse cleanly.
   - Assert negative salaries and empty roles fail with specific field-level error messages.
3. **Seam 3: `FilterStateSchema` Boundary (`tests/zod-schemas.test.ts`)**
   - Assert empty workScopes array fails (`min(1)`).
   - Assert valid defaults apply.
4. **Regression Seam:**
   - All 17 existing tests in `tests/seams.test.ts` and `tests/chart-adapters.test.ts` must continue to pass with zero regressions.

## Out of Scope

- Modifying underlying tax/economic mathematical formulas in `lib/economics.ts`.
- Replacing client-side in-memory filter algorithms.
- Server-side REST/GraphQL validation API endpoints (dashboard remains 100% static client-side).

## Further Notes

- Zod version in `package.json` is `^4.6.7` (or `^3.25.0`), both fully supporting `z.object`, `z.enum`, `z.infer`, `.safeParse()`, and `.refine()`.
- Exporting schema objects allows direct reuse for form validation libraries if form tooling is introduced later.
