import type { ArbitrageComparison } from "./economics"
import type {
  MacroIndustry,
  PercentileStats,
  SchoolTierGroup,
  SeniorityBand,
} from "./types"

export interface SeniorityCurvePoint {
  bandKey: SeniorityBand
  label: string
  p25: number
  p50: number
  p75: number
  iqrSpread: number
  count: number
  isLowSample: boolean
}

export interface NegotiationPoint {
  category: string
  median: number
  count: number
}

export interface StackedArbitragePoint {
  name: string
  netTakeHome: number
  tax: number
  statutory: number
  benefits: number
}

export interface SchoolTierPoint {
  tier: SchoolTierGroup
  label: string
  p25: number
  median: number
  p75: number
  count: number
}

export interface IndustryBenefitsPoint {
  industryKey: MacroIndustry
  industry: string
  guaranteedMonths: number
  allowancePhp: number
  leaveDays: number
  sampleCount: number
}

const BAND_CONFIG: { key: SeniorityBand; label: string }[] = [
  { key: "ENTRY_0", label: "0 YOE (Entry)" },
  { key: "JUNIOR_1_2", label: "1-2 YOE (Junior)" },
  { key: "MID_3_5", label: "3-5 YOE (Mid)" },
  { key: "SENIOR_6_9", label: "6-9 YOE (Senior)" },
  { key: "STAFF_LEAD_10_PLUS", label: "10+ YOE (Staff)" },
]

const TIER_LABELS: Record<SchoolTierGroup, string> = {
  UP_SYSTEM: "UP System",
  ADMU_DLSU_UST: "Ateneo / DLSU / UST",
  STATE_UNIV_POLYTECHNIC: "State Univ & Polytechnics",
  PRIVATE_METRO: "Private Metro",
  PROVINCIAL_UNIV: "Provincial Universities",
  UNKNOWN: "Other / Unspecified",
}

const INDUSTRY_LABELS: Record<MacroIndustry, string> = {
  TECH_IT: "Tech & IT",
  FINANCE_BANKING: "Finance & Banking",
  FMCG_RETAIL: "FMCG & Retail",
  BPO_SHARED_SERVICES: "BPO / Shared Services",
  ENGINEERING_CONSTRUCTION: "Engineering / Const.",
  MEDIA_ADVERTISING: "Media & Creative",
  GOVERNMENT_PUBLIC_SECTOR: "Government / Public",
  EDUCATION_ACADEME: "Education / Academe",
  HEALTHCARE_PHARMA: "Healthcare / Pharma",
  CONSULTING_MARKET_RESEARCH: "Consulting / Research",
  MANUFACTURING_LOGISTICS: "Manufacturing / Log.",
  OTHER: "General Business",
}

export function prepareSeniorityCurveData(
  bySeniority: Record<SeniorityBand, PercentileStats>
): SeniorityCurvePoint[] {
  return BAND_CONFIG.map(({ key, label }) => {
    const s = bySeniority[key] ?? {
      p25: 0,
      p50: 0,
      p75: 0,
      mean: 0,
      count: 0,
      min: 0,
      max: 0,
    }

    return {
      bandKey: key,
      label,
      p25: s.p25,
      p50: s.p50,
      p75: s.p75,
      iqrSpread: Math.max(0, s.p75 - s.p25),
      count: s.count,
      isLowSample: s.count > 0 && s.count < 5,
    }
  })
}

export function prepareNegotiationChartData(lift: {
  negotiatedMedian: number
  nonNegotiatedMedian: number
  negotiatedCount: number
  nonNegotiatedCount: number
}): NegotiationPoint[] {
  return [
    {
      category: "Negotiated Offer",
      median: lift.negotiatedMedian,
      count: lift.negotiatedCount,
    },
    {
      category: "Accepted Initial Offer",
      median: lift.nonNegotiatedMedian,
      count: lift.nonNegotiatedCount,
    },
  ]
}

export function prepareStackedArbitrageData(
  arb: ArbitrageComparison
): StackedArbitragePoint[] {
  return [
    {
      name: "PH Local Corporate",
      netTakeHome: arb.localMonthlyNetEquivalent,
      tax: arb.localMonthlyTax,
      statutory: arb.localMonthlyStatutory,
      benefits: Math.round(arb.benefitsAnnualLocal / 12),
    },
    {
      name: "Foreign Remote (8% Tax)",
      netTakeHome: arb.remoteMonthlyNetEquivalent,
      tax: arb.remoteMonthlyTax,
      statutory: arb.remoteMonthlyStatutory,
      benefits: 0,
    },
  ]
}

export function prepareSchoolConvergenceData(
  bySchoolTier: Record<SchoolTierGroup, PercentileStats>
): SchoolTierPoint[] {
  const tiers: SchoolTierGroup[] = [
    "UP_SYSTEM",
    "ADMU_DLSU_UST",
    "STATE_UNIV_POLYTECHNIC",
    "PRIVATE_METRO",
    "PROVINCIAL_UNIV",
  ]

  return tiers
    .map((tier) => ({
      tier,
      label: TIER_LABELS[tier],
      p25: bySchoolTier[tier]?.p25 || 0,
      median: bySchoolTier[tier]?.p50 || 0,
      p75: bySchoolTier[tier]?.p75 || 0,
      count: bySchoolTier[tier]?.count || 0,
    }))
    .filter((pt) => pt.count > 0)
    .sort((a, b) => b.median - a.median)
}

export function prepareBenefitsMatrixData(
  matrix: Record<
    MacroIndustry,
    {
      sampleCount: number
      medianGuaranteedMonths: number
      medianAllowancePhp: number
      avgLeaveDays: number
    }
  >
): IndustryBenefitsPoint[] {
  return (Object.keys(matrix) as MacroIndustry[])
    .map((ind) => ({
      industryKey: ind,
      industry: INDUSTRY_LABELS[ind],
      guaranteedMonths: matrix[ind]?.medianGuaranteedMonths || 13,
      allowancePhp: matrix[ind]?.medianAllowancePhp || 0,
      leaveDays: matrix[ind]?.avgLeaveDays || 15,
      sampleCount: matrix[ind]?.sampleCount || 0,
    }))
    .sort(
      (a, b) =>
        b.guaranteedMonths - a.guaranteedMonths ||
        b.allowancePhp - a.allowancePhp
    )
}

export interface GranularSchoolPoint {
  school: string
  tierGroup: SchoolTierGroup
  tierLabel: string
  median: number
  p25: number
  p75: number
  iqrSpread: number
  count: number
}

export function prepareGranularSchoolData(
  stats: {
    schoolCanonical: string
    tierGroup: SchoolTierGroup
    count: number
    p25: number
    median: number
    p75: number
  }[]
): GranularSchoolPoint[] {
  return stats.map((s) => ({
    school: s.schoolCanonical,
    tierGroup: s.tierGroup,
    tierLabel: TIER_LABELS[s.tierGroup] || s.tierGroup,
    median: s.median,
    p25: s.p25,
    p75: s.p75,
    iqrSpread: Math.max(0, s.p75 - s.p25),
    count: s.count,
  }))
}
