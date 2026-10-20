import { computeCompensationView } from "./economics"
import {
  CareerRecord,
  FilterState,
  MacroIndustry,
  MacroIndustrySchema,
  PercentileStats,
  SeniorityBand,
  SeniorityBandSchema,
  SchoolTierGroup,
  SchoolTierGroupSchema,
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
  const bands = SeniorityBandSchema.options
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
  const schoolTiers = SchoolTierGroupSchema.options.filter(
    (t) => t !== "UNKNOWN"
  )
  const bySchoolTier = {} as Record<SchoolTierGroup, PercentileStats>
  for (const tier of schoolTiers) {
    const tierValues = filtered
      .filter((r) => r.schoolTierGroup === tier)
      .map(getEffectiveValue)
    bySchoolTier[tier] = computePercentiles(tierValues)
  }

  // Benefits Matrix by MacroIndustry (from all records with benefits)
  const industries = MacroIndustrySchema.options
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
      if (
        filter.seniorityBand &&
        filter.seniorityBand !== "ALL" &&
        r.seniorityBand !== filter.seniorityBand
      ) {
        return false
      }
      if (
        filter.schoolTier &&
        filter.schoolTier !== "ALL" &&
        r.schoolTierGroup !== filter.schoolTier
      ) {
        return false
      }
      if (filter.searchQuery && filter.searchQuery.trim() !== "") {
        const q = filter.searchQuery.toLowerCase()
        return (
          r.mentorAdviceQuote!.toLowerCase().includes(q) ||
          r.rawTitle.toLowerCase().includes(q) ||
          r.roleFamily.toLowerCase().includes(q) ||
          (r.schoolCanonical && r.schoolCanonical.toLowerCase().includes(q))
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

export interface GranularSchoolStat {
  schoolCanonical: string
  tierGroup: SchoolTierGroup
  count: number
  p25: number
  median: number
  p75: number
  min: number
  max: number
}

/**
 * Aggregates career records by specific canonical university/school.
 */
export function queryGranularSchoolStats(
  records: CareerRecord[],
  options?: {
    minCount?: number
    cpiAdjusted?: boolean
    takeHomeParity?: boolean
  }
): GranularSchoolStat[] {
  const minCount = options?.minCount ?? 15
  const cpiAdjusted = options?.cpiAdjusted ?? true
  const takeHomeParity = options?.takeHomeParity ?? false

  const grouped = new Map<
    string,
    { tierGroup: SchoolTierGroup; values: number[] }
  >()

  for (const r of records) {
    if (!r.schoolCanonical || r.schoolCanonical.trim() === "" || r.schoolCanonical === "Unknown") {
      continue
    }
    const val = computeCompensationView(r, { cpiAdjusted, takeHomeParity })
    if (val <= 0) continue

    const existing = grouped.get(r.schoolCanonical)
    if (existing) {
      existing.values.push(val)
    } else {
      grouped.set(r.schoolCanonical, {
        tierGroup: r.schoolTierGroup,
        values: [val],
      })
    }
  }

  const results: GranularSchoolStat[] = []
  for (const [schoolCanonical, data] of grouped.entries()) {
    if (data.values.length < minCount) continue
    const stats = computePercentiles(data.values)
    results.push({
      schoolCanonical,
      tierGroup: data.tierGroup,
      count: stats.count,
      p25: stats.p25,
      median: stats.p50,
      p75: stats.p75,
      min: stats.min,
      max: stats.max,
    })
  }

  return results.sort((a, b) => b.median - a.median)
}

export interface TableQueryOptions {
  searchQuery?: string
  macroIndustry?: string
  roleFamily?: string
  seniorityBand?: string
  schoolCanonical?: string
  workScope?: string
  sourceSheet?: string
  cpiAdjusted?: boolean
  sortBy?: "salary" | "cohortYear" | "yoeYears" | "rawTitle" | "schoolCanonical"
  sortOrder?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface TableQueryResult {
  records: CareerRecord[]
  totalFiltered: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Filters, searches, sorts, and paginates raw career records for data table views.
 */
export function queryTableRecords(
  records: CareerRecord[],
  options?: TableQueryOptions
): TableQueryResult {
  const {
    searchQuery = "",
    macroIndustry = "ALL",
    roleFamily = "ALL",
    seniorityBand = "ALL",
    schoolCanonical = "ALL",
    workScope = "ALL",
    sourceSheet = "ALL",
    cpiAdjusted = false,
    sortBy = "salary",
    sortOrder = "desc",
    page = 1,
    pageSize = 25,
  } = options ?? {}

  const filtered = records.filter((r) => {
    if (macroIndustry !== "ALL" && r.macroIndustry !== macroIndustry) {
      return false
    }
    if (roleFamily !== "ALL" && r.roleFamily !== roleFamily) {
      return false
    }
    if (seniorityBand !== "ALL" && r.seniorityBand !== seniorityBand) {
      return false
    }
    if (schoolCanonical !== "ALL" && r.schoolCanonical !== schoolCanonical) {
      return false
    }
    if (workScope !== "ALL" && r.workScope !== workScope) {
      return false
    }
    if (sourceSheet !== "ALL" && r.sourceSheet !== sourceSheet) {
      return false
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      const match =
        r.rawTitle.toLowerCase().includes(q) ||
        r.roleFamily.toLowerCase().includes(q) ||
        (r.schoolCanonical && r.schoolCanonical.toLowerCase().includes(q)) ||
        (r.mentorAdviceQuote && r.mentorAdviceQuote.toLowerCase().includes(q))
      if (!match) return false
    }

    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let diff = 0
    if (sortBy === "salary") {
      const valA = cpiAdjusted
        ? computeCompensationView(a, { cpiAdjusted: true, takeHomeParity: false })
        : a.nominalMonthlyGrossPhp.median
      const valB = cpiAdjusted
        ? computeCompensationView(b, { cpiAdjusted: true, takeHomeParity: false })
        : b.nominalMonthlyGrossPhp.median
      diff = valA - valB
    } else if (sortBy === "cohortYear") {
      diff = a.cohortYear - b.cohortYear
    } else if (sortBy === "yoeYears") {
      diff = a.yoeYears - b.yoeYears
    } else if (sortBy === "rawTitle") {
      diff = a.rawTitle.localeCompare(b.rawTitle)
    } else if (sortBy === "schoolCanonical") {
      diff = (a.schoolCanonical ?? "").localeCompare(b.schoolCanonical ?? "")
    }
    return sortOrder === "asc" ? diff : -diff
  })

  const totalFiltered = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const offset = (currentPage - 1) * pageSize
  const paginated = filtered.slice(offset, offset + pageSize)

  return {
    records: paginated,
    totalFiltered,
    page: currentPage,
    pageSize,
    totalPages,
  }
}

function escapeCsvField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return ""
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Serializes an array of CareerRecords into RFC-4180 compliant CSV string.
 */
export function exportRecordsToCsv(records: CareerRecord[]): string {
  const headers = [
    "id",
    "sourceSheet",
    "cohortYear",
    "macroIndustry",
    "roleFamily",
    "rawTitle",
    "yoeYears",
    "seniorityBand",
    "workScope",
    "nominalMonthlyGrossMin",
    "nominalMonthlyGrossMedian",
    "nominalMonthlyGrossMax",
    "negotiatedOffer",
    "schoolCanonical",
    "schoolTierGroup",
    "gender",
    "guaranteedMonths",
    "monthlyAllowancePhp",
    "hmoCoveragePhp",
    "vacationLeaveDays",
    "rawBenefitsSummary",
    "mentorAdviceQuote",
  ]

  const rows = records.map((r) => [
    escapeCsvField(r.id),
    escapeCsvField(r.sourceSheet),
    escapeCsvField(r.cohortYear),
    escapeCsvField(r.macroIndustry),
    escapeCsvField(r.roleFamily),
    escapeCsvField(r.rawTitle),
    escapeCsvField(r.yoeYears),
    escapeCsvField(r.seniorityBand),
    escapeCsvField(r.workScope),
    escapeCsvField(r.nominalMonthlyGrossPhp.min),
    escapeCsvField(r.nominalMonthlyGrossPhp.median),
    escapeCsvField(r.nominalMonthlyGrossPhp.max),
    escapeCsvField(r.negotiatedOffer),
    escapeCsvField(r.schoolCanonical),
    escapeCsvField(r.schoolTierGroup),
    escapeCsvField(r.gender),
    escapeCsvField(r.benefits.guaranteedMonths),
    escapeCsvField(r.benefits.monthlyAllowancePhp),
    escapeCsvField(r.benefits.hmoCoveragePhp),
    escapeCsvField(r.benefits.vacationLeaveDays),
    escapeCsvField(r.benefits.rawBenefitsSummary),
    escapeCsvField(r.mentorAdviceQuote),
  ])

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
}

