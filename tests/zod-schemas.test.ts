import { describe, expect, it } from "bun:test"
import {
  CareerRecordSchema,
  SalaryRangeSchema,
  AuditProfileSchema,
  FilterStateSchema,
  BenefitBreakdownSchema,
} from "../lib/types"

describe("Zod Schema Boundary Tests", () => {
  describe("SalaryRangeSchema", () => {
    it("accepts valid salary ranges with min <= median <= max", () => {
      const valid = { min: 20000, median: 25000, max: 30000 }
      expect(SalaryRangeSchema.safeParse(valid).success).toBe(true)

      const equal = { min: 50000, median: 50000, max: 50000 }
      expect(SalaryRangeSchema.safeParse(equal).success).toBe(true)
    })

    it("rejects mathematical violations where median < min or max < median", () => {
      const broken1 = { min: 30000, median: 20000, max: 40000 }
      expect(SalaryRangeSchema.safeParse(broken1).success).toBe(false)

      const broken2 = { min: 20000, median: 40000, max: 30000 }
      expect(SalaryRangeSchema.safeParse(broken2).success).toBe(false)
    })

    it("rejects negative salaries", () => {
      const negative = { min: -1000, median: 20000, max: 30000 }
      expect(SalaryRangeSchema.safeParse(negative).success).toBe(false)
    })
  })

  describe("BenefitBreakdownSchema", () => {
    it("accepts valid benefit structures with defaults", () => {
      const valid = {
        guaranteedMonths: 13,
        monthlyAllowancePhp: 2000,
        hmoCoveragePhp: 200000,
        vacationLeaveDays: 15,
        rawBenefitsSummary: "Standard package",
      }
      const res = BenefitBreakdownSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it("rejects guaranteed bonus months below legal 12 or above 24", () => {
      expect(
        BenefitBreakdownSchema.safeParse({
          guaranteedMonths: 10,
          monthlyAllowancePhp: 0,
          hmoCoveragePhp: null,
          vacationLeaveDays: null,
          rawBenefitsSummary: null,
        }).success
      ).toBe(false)

      expect(
        BenefitBreakdownSchema.safeParse({
          guaranteedMonths: 28,
          monthlyAllowancePhp: 0,
          hmoCoveragePhp: null,
          vacationLeaveDays: null,
          rawBenefitsSummary: null,
        }).success
      ).toBe(false)
    })
  })

  describe("CareerRecordSchema", () => {
    const validRecord = {
      id: "rec-1",
      sourceSheet: "LIYAB_FIRST_PAY",
      cohortYear: 2020,
      macroIndustry: "TECH_IT",
      roleFamily: "Software Engineering",
      rawTitle: "Junior Frontend Developer",
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
      mentorAdviceQuote: "Negotiate and build strong foundations.",
    }

    it("validates a conformant CareerRecord", () => {
      const res = CareerRecordSchema.safeParse(validRecord)
      expect(res.success).toBe(true)
    })

    it("rejects invalid enums for macroIndustry and workScope", () => {
      const invalidInd = { ...validRecord, macroIndustry: "CRYPTO_MOON" }
      expect(CareerRecordSchema.safeParse(invalidInd).success).toBe(false)

      const invalidScope = { ...validRecord, workScope: "MARS_REMOTE" }
      expect(CareerRecordSchema.safeParse(invalidScope).success).toBe(false)
    })

    it("rejects out-of-range cohortYear or negative YOE", () => {
      const oldYear = { ...validRecord, cohortYear: 1985 }
      expect(CareerRecordSchema.safeParse(oldYear).success).toBe(false)

      const negativeYoe = { ...validRecord, yoeYears: -2 }
      expect(CareerRecordSchema.safeParse(negativeYoe).success).toBe(false)
    })
  })

  describe("AuditProfileSchema", () => {
    it("accepts valid audit profile inputs", () => {
      const profile = {
        role: "Data Engineer",
        yoe: 3.5,
        monthlyOfferPhp: 85000,
        workScope: "FOREIGN_REMOTE",
        school: "DLSU Manila",
        macroIndustry: "TECH_IT",
      }
      expect(AuditProfileSchema.safeParse(profile).success).toBe(true)
    })

    it("rejects empty role or out-of-bounds offer", () => {
      const emptyRole = {
        role: "",
        yoe: 2,
        monthlyOfferPhp: 50000,
        workScope: "PH_LOCAL",
        school: "",
        macroIndustry: "TECH_IT",
      }
      expect(AuditProfileSchema.safeParse(emptyRole).success).toBe(false)

      const belowMinOffer = {
        role: "Developer",
        yoe: 1,
        monthlyOfferPhp: 1000, // below 3000 floor
        workScope: "PH_LOCAL",
        school: "",
        macroIndustry: "TECH_IT",
      }
      expect(AuditProfileSchema.safeParse(belowMinOffer).success).toBe(false)
    })
  })

  describe("FilterStateSchema", () => {
    it("applies schema defaults for filter state", () => {
      const partialFilter = {
        workScopes: ["PH_LOCAL"],
      }
      const res = FilterStateSchema.safeParse(partialFilter)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.cpiAdjusted).toBe(true)
        expect(res.data.takeHomeParity).toBe(false)
        expect(res.data.macroIndustry).toBe("ALL")
      }
    })

    it("rejects empty workScopes array", () => {
      expect(FilterStateSchema.safeParse({ workScopes: [] }).success).toBe(
        false
      )
    })
  })
})
