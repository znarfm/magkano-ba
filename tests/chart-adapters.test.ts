import { describe, expect, it } from "bun:test"
import {
  prepareSeniorityCurveData,
  prepareNegotiationChartData,
  prepareStackedArbitrageData,
  prepareSchoolConvergenceData,
  prepareBenefitsMatrixData,
  prepareGranularSchoolData,
} from "../lib/chart-adapters"
import {
  PercentileStats,
  SeniorityBand,
  SchoolTierGroup,
  MacroIndustry,
} from "../lib/types"
import { calculateNetArbitrage } from "../lib/economics"

describe("Chart Data Adapters", () => {
  it("formats seniority progression curve data with IQR spread and sample count", () => {
    const mockSeniority: Record<SeniorityBand, PercentileStats> = {
      ENTRY_0: {
        p25: 20000,
        p50: 25000,
        p75: 35000,
        mean: 26000,
        count: 50,
        min: 15000,
        max: 60000,
      },
      JUNIOR_1_2: {
        p25: 30000,
        p50: 40000,
        p75: 55000,
        mean: 42000,
        count: 30,
        min: 20000,
        max: 80000,
      },
      MID_3_5: {
        p25: 50000,
        p50: 65000,
        p75: 85000,
        mean: 68000,
        count: 25,
        min: 35000,
        max: 120000,
      },
      SENIOR_6_9: {
        p25: 80000,
        p50: 100000,
        p75: 140000,
        mean: 105000,
        count: 15,
        min: 50000,
        max: 200000,
      },
      STAFF_LEAD_10_PLUS: {
        p25: 120000,
        p50: 160000,
        p75: 220000,
        mean: 170000,
        count: 10,
        min: 80000,
        max: 350000,
      },
    }

    const data = prepareSeniorityCurveData(mockSeniority)
    expect(data.length).toBe(5)
    expect(data[0].bandKey).toBe("ENTRY_0")
    expect(data[0].label).toBe("0 YOE (Entry)")
    expect(data[0].p25).toBe(20000)
    expect(data[0].p50).toBe(25000)
    expect(data[0].p75).toBe(35000)
    expect(data[0].iqrSpread).toBe(15000) // 35000 - 20000
    expect(data[0].count).toBe(50)
    expect(data[0].isLowSample).toBe(false)

    // Check low sample flag
    const lowSampleMock = {
      ...mockSeniority,
      STAFF_LEAD_10_PLUS: { ...mockSeniority.STAFF_LEAD_10_PLUS, count: 3 },
    }
    const lowSampleData = prepareSeniorityCurveData(lowSampleMock)
    expect(lowSampleData[4].isLowSample).toBe(true)
  })

  it("formats negotiation comparison data for bar charts", () => {
    const mockLift = {
      negotiatedMedian: 30000,
      nonNegotiatedMedian: 22000,
      liftPhp: 8000,
      liftPercent: 36,
      negotiatedCount: 150,
      nonNegotiatedCount: 300,
    }

    const data = prepareNegotiationChartData(mockLift)
    expect(data.length).toBe(2)
    expect(data[0].category).toBe("Negotiated Offer")
    expect(data[0].median).toBe(30000)
    expect(data[0].count).toBe(150)

    expect(data[1].category).toBe("Accepted Initial Offer")
    expect(data[1].median).toBe(22000)
    expect(data[1].count).toBe(300)
  })

  it("formats stacked net arbitrage comparison for Local vs Remote", () => {
    const arbitrage = calculateNetArbitrage(60000, 13, 2000, 24000)
    const data = prepareStackedArbitrageData(arbitrage)

    expect(data.length).toBe(2)
    expect(data[0].name).toBe("PH Local Corporate")
    expect(data[0].netTakeHome).toBeGreaterThan(0)
    expect(data[0].tax).toBeGreaterThanOrEqual(0)
    expect(data[0].benefits).toBeGreaterThan(0)

    expect(data[1].name).toBe("Foreign Remote (8% Tax)")
    expect(data[1].netTakeHome).toBeGreaterThan(0)
    expect(data[1].tax).toBeGreaterThanOrEqual(0)
  })

  it("formats school convergence tier data sorted by median starting pay", () => {
    const mockTiers: Record<SchoolTierGroup, PercentileStats> = {
      UP_SYSTEM: {
        p25: 25000,
        p50: 32000,
        p75: 45000,
        mean: 34000,
        count: 120,
        min: 18000,
        max: 80000,
      },
      ADMU_DLSU_UST: {
        p25: 28000,
        p50: 35000,
        p75: 50000,
        mean: 37000,
        count: 140,
        min: 20000,
        max: 95000,
      },
      STATE_UNIV_POLYTECHNIC: {
        p25: 18000,
        p50: 22000,
        p75: 28000,
        mean: 23000,
        count: 90,
        min: 12000,
        max: 45000,
      },
      PRIVATE_METRO: {
        p25: 20000,
        p50: 25000,
        p75: 35000,
        mean: 27000,
        count: 80,
        min: 15000,
        max: 60000,
      },
      PROVINCIAL_UNIV: {
        p25: 16000,
        p50: 20000,
        p75: 26000,
        mean: 21000,
        count: 60,
        min: 12000,
        max: 40000,
      },
      UNKNOWN: { p25: 0, p50: 0, p75: 0, mean: 0, count: 0, min: 0, max: 0 },
    }

    const data = prepareSchoolConvergenceData(mockTiers)
    expect(data.length).toBe(5) // Excludes UNKNOWN
    expect(data[0].median).toBeGreaterThanOrEqual(data[1].median) // Sorted descending
  })

  it("formats macro industry benefits matrix data", () => {
    const mockMatrix: Record<
      MacroIndustry,
      {
        sampleCount: number
        medianGuaranteedMonths: number
        medianAllowancePhp: number
        avgLeaveDays: number
      }
    > = {
      TECH_IT: {
        sampleCount: 50,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 3000,
        avgLeaveDays: 15,
      },
      FINANCE_BANKING: {
        sampleCount: 40,
        medianGuaranteedMonths: 15,
        medianAllowancePhp: 2000,
        avgLeaveDays: 18,
      },
      FMCG_RETAIL: {
        sampleCount: 30,
        medianGuaranteedMonths: 14,
        medianAllowancePhp: 2500,
        avgLeaveDays: 15,
      },
      BPO_SHARED_SERVICES: {
        sampleCount: 45,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 1500,
        avgLeaveDays: 14,
      },
      ENGINEERING_CONSTRUCTION: {
        sampleCount: 20,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 1000,
        avgLeaveDays: 12,
      },
      MEDIA_ADVERTISING: {
        sampleCount: 25,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 1000,
        avgLeaveDays: 14,
      },
      GOVERNMENT_PUBLIC_SECTOR: {
        sampleCount: 30,
        medianGuaranteedMonths: 14,
        medianAllowancePhp: 2000,
        avgLeaveDays: 15,
      },
      EDUCATION_ACADEME: {
        sampleCount: 15,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 500,
        avgLeaveDays: 20,
      },
      HEALTHCARE_PHARMA: {
        sampleCount: 10,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 1000,
        avgLeaveDays: 15,
      },
      CONSULTING_MARKET_RESEARCH: {
        sampleCount: 15,
        medianGuaranteedMonths: 14,
        medianAllowancePhp: 2500,
        avgLeaveDays: 16,
      },
      MANUFACTURING_LOGISTICS: {
        sampleCount: 12,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 1500,
        avgLeaveDays: 14,
      },
      OTHER: {
        sampleCount: 80,
        medianGuaranteedMonths: 13,
        medianAllowancePhp: 1000,
        avgLeaveDays: 14,
      },
    }

    const data = prepareBenefitsMatrixData(mockMatrix)
    expect(data.length).toBe(12)
    expect(data[0].industry).toBeDefined()
    expect(data[0].guaranteedMonths).toBeGreaterThanOrEqual(13)
  })

  it("formats granular school data with labels, median, IQR, and sample count", () => {
    const mockGranular = [
      {
        schoolCanonical: "UP Diliman",
        tierGroup: "UP_SYSTEM" as SchoolTierGroup,
        count: 511,
        p25: 30000,
        median: 45000,
        p75: 65000,
        min: 20000,
        max: 150000,
      },
      {
        schoolCanonical: "PUP",
        tierGroup: "STATE_UNIV_POLYTECHNIC" as SchoolTierGroup,
        count: 190,
        p25: 22000,
        median: 30000,
        p75: 42000,
        min: 15000,
        max: 90000,
      },
    ]

    const data = prepareGranularSchoolData(mockGranular)
    expect(data.length).toBe(2)
    expect(data[0].school).toBe("UP Diliman")
    expect(data[0].median).toBe(45000)
    expect(data[0].count).toBe(511)
    expect(data[0].iqrSpread).toBe(35000)
    expect(data[1].school).toBe("PUP")
  })
})
