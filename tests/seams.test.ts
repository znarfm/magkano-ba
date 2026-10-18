import { describe, expect, it } from "bun:test"
import {
  parseSalary,
  normalizeUniversity,
  classifyWorkScope,
  classifyTaxonomy,
} from "../scripts/etl/index"
import { getCpiMultiplier } from "../lib/config/psa-cpi"
import {
  computeEmployeeStatutory,
  computeTrainAnnualTax,
  computeContractorAnnualTax,
  calculateNetArbitrage,
} from "../lib/economics"
import { computePercentiles, queryDashboardSlice } from "../lib/analytics"
import { buildGroundedAuditPrompt } from "../lib/auditor"
import { CareerRecord } from "../lib/types"

describe("Seam 1: Offline ETL Normalization Boundary", () => {
  it("parses messy salary strings correctly", () => {
    expect(parseSalary("100k - 150k")).toEqual({
      min: 100000,
      median: 125000,
      max: 150000,
    })
    expect(parseSalary("Gross: 15000")).toEqual({
      min: 15000,
      median: 15000,
      max: 15000,
    })
    expect(parseSalary("around 70k")).toEqual({
      min: 70000,
      median: 70000,
      max: 70000,
    })
    expect(parseSalary("25,000")).toEqual({
      min: 25000,
      median: 25000,
      max: 25000,
    })
    expect(parseSalary("38k/month")).toEqual({
      min: 38000,
      median: 38000,
      max: 38000,
    })
    // Rejects non-numeric / troll entries
    expect(parseSalary("Good")).toBeNull()
    expect(parseSalary("Secret")).toBeNull()
    expect(parseSalary("N/A")).toBeNull()
    expect(parseSalary("500")).toBeNull() // Below 3000 floor
    expect(parseSalary("50,000,000")).toBeNull() // Above 2M ceiling
  })

  it("normalizes university variants and assigns schoolTierGroup", () => {
    const upd = normalizeUniversity("University of the Philippines - Diliman")
    expect(upd.canonical).toBe("UP Diliman")
    expect(upd.tierGroup).toBe("UP_SYSTEM")

    const admu = normalizeUniversity("Ateneo de Manila University")
    expect(admu.canonical).toBe("Ateneo de Manila")
    expect(admu.tierGroup).toBe("ADMU_DLSU_UST")

    const dlsu = normalizeUniversity("DLSU")
    expect(dlsu.canonical).toBe("DLSU Manila")
    expect(dlsu.tierGroup).toBe("ADMU_DLSU_UST")

    const pup = normalizeUniversity("Polytechnic University of the Philippines")
    expect(pup.canonical).toBe("PUP")
    expect(pup.tierGroup).toBe("STATE_UNIV_POLYTECHNIC")

    const slu = normalizeUniversity("Saint Louis University")
    expect(slu.canonical).toBe("Saint Louis University")
    expect(slu.tierGroup).toBe("PROVINCIAL_UNIV")
  })

  it("classifies work scope correctly", () => {
    expect(
      classifyWorkScope("Remote software engineer for US client", 80000)
    ).toBe("FOREIGN_REMOTE")
    expect(
      classifyWorkScope("Junior QA based in Singapore SGD 4000", 160000)
    ).toBe("OVERSEAS_OFW")
    expect(classifyWorkScope("Lead Architect in Manila", 350000)).toBe(
      "LIKELY_REMOTE_INTL"
    )
    expect(classifyWorkScope("HR Associate at BDO Makati", 25000)).toBe(
      "PH_LOCAL"
    )
  })

  it("classifies macro industry and role family", () => {
    const dev = classifyTaxonomy("Full Stack Developer", "IT")
    expect(dev.macroIndustry).toBe("TECH_IT")
    expect(dev.roleFamily).toBe("Software Engineering")

    const audit = classifyTaxonomy("Audit Associate", "Financial Services")
    expect(audit.macroIndustry).toBe("FINANCE_BANKING")
    expect(audit.roleFamily).toBe("Accounting & Audit")

    const csr = classifyTaxonomy("Customer Service Representative", "BPO")
    expect(csr.macroIndustry).toBe("BPO_SHARED_SERVICES")
    expect(csr.roleFamily).toBe("Customer Support & Service")
  })
})

describe("Seam 2: Economic & Tax Math Engine", () => {
  it("computes PSA CPI multipliers accurately", () => {
    // 2026 CPI is 134.5, 2018 base is 100.0 -> multiplier is 1.345
    const mult2018 = getCpiMultiplier(2018)
    expect(mult2018).toBeCloseTo(1.345, 2)

    // 2026 multiplier should be exactly 1.0
    expect(getCpiMultiplier(2026)).toBe(1.0)

    // Pre-2005 clamps to 2005
    expect(getCpiMultiplier(1998)).toBe(getCpiMultiplier(2005))
  })

  it("computes 2026 PH Local employee statutory contributions", () => {
    const stat = computeEmployeeStatutory(30000)
    // SSS: 30000 * 0.045 = 1350
    expect(stat.sss).toBe(1350)
    // PhilHealth: 30000 * 0.025 = 750
    expect(stat.philHealth).toBe(750)
    // Pag-IBIG: min(200, 30000 * 0.02 = 600) = 200
    expect(stat.pagIbig).toBe(200)
    expect(stat.total).toBe(2300)
  })

  it("computes graduated TRAIN tax brackets", () => {
    // Below 250k taxable is exempt
    expect(computeTrainAnnualTax(240000)).toBe(0)

    // 350k taxable: 15% of 100k = 15,000
    expect(computeTrainAnnualTax(350000)).toBe(15000)

    // 600k taxable: 22,500 + 20% of 200k = 62,500
    expect(computeTrainAnnualTax(600000)).toBe(62500)
  })

  it("computes 8% flat freelance tax", () => {
    // Under 250k deduction is 0
    expect(computeContractorAnnualTax(200000)).toBe(0)

    // 1,000,000 gross: (1,000,000 - 250,000) * 0.08 = 60,000
    expect(computeContractorAnnualTax(1000000)).toBe(60000)
  })

  it("computes net arbitrage break-even accurately", () => {
    const arb = calculateNetArbitrage(50000, 13, 1000, 24000)
    expect(arb.localMonthlyGross).toBe(50000)
    expect(arb.localMonthlyNetEquivalent).toBeGreaterThan(0)
    expect(arb.remoteBreakEvenMonthlyGross).toBeGreaterThan(0)
    // Remote break-even should yield equivalent net
    expect(
      Math.abs(arb.remoteMonthlyNetEquivalent - arb.localMonthlyNetEquivalent)
    ).toBeLessThanOrEqual(50)
  })
})

describe("Seam 3: Client Analytical Query & Percentile Engine", () => {
  it("computes accurate P25, Median, P75 percentiles", () => {
    const values = [10000, 20000, 30000, 40000, 50000]
    const stats = computePercentiles(values)
    expect(stats.min).toBe(10000)
    expect(stats.p25).toBe(20000)
    expect(stats.p50).toBe(30000)
    expect(stats.p75).toBe(40000)
    expect(stats.max).toBe(50000)
    expect(stats.mean).toBe(30000)
  })

  it("filters dashboard slice and calculates negotiation lift", () => {
    const mockRecords: CareerRecord[] = [
      {
        id: "1",
        sourceSheet: "LIYAB_FIRST_PAY",
        cohortYear: 2020,
        macroIndustry: "TECH_IT",
        roleFamily: "Software Engineering",
        rawTitle: "Junior Developer",
        yoeYears: 0,
        seniorityBand: "ENTRY_0",
        workScope: "PH_LOCAL",
        nominalMonthlyGrossPhp: { min: 30000, median: 30000, max: 30000 },
        negotiatedOffer: true,
        schoolCanonical: "UP Diliman",
        schoolTierGroup: "UP_SYSTEM",
        gender: "FEMALE",
        benefits: {
          guaranteedMonths: 13,
          monthlyAllowancePhp: 0,
          hmoCoveragePhp: null,
          vacationLeaveDays: null,
          rawBenefitsSummary: null,
        },
        mentorAdviceQuote: "Negotiate hard on tech offers.",
      },
      {
        id: "2",
        sourceSheet: "LIYAB_FIRST_PAY",
        cohortYear: 2020,
        macroIndustry: "TECH_IT",
        roleFamily: "Software Engineering",
        rawTitle: "Junior Developer",
        yoeYears: 0,
        seniorityBand: "ENTRY_0",
        workScope: "PH_LOCAL",
        nominalMonthlyGrossPhp: { min: 25000, median: 25000, max: 25000 },
        negotiatedOffer: false,
        schoolCanonical: "DLSU Manila",
        schoolTierGroup: "ADMU_DLSU_UST",
        gender: "MALE",
        benefits: {
          guaranteedMonths: 13,
          monthlyAllowancePhp: 0,
          hmoCoveragePhp: null,
          vacationLeaveDays: null,
          rawBenefitsSummary: null,
        },
        mentorAdviceQuote: null,
      },
    ]

    const slice = queryDashboardSlice(mockRecords, {
      macroIndustry: "TECH_IT",
      workScopes: ["PH_LOCAL"],
      cpiAdjusted: false,
      takeHomeParity: false,
    })

    expect(slice.filteredCount).toBe(2)
    expect(slice.salaryStats.p50).toBe(27500)
    expect(slice.negotiationLift.liftPhp).toBe(5000) // 30,000 - 25,000
    expect(slice.negotiationLift.liftPercent).toBe(20)
  })
})

describe("Seam 4: Grounded BYOK Prompt Builder", () => {
  it("serializes exact percentiles and arb metrics into system and user prompts", () => {
    const profile = {
      role: "Frontend Engineer",
      yoe: 2,
      monthlyOfferPhp: 45000,
      workScope: "PH_LOCAL",
      school: "UP Diliman",
      macroIndustry: "TECH_IT",
    }
    const percentiles = {
      p25: 35000,
      p50: 48000,
      p75: 65000,
      mean: 49000,
      count: 42,
      min: 25000,
      max: 95000,
    }
    const arbitrage = calculateNetArbitrage(45000)
    const mockQuote: CareerRecord = {
      id: "q1",
      sourceSheet: "CAREER_PATH_INFO",
      cohortYear: 2018,
      macroIndustry: "TECH_IT",
      roleFamily: "Software Engineering",
      rawTitle: "Frontend Engineer",
      yoeYears: 2,
      seniorityBand: "JUNIOR_1_2",
      workScope: "PH_LOCAL",
      nominalMonthlyGrossPhp: { min: 45000, median: 45000, max: 45000 },
      negotiatedOffer: null,
      schoolCanonical: "UP Diliman",
      schoolTierGroup: "UP_SYSTEM",
      gender: "UNDISCLOSED",
      benefits: {
        guaranteedMonths: 13,
        monthlyAllowancePhp: 0,
        hmoCoveragePhp: null,
        vacationLeaveDays: null,
        rawBenefitsSummary: null,
      },
      mentorAdviceQuote: "Focus on clean architecture early.",
    }

    const payload = buildGroundedAuditPrompt(profile, percentiles, arbitrage, [
      mockQuote,
    ])

    expect(payload.systemPrompt).toContain(
      "NEVER fabricate or hallucinate salary numbers"
    )
    expect(payload.userPrompt).toContain("Frontend Engineer")
    expect(payload.userPrompt).toContain("₱35,000/mo")
    expect(payload.userPrompt).toContain("₱48,000/mo")
    expect(payload.userPrompt).toContain("₱65,000/mo")
    expect(payload.userPrompt).toContain("Focus on clean architecture early.")
  })
})
