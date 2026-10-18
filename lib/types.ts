export type WorkScope =
  "PH_LOCAL" | "FOREIGN_REMOTE" | "LIKELY_REMOTE_INTL" | "OVERSEAS_OFW"

export type SeniorityBand =
  "ENTRY_0" | "JUNIOR_1_2" | "MID_3_5" | "SENIOR_6_9" | "STAFF_LEAD_10_PLUS"

export type MacroIndustry =
  | "TECH_IT"
  | "FINANCE_BANKING"
  | "FMCG_RETAIL"
  | "BPO_SHARED_SERVICES"
  | "ENGINEERING_CONSTRUCTION"
  | "MEDIA_ADVERTISING"
  | "GOVERNMENT_PUBLIC_SECTOR"
  | "EDUCATION_ACADEME"
  | "HEALTHCARE_PHARMA"
  | "CONSULTING_MARKET_RESEARCH"
  | "MANUFACTURING_LOGISTICS"
  | "OTHER"

export type SchoolTierGroup =
  | "UP_SYSTEM"
  | "ADMU_DLSU_UST"
  | "STATE_UNIV_POLYTECHNIC"
  | "PRIVATE_METRO"
  | "PROVINCIAL_UNIV"
  | "UNKNOWN"

export type Gender = "FEMALE" | "MALE" | "NON_BINARY_OTHER" | "UNDISCLOSED"

export interface BenefitBreakdown {
  guaranteedMonths: number // Default 13 for PH_LOCAL, 12 for FOREIGN_REMOTE
  monthlyAllowancePhp: number
  hmoCoveragePhp: number | null
  vacationLeaveDays: number | null
  rawBenefitsSummary: string | null
}

export interface CareerRecord {
  id: string
  sourceSheet: "LIYAB_FIRST_PAY" | "CAREER_PATH_INFO"
  cohortYear: number
  macroIndustry: MacroIndustry
  roleFamily: string
  rawTitle: string
  yoeYears: number
  seniorityBand: SeniorityBand
  workScope: WorkScope
  nominalMonthlyGrossPhp: {
    min: number
    median: number
    max: number
  }
  negotiatedOffer: boolean | null
  schoolCanonical: string | null
  schoolTierGroup: SchoolTierGroup
  gender: Gender
  benefits: BenefitBreakdown
  mentorAdviceQuote: string | null
}

export interface FilterState {
  macroIndustry?: MacroIndustry | "ALL"
  roleFamily?: string | "ALL"
  seniorityBand?: SeniorityBand | "ALL"
  workScopes: WorkScope[]
  cpiAdjusted: boolean
  takeHomeParity: boolean
  schoolTier?: SchoolTierGroup | "ALL"
  searchQuery?: string
}

export interface PercentileStats {
  p25: number
  p50: number // median
  p75: number
  mean: number
  count: number
  min: number
  max: number
}
