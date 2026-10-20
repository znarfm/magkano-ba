import { describe, expect, it } from "bun:test"
import {
  queryGranularSchoolStats,
  queryTableRecords,
  exportRecordsToCsv,
} from "../lib/analytics"
import { CareerRecord } from "../lib/types"

const mockRecords: CareerRecord[] = [
  {
    id: "rec-1",
    sourceSheet: "LIYAB_FIRST_PAY",
    cohortYear: 2022,
    macroIndustry: "TECH_IT",
    roleFamily: "Software Engineering",
    rawTitle: "Junior Software Engineer",
    yoeYears: 0,
    seniorityBand: "ENTRY_0",
    workScope: "PH_LOCAL",
    nominalMonthlyGrossPhp: { min: 40000, median: 40000, max: 40000 },
    negotiatedOffer: true,
    schoolCanonical: "UP Diliman",
    schoolTierGroup: "UP_SYSTEM",
    gender: "UNDISCLOSED",
    benefits: {
      guaranteedMonths: 14,
      monthlyAllowancePhp: 2000,
      hmoCoveragePhp: 250000,
      vacationLeaveDays: 15,
      rawBenefitsSummary: "HMO, 14th month",
    },
    mentorAdviceQuote: "Always negotiate your first offer.",
  },
  {
    id: "rec-2",
    sourceSheet: "LIYAB_FIRST_PAY",
    cohortYear: 2023,
    macroIndustry: "TECH_IT",
    roleFamily: "Software Engineering",
    rawTitle: "Associate Developer",
    yoeYears: 0,
    seniorityBand: "ENTRY_0",
    workScope: "PH_LOCAL",
    nominalMonthlyGrossPhp: { min: 30000, median: 30000, max: 30000 },
    negotiatedOffer: false,
    schoolCanonical: "UP Diliman",
    schoolTierGroup: "UP_SYSTEM",
    gender: "FEMALE",
    benefits: {
      guaranteedMonths: 13,
      monthlyAllowancePhp: 0,
      hmoCoveragePhp: null,
      vacationLeaveDays: 12,
      rawBenefitsSummary: null,
    },
    mentorAdviceQuote: "Focus on learning fundamentals.",
  },
  {
    id: "rec-3",
    sourceSheet: "CAREER_PATH_INFO",
    cohortYear: 2021,
    macroIndustry: "TECH_IT",
    roleFamily: "Software Engineering",
    rawTitle: "Entry Frontend Dev",
    yoeYears: 0.5,
    seniorityBand: "ENTRY_0",
    workScope: "PH_LOCAL",
    nominalMonthlyGrossPhp: { min: 35000, median: 35000, max: 35000 },
    negotiatedOffer: null,
    schoolCanonical: "Ateneo de Manila",
    schoolTierGroup: "ADMU_DLSU_UST",
    gender: "MALE",
    benefits: {
      guaranteedMonths: 13,
      monthlyAllowancePhp: 1000,
      hmoCoveragePhp: 200000,
      vacationLeaveDays: 15,
      rawBenefitsSummary: "HMO",
    },
    mentorAdviceQuote: null,
  },
  {
    id: "rec-4",
    sourceSheet: "CAREER_PATH_INFO",
    cohortYear: 2018,
    macroIndustry: "FINANCE_BANKING",
    roleFamily: "Data & Analytics",
    rawTitle: "Senior Data Engineer",
    yoeYears: 6,
    seniorityBand: "SENIOR_6_9",
    workScope: "FOREIGN_REMOTE",
    nominalMonthlyGrossPhp: { min: 120000, median: 120000, max: 120000 },
    negotiatedOffer: null,
    schoolCanonical: "Ateneo de Manila",
    schoolTierGroup: "ADMU_DLSU_UST",
    gender: "MALE",
    benefits: {
      guaranteedMonths: 13,
      monthlyAllowancePhp: 0,
      hmoCoveragePhp: null,
      vacationLeaveDays: 20,
      rawBenefitsSummary: null,
    },
    mentorAdviceQuote: "Remote USD contracts are game changers.",
  },
]

describe("Granular Analytics & Table Seam", () => {
  it("queryGranularSchoolStats aggregates canonical schools with sample threshold", () => {
    // With threshold 1, both UP Diliman and Ateneo de Manila should appear
    const statsT1 = queryGranularSchoolStats(mockRecords, { minCount: 1 })
    expect(statsT1.length).toBe(2)
    // Ateneo median is 35k & 120k -> (35k+120k)/2 = 77.5k median, UP Diliman is 40k & 30k -> 35k median
    expect(statsT1[0].schoolCanonical).toBe("Ateneo de Manila")
    expect(statsT1[0].count).toBe(2)
    expect(statsT1[1].schoolCanonical).toBe("UP Diliman")
    expect(statsT1[1].count).toBe(2)

    // With threshold 3, none qualify
    const statsT3 = queryGranularSchoolStats(mockRecords, { minCount: 3 })
    expect(statsT3.length).toBe(0)
  })

  it("queryTableRecords filters, searches, sorts, and paginates records", () => {
    // Search query
    const resSearch = queryTableRecords(mockRecords, {
      searchQuery: "Data Engineer",
      page: 1,
      pageSize: 10,
    })
    expect(resSearch.totalFiltered).toBe(1)
    expect(resSearch.records[0].rawTitle).toBe("Senior Data Engineer")

    // Filter by industry
    const resTech = queryTableRecords(mockRecords, {
      macroIndustry: "TECH_IT",
      page: 1,
      pageSize: 10,
    })
    expect(resTech.totalFiltered).toBe(3)

    // Sorting by nominal salary descending
    const resSorted = queryTableRecords(mockRecords, {
      sortBy: "salary",
      sortOrder: "desc",
      page: 1,
      pageSize: 2,
    })
    expect(resSorted.records[0].nominalMonthlyGrossPhp.median).toBe(120000)
    expect(resSorted.totalPages).toBe(2)

    // Sorting by CPI-adjusted salary
    const resCpiSorted = queryTableRecords(mockRecords, {
      cpiAdjusted: true,
      sortBy: "salary",
      sortOrder: "desc",
      page: 1,
      pageSize: 2,
    })
    expect(resCpiSorted.records[0].nominalMonthlyGrossPhp.median).toBe(120000)
  })

  it("exportRecordsToCsv outputs RFC-4180 conformant CSV with escaped quotes and commas", () => {
    const csv = exportRecordsToCsv(mockRecords)
    expect(csv).toContain("id,sourceSheet,cohortYear,macroIndustry,roleFamily,rawTitle")
    expect(csv).toContain('"HMO, 14th month"')
    expect(csv).toContain("Always negotiate your first offer.")
  })
})
