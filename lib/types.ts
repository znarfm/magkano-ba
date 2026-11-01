import { z } from "zod"

// Primitive Domain Enums
export const WORK_SCOPES = [
  "PH_LOCAL",
  "FOREIGN_REMOTE",
  "LIKELY_REMOTE_INTL",
  "OVERSEAS_OFW",
] as const
export const WorkScopeSchema = z.enum(WORK_SCOPES)
export type WorkScope = z.infer<typeof WorkScopeSchema>

export const SENIORITY_BANDS = [
  "ENTRY_0",
  "JUNIOR_1_2",
  "MID_3_5",
  "SENIOR_6_9",
  "STAFF_LEAD_10_PLUS",
] as const
export const SeniorityBandSchema = z.enum(SENIORITY_BANDS)
export type SeniorityBand = z.infer<typeof SeniorityBandSchema>

export const MACRO_INDUSTRIES = [
  "TECH_IT",
  "FINANCE_BANKING",
  "FMCG_RETAIL",
  "BPO_SHARED_SERVICES",
  "ENGINEERING_CONSTRUCTION",
  "MEDIA_ADVERTISING",
  "GOVERNMENT_PUBLIC_SECTOR",
  "EDUCATION_ACADEME",
  "HEALTHCARE_PHARMA",
  "CONSULTING_MARKET_RESEARCH",
  "MANUFACTURING_LOGISTICS",
  "OTHER",
] as const
export const MacroIndustrySchema = z.enum(MACRO_INDUSTRIES)
export type MacroIndustry = z.infer<typeof MacroIndustrySchema>

export const SCHOOL_TIER_GROUPS = [
  "UP_SYSTEM",
  "ADMU_DLSU_UST",
  "STATE_UNIV_POLYTECHNIC",
  "PRIVATE_METRO",
  "PROVINCIAL_UNIV",
  "UNKNOWN",
] as const
export const SchoolTierGroupSchema = z.enum(SCHOOL_TIER_GROUPS)
export type SchoolTierGroup = z.infer<typeof SchoolTierGroupSchema>

export const GenderSchema = z.enum([
  "FEMALE",
  "MALE",
  "NON_BINARY_OTHER",
  "UNDISCLOSED",
])
export type Gender = z.infer<typeof GenderSchema>

// Benefit Breakdown Schema
export const BenefitBreakdownSchema = z.object({
  guaranteedMonths: z.number().min(12).max(24).default(13),
  monthlyAllowancePhp: z.number().min(0).default(0),
  hmoCoveragePhp: z.number().min(0).nullable(),
  vacationLeaveDays: z.number().min(0).max(90).nullable(),
  rawBenefitsSummary: z.string().nullable(),
})
export type BenefitBreakdown = z.infer<typeof BenefitBreakdownSchema>

// Salary Range with mathematical invariant: min <= median <= max
export const SalaryRangeSchema = z
  .object({
    min: z.number().min(0),
    median: z.number().min(0),
    max: z.number().min(0),
  })
  .refine((data) => data.min <= data.median && data.median <= data.max, {
    message: "min must be <= median and median must be <= max",
  })
export type SalaryRange = z.infer<typeof SalaryRangeSchema>

// Canonical Career Record Schema
export const CareerRecordSchema = z.object({
  id: z.string().min(1),
  sourceSheet: z.enum(["LIYAB_FIRST_PAY", "CAREER_PATH_INFO"]),
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
})
export type CareerRecord = z.infer<typeof CareerRecordSchema>

// Filter State Schema with sensible defaults
export const FilterStateSchema = z.object({
  macroIndustry: z
    .union([MacroIndustrySchema, z.literal("ALL")])
    .default("ALL"),
  roleFamily: z.string().default("ALL"),
  seniorityBand: z
    .union([SeniorityBandSchema, z.literal("ALL")])
    .default("ALL"),
  workScopes: z.array(WorkScopeSchema).min(1),
  cpiAdjusted: z.boolean().default(true),
  takeHomeParity: z.boolean().default(false),
  schoolTier: z.union([SchoolTierGroupSchema, z.literal("ALL")]).default("ALL"),
  searchQuery: z.string().default(""),
})
export type FilterState = z.infer<typeof FilterStateSchema>

// Auditor Input Profile Schema
export const AuditProfileSchema = z.object({
  role: z.string().min(1, "Target role is required"),
  yoe: z
    .number()
    .min(0, "Years of experience cannot be negative")
    .max(60, "Years of experience exceeds maximum realistic limit"),
  monthlyOfferPhp: z
    .number()
    .min(3000, "Monthly offer is below statutory minimum")
    .max(5000000, "Monthly offer exceeds maximum realistic ceiling"),
  workScope: WorkScopeSchema,
  school: z.string().default(""),
  macroIndustry: MacroIndustrySchema,
})
export type AuditProfile = z.infer<typeof AuditProfileSchema>

export interface PercentileStats {
  p25: number
  p50: number // median
  p75: number
  mean: number
  count: number
  min: number
  max: number
}
