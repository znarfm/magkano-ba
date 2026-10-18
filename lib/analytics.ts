import { computeCompensationView } from "./economics"
import {
  CareerRecord,
  FilterState,
  MacroIndustry,
  PercentileStats,
  SeniorityBand,
  SchoolTierGroup,
  WorkScope,
} from "./types"

export interface DashboardAnalytics {
  totalRecords: number
  filteredCount: number
  salaryStats: PercentileStats
  bySeniority: Record<SeniorityBand, PercentileStats>
  negotiationLift: {
    negotiatedMedian: number
    nonNegotiatedMedian: number
    liftPhp: number
    liftPercent: number
    negotiatedCount: number
    nonNegotiatedCount: number
  }
  bySchoolTier: Record<SchoolTierGroup, PercentileStats>
  benefitsMatrix: Record<
    MacroIndustry,
    {
      sampleCount: number
      medianGuaranteedMonths: number
      medianAllowancePhp: number
      avgLeaveDays: number
    }
  >
  mentorQuotes: CareerRecord[]
}

/**
 * Computes P25, P50 (median), P75, mean, min, and max from a numeric array.
 */
export function computePercentiles(values: number[]): PercentileStats {
  if (values.length === 0) {
    return { p25: 0, p50: 0, p75: 0, mean: 0, count: 0, min: 0, max: 0 }
  }

  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length

  const getPercentile = (p: number) => {
    const idx = (p / 100) * (n - 1)
    const low = Math.floor(idx)
    const high = Math.ceil(idx)
    const weight = idx - low
    return Math.round(sorted[low] * (1 - weight) + sorted[high] * weight)
  }

  const sum = sorted.reduce((acc, v) => acc + v, 0)

  return {
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    mean: Math.round(sum / n),
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
  }
}

/**
 * Filters dataset and calculates aggregated analytics across modules.
 */
export function queryDashboardSlice(
  records: CareerRecord[],
  filter: FilterState
): DashboardAnalytics {
  const filtered = records.filter((r) => {
    // Exclude zero-salary records from numerical analytics
    if (r.nominalMonthlyGrossPhp.median <= 0) return false

    // Work scope filter
    if (
      filter.workScopes.length > 0 &&
      !filter.workScopes.includes(r.workScope)
    ) {
      return false
    }

    // Macro Industry filter
    if (
      filter.macroIndustry &&
      filter.macroIndustry !== "ALL" &&
      r.macroIndustry !== filter.macroIndustry
    ) {
      return false
    }

    // Role Family filter
    if (
      filter.roleFamily &&
      filter.roleFamily !== "ALL" &&
      r.roleFamily !== filter.roleFamily
    ) {
      return false
    }

    // Seniority Band filter
    if (
      filter.seniorityBand &&
      filter.seniorityBand !== "ALL" &&
      r.seniorityBand !== filter.seniorityBand
    ) {
      return false
    }

    // School Tier filter
    if (
      filter.schoolTier &&
      filter.schoolTier !== "ALL" &&
      r.schoolTierGroup !== filter.schoolTier
    ) {
      return false
    }

    // Free text search
    if (filter.searchQuery && filter.searchQuery.trim() !== "") {
      const q = filter.searchQuery.toLowerCase()
      const match =
        r.rawTitle.toLowerCase().includes(q) ||
        r.roleFamily.toLowerCase().includes(q) ||
        (r.schoolCanonical && r.schoolCanonical.toLowerCase().includes(q)) ||
        (r.mentorAdviceQuote && r.mentorAdviceQuote.toLowerCase().includes(q))
      if (!match) return false
    }

    return true
  })

  // Extract effective values for current CPI / Parity toggle
  const getEffectiveValue = (r: CareerRecord) =>
    computeCompensationView(r, {
      cpiAdjusted: filter.cpiAdjusted,
      takeHomeParity: filter.takeHomeParity,
    })

  const salaryValues = filtered.map(getEffectiveValue)
  const salaryStats = computePercentiles(salaryValues)

  // Breakdown by Seniority Band
  const bands: SeniorityBand[] = [
    "ENTRY_0",
    "JUNIOR_1_2",
    "MID_3_5",
    "SENIOR_6_9",
    "STAFF_LEAD_10_PLUS",
  ]
  const bySeniority = {} as Record<SeniorityBand, PercentileStats>
  for (const band of bands) {
    const bandValues = filtered
      .filter((r) => r.seniorityBand === band)
      .map(getEffectiveValue)
    bySeniority[band] = computePercentiles(bandValues)
  }

  // Negotiation Lift (ENTRY_0 from Sheet 1)
  const entryOffers = filtered.filter(
    (r) => r.seniorityBand === "ENTRY_0" && r.negotiatedOffer !== null
  )
  const negYes = entryOffers
    .filter((r) => r.negotiatedOffer === true)
    .map(getEffectiveValue)
  const negNo = entryOffers
    .filter((r) => r.negotiatedOffer === false)
    .map(getEffectiveValue)

  const statsYes = computePercentiles(negYes)
  const statsNo = computePercentiles(negNo)
  const liftPhp = statsNo.p50 > 0 ? statsYes.p50 - statsNo.p50 : 0
  const liftPercent =
    statsNo.p50 > 0 ? Math.round((liftPhp / statsNo.p50) * 100) : 0

  // Breakdown by School Tier
  const schoolTiers: SchoolTierGroup[] = [
    "UP_SYSTEM",
    "ADMU_DLSU_UST",
    "STATE_UNIV_POLYTECHNIC",
    "PRIVATE_METRO",
    "PROVINCIAL_UNIV",
  ]
  const bySchoolTier = {} as Record<SchoolTierGroup, PercentileStats>
  for (const tier of schoolTiers) {
    const tierValues = filtered
      .filter((r) => r.schoolTierGroup === tier)
      .map(getEffectiveValue)
    bySchoolTier[tier] = computePercentiles(tierValues)
  }

  // Benefits Matrix by MacroIndustry (from all records with benefits)
  const industries: MacroIndustry[] = [
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
  ]

  const benefitsMatrix = {} as DashboardAnalytics["benefitsMatrix"]
  for (const ind of industries) {
    const indRecords = records.filter(
      (r) => r.macroIndustry === ind && r.sourceSheet === "CAREER_PATH_INFO"
    )
    const months = indRecords
      .map((r) => r.benefits.guaranteedMonths)
      .filter((m) => m > 0)
    const allowances = indRecords
      .map((r) => r.benefits.monthlyAllowancePhp)
      .filter((a) => a > 0)
    const leaves = indRecords
      .map((r) => r.benefits.vacationLeaveDays)
      .filter((l): l is number => l !== null && l > 0)

    const medMonths = computePercentiles(months).p50 || 13
    const medAllow = computePercentiles(allowances).p50 || 0
    const avgLeaves =
      leaves.length > 0
        ? Math.round(leaves.reduce((a, b) => a + b, 0) / leaves.length)
        : 15

    benefitsMatrix[ind] = {
      sampleCount: indRecords.length,
      medianGuaranteedMonths: medMonths,
      medianAllowancePhp: medAllow,
      avgLeaveDays: avgLeaves,
    }
  }

  // Filtered mentor quotes
  const mentorQuotes = records
    .filter((r) => r.mentorAdviceQuote && r.mentorAdviceQuote.length > 20)
    .filter((r) => {
      if (
        filter.macroIndustry &&
        filter.macroIndustry !== "ALL" &&
        r.macroIndustry !== filter.macroIndustry
      ) {
        return false
      }
      if (filter.searchQuery && filter.searchQuery.trim() !== "") {
        const q = filter.searchQuery.toLowerCase()
        return (
          r.mentorAdviceQuote!.toLowerCase().includes(q) ||
          r.rawTitle.toLowerCase().includes(q) ||
          r.roleFamily.toLowerCase().includes(q)
        )
      }
      return true
    })
    .slice(0, 30)

  return {
    totalRecords: records.length,
    filteredCount: filtered.length,
    salaryStats,
    bySeniority,
    negotiationLift: {
      negotiatedMedian: statsYes.p50,
      nonNegotiatedMedian: statsNo.p50,
      liftPhp,
      liftPercent,
      negotiatedCount: statsYes.count,
      nonNegotiatedCount: statsNo.count,
    },
    bySchoolTier,
    benefitsMatrix,
    mentorQuotes,
  }
}
