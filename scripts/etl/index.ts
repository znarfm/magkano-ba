import fs from "fs"
import path from "path"
import {
  CareerRecord,
  CareerRecordSchema,
  MacroIndustry,
  SeniorityBand,
  WorkScope,
  SchoolTierGroup,
  Gender,
  BenefitBreakdown,
} from "../../lib/types"

// RFC 4180 compliant CSV parser supporting multiline fields and escaped quotes
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (c === "," && !inQuotes) {
      row.push(field)
      field = ""
    } else if ((c === "\r" || c === "\n") && !inQuotes) {
      if (c === "\r" && text[i + 1] === "\n") {
        i++
      }
      row.push(field)
      if (row.length > 1 || (row.length === 1 && row[0].trim() !== "")) {
        rows.push(row)
      }
      row = []
      field = ""
    } else {
      field += c
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

// Parse salary strings into { min, median, max }
export function parseSalary(
  raw: string
): { min: number; median: number; max: number } | null {
  if (!raw) return null
  const s = raw.toLowerCase().trim()

  // Non-numeric qualitative phrases to reject
  if (
    /^(good|secret|n\/?a|undisclosed|competitive|confidential|ranges?|standard|none|varies|-|\?+)$/i.test(
      s
    )
  ) {
    return null
  }

  // Check for "100k - 150k" or "100k to 150k" or "100,000 - 150,000"
  const rangeMatch = s.match(
    /(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:-|to|\/)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?/i
  )
  if (rangeMatch) {
    let num1 = parseFloat(rangeMatch[1].replace(/,/g, ""))
    const unit1 = rangeMatch[2]?.toLowerCase()
    let num2 = parseFloat(rangeMatch[3].replace(/,/g, ""))
    const unit2 = rangeMatch[4]?.toLowerCase()

    if (unit1 === "k" || (!unit1 && unit2 === "k")) num1 *= 1000
    if (unit1 === "m" || (!unit1 && unit2 === "m")) num1 *= 1000000
    if (unit2 === "k") num2 *= 1000
    if (unit2 === "m") num2 *= 1000000

    const min = Math.min(num1, num2)
    const max = Math.max(num1, num2)
    if (min >= 3000 && max <= 2000000) {
      return { min, median: (min + max) / 2, max }
    }
  }

  // Single number with possible k / m / decimals
  // E.g. "Gross: 15000", "25,000", "around 70k", "38k/month", "35000"
  const singleMatch = s.match(
    /(?:around|gross:?|php:?|p)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?/i
  )
  if (singleMatch) {
    let val = parseFloat(singleMatch[1].replace(/,/g, ""))
    const unit = singleMatch[2]?.toLowerCase()
    if (unit === "k") val *= 1000
    if (unit === "m") val *= 1000000

    // Plausibility bounds (₱3k to ₱2M per month)
    if (val >= 3000 && val <= 2000000) {
      return { min: val, median: val, max: val }
    }
  }

  return null
}

// Normalizes university name and maps to schoolTierGroup
export function normalizeUniversity(raw: string | undefined): {
  canonical: string | null
  tierGroup: SchoolTierGroup
} {
  if (!raw || raw.trim() === "" || /^n\/?a|none|-$/i.test(raw.trim())) {
    return { canonical: null, tierGroup: "UNKNOWN" }
  }
  const s = raw.trim()

  // PUP / State Polytechnics before UP to avoid partial match on 'University of the Philippines'
  if (/polytechnic university of the philippines|pup/i.test(s)) {
    return { canonical: "PUP", tierGroup: "STATE_UNIV_POLYTECHNIC" }
  }
  if (/pamantasan ng lungsod ng maynila|plm/i.test(s)) {
    return { canonical: "PLM", tierGroup: "STATE_UNIV_POLYTECHNIC" }
  }
  if (/technological university of the philippines|tup/i.test(s)) {
    return { canonical: "TUP", tierGroup: "STATE_UNIV_POLYTECHNIC" }
  }

  // UP System
  if (/(?:^|\b)(up|u\.p\.|university of the philippines)(?:\b|$)/i.test(s)) {
    if (/diliman|upd/i.test(s))
      return { canonical: "UP Diliman", tierGroup: "UP_SYSTEM" }
    if (/los ba[ñn]os|uplb/i.test(s))
      return { canonical: "UP Los Baños", tierGroup: "UP_SYSTEM" }
    if (/manila|upm/i.test(s))
      return { canonical: "UP Manila", tierGroup: "UP_SYSTEM" }
    if (/visayas|upv/i.test(s))
      return { canonical: "UP Visayas", tierGroup: "UP_SYSTEM" }
    if (/baguio/i.test(s))
      return { canonical: "UP Baguio", tierGroup: "UP_SYSTEM" }
    if (/mindanao/i.test(s))
      return { canonical: "UP Mindanao", tierGroup: "UP_SYSTEM" }
    return { canonical: "UP System", tierGroup: "UP_SYSTEM" }
  }

  // ADMU / DLSU / UST
  if (/ateneo|admu/i.test(s)) {
    if (/davao/i.test(s))
      return { canonical: "Ateneo de Davao", tierGroup: "PROVINCIAL_UNIV" }
    if (/naga/i.test(s))
      return { canonical: "Ateneo de Naga", tierGroup: "PROVINCIAL_UNIV" }
    return { canonical: "Ateneo de Manila", tierGroup: "ADMU_DLSU_UST" }
  }
  if (/de la salle|dlsu|lasalle|la salle/i.test(s)) {
    if (/benilde|csb/i.test(s))
      return { canonical: "DLS-CSB", tierGroup: "PRIVATE_METRO" }
    if (/lipa/i.test(s))
      return { canonical: "DLSU Lipa", tierGroup: "PROVINCIAL_UNIV" }
    return { canonical: "DLSU Manila", tierGroup: "ADMU_DLSU_UST" }
  }
  if (/santo tomas|ust|university of st\.? tomas/i.test(s)) {
    return { canonical: "UST", tierGroup: "ADMU_DLSU_UST" }
  }

  if (/state univ|state college|polytechnic/i.test(s)) {
    return { canonical: s, tierGroup: "STATE_UNIV_POLYTECHNIC" }
  }

  // Provincial Universities
  if (/saint louis university|slu/i.test(s)) {
    return { canonical: "Saint Louis University", tierGroup: "PROVINCIAL_UNIV" }
  }
  if (/san carlos|usc/i.test(s)) {
    return {
      canonical: "University of San Carlos",
      tierGroup: "PROVINCIAL_UNIV",
    }
  }
  if (/silliman/i.test(s)) {
    return { canonical: "Silliman University", tierGroup: "PROVINCIAL_UNIV" }
  }
  if (/xavier/i.test(s)) {
    return { canonical: "Xavier University", tierGroup: "PROVINCIAL_UNIV" }
  }

  // Private Metro
  if (/mapua/i.test(s))
    return { canonical: "Mapua University", tierGroup: "PRIVATE_METRO" }
  if (/far eastern university|feu/i.test(s))
    return { canonical: "FEU", tierGroup: "PRIVATE_METRO" }
  if (/university of the east|ue/i.test(s))
    return { canonical: "UE", tierGroup: "PRIVATE_METRO" }
  if (/san beda/i.test(s))
    return { canonical: "San Beda University", tierGroup: "PRIVATE_METRO" }
  if (/miriam/i.test(s))
    return { canonical: "Miriam College", tierGroup: "PRIVATE_METRO" }
  if (/iacademy/i.test(s))
    return { canonical: "iACADEMY", tierGroup: "PRIVATE_METRO" }
  if (/asia pacific college|apc/i.test(s))
    return { canonical: "Asia Pacific College", tierGroup: "PRIVATE_METRO" }
  if (/adamson/i.test(s))
    return { canonical: "Adamson University", tierGroup: "PRIVATE_METRO" }
  if (/centro escolar|ceu/i.test(s))
    return { canonical: "CEU", tierGroup: "PRIVATE_METRO" }

  return { canonical: s, tierGroup: "UNKNOWN" }
}

// Work scope classifier
export function classifyWorkScope(text: string, monthlyPay: number): WorkScope {
  const s = text.toLowerCase()

  // Overseas OFW
  if (
    /\b(ofw|overseas|singapore|dubai|uae|japan|qatar|saudi|canada|australia|kuwait|taiwan|expat)\b/i.test(
      s
    ) ||
    /\b(sgd|aed|jpy|cad|aud|eur|gbp)\b/i.test(s)
  ) {
    return "OVERSEAS_OFW"
  }

  // Foreign Remote
  if (
    /\b(remote|us client|uk client|foreign client|upwork|freelance|offshore|direct client|wfh foreign)\b/i.test(
      s
    ) ||
    /\b(usd|\$)/i.test(s)
  ) {
    return "FOREIGN_REMOTE"
  }

  // High earner PH outlier
  if (monthlyPay >= 300000) {
    return "LIKELY_REMOTE_INTL"
  }

  return "PH_LOCAL"
}

// Classifies industry and role into 2-tier canonical taxonomy
export function classifyTaxonomy(
  rawRole: string,
  rawIndustry: string
): { macroIndustry: MacroIndustry; roleFamily: string } {
  const combined = `${rawRole} ${rawIndustry}`.toLowerCase()

  // 1. TECH_IT
  if (
    /\b(software|developer|programmer|frontend|backend|fullstack|web dev|ios|android|mobile dev|devops|sre|cloud|sysadmin|data analyst|data scientist|data engineer|qa|tester|quality assurance|cyber|infosec|ui\/ux|ux designer|product designer|tech lead|scrum master|it support|helpdesk|network engineer|systems analyst|database)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Software Engineering"
    if (/\b(qa|quality assurance|tester|testing)\b/i.test(combined)) {
      roleFamily = "Quality Assurance & Testing"
    } else if (/\b(ui|ux|product design|web design)\b/i.test(combined)) {
      roleFamily = "UI/UX Design"
    } else if (
      /\b(data analyst|data science|data scientist|data engineer|bi analyst|business intelligence)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Data Science & Analytics"
    } else if (/\b(devops|cloud|sre|infrastructure)\b/i.test(combined)) {
      roleFamily = "DevOps & Cloud"
    } else if (
      /\b(it support|helpdesk|desktop support|tech support|network admin)\b/i.test(
        combined
      )
    ) {
      roleFamily = "IT Support & Sysadmin"
    } else if (/\b(security|infosec|cyber)\b/i.test(combined)) {
      roleFamily = "Cyber Security"
    } else if (
      /\b(product manager|product owner|associate product manager)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Product Management"
    }
    return { macroIndustry: "TECH_IT", roleFamily }
  }

  // 2. FINANCE_BANKING
  if (
    /\b(bank|banking|fintech|finance|accounting|accountant|audit|auditor|cpa|trader|trading|investment|underwriting|actuary|credit analyst|teller|wealth)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Financial Analysis & Planning"
    if (
      /\b(audit|auditor|accounting|accountant|cpa|bookkeeper|tax)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Accounting & Audit"
    } else if (
      /\b(trader|trading|investment|equity|portfolio|broker)\b/i.test(combined)
    ) {
      roleFamily = "Investment Banking & Trading"
    } else if (/\b(compliance|risk|aml)\b/i.test(combined)) {
      roleFamily = "Risk & Compliance"
    } else if (/\b(branch|teller|loan|credit)\b/i.test(combined)) {
      roleFamily = "Commercial Banking & Lending"
    }
    return { macroIndustry: "FINANCE_BANKING", roleFamily }
  }

  // 3. FMCG_RETAIL
  if (
    /\b(fmcg|retail|merchandis|store|e-commerce|ecommerce|supermarket|sales representative|account executive|brand assistant|brand manager|procurement|supply chain)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Brand & Product Marketing"
    if (
      /\b(sales|account executive|business development|b2b)\b/i.test(combined)
    ) {
      roleFamily = "Sales & Account Management"
    } else if (/\b(e-commerce|ecommerce|shopee|lazada)\b/i.test(combined)) {
      roleFamily = "E-Commerce & Merchandising"
    } else if (
      /\b(supply chain|logistics|procurement|buyer)\b/i.test(combined)
    ) {
      roleFamily = "Supply Chain & Procurement"
    } else if (
      /\b(store|branch manager|cashier|retail operations)\b/i.test(combined)
    ) {
      roleFamily = "Retail Store Operations"
    }
    return { macroIndustry: "FMCG_RETAIL", roleFamily }
  }

  // 4. BPO_SHARED_SERVICES
  if (
    /\b(bpo|call center|customer service|csr|tsr|contact center|shared services|teleperformance|concentrix|accenture|alorica)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Customer Support & Service"
    if (/\b(technical support|tsr)\b/i.test(combined)) {
      roleFamily = "Technical Support"
    } else if (
      /\b(team lead|supervisor|operations manager|sme)\b/i.test(combined)
    ) {
      roleFamily = "Operations & Team Leadership"
    } else if (/\b(moderator|content moderation)\b/i.test(combined)) {
      roleFamily = "Content Moderation"
    } else if (/\b(qa|quality analyst)\b/i.test(combined)) {
      roleFamily = "Quality Assurance (BPO)"
    }
    return { macroIndustry: "BPO_SHARED_SERVICES", roleFamily }
  }

  // 5. ENGINEERING_CONSTRUCTION
  if (
    /\b(civil engineer|structural|construction|architect|architecture|mechanical engineer|electrical engineer|cad|draftsman|site engineer|project engineer|contractor)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Civil & Structural Engineering"
    if (/\b(electrical|electronics|mechanical)\b/i.test(combined)) {
      roleFamily = "Electrical & Mechanical Engineering"
    } else if (
      /\b(architect|architecture|interior design|cad|drafting)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Architecture & Drafting"
    } else if (
      /\b(project engineer|project manager|construction manager)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Project Management (Construction)"
    }
    return { macroIndustry: "ENGINEERING_CONSTRUCTION", roleFamily }
  }

  // 6. MEDIA_ADVERTISING
  if (
    /\b(advertising|media|graphic design|creative|copywriter|copywriting|artist|animator|video editor|videographer|multimedia|pr|public relations|journalism|communications)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Graphic Design & Multimedia"
    if (
      /\b(copywriter|writer|editor|content creator|journalist)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Content Writing & Copywriting"
    } else if (
      /\b(video|animator|animation|producer|director|videographer)\b/i.test(
        combined
      )
    ) {
      roleFamily = "Video Production & Animation"
    } else if (
      /\b(pr|public relations|corporate communications)\b/i.test(combined)
    ) {
      roleFamily = "Public Relations & Communications"
    } else if (/\b(media planner|buyer|digital ads|seo)\b/i.test(combined)) {
      roleFamily = "Media Planning & Buying"
    }
    return { macroIndustry: "MEDIA_ADVERTISING", roleFamily }
  }

  // 7. GOVERNMENT_PUBLIC_SECTOR
  if (
    /\b(government|public sector|civil service|ngo|gov|bureau|department of|senate|congress|court|judiciary|attorney|legal|lawyer)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Public Administration & Policy"
    if (/\b(legal|attorney|lawyer|judge|court|paralegal)\b/i.test(combined)) {
      roleFamily = "Legal & Judicial"
    } else if (/\b(foreign affairs|diplomat|consul|dfa)\b/i.test(combined)) {
      roleFamily = "Foreign Service & Diplomatic"
    }
    return { macroIndustry: "GOVERNMENT_PUBLIC_SECTOR", roleFamily }
  }

  // 8. EDUCATION_ACADEME
  if (
    /\b(education|academe|teacher|teaching|instructor|professor|faculty|academic|lecturer|school|university|deped|ched)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Teaching & Instruction"
    if (/\b(researcher|research assistant|fellow)\b/i.test(combined)) {
      roleFamily = "Academic Research"
    }
    return { macroIndustry: "EDUCATION_ACADEME", roleFamily }
  }

  // 9. HEALTHCARE_PHARMA
  if (
    /\b(health|hospital|clinic|nurse|nursing|doctor|physician|pharma|pharmacy|pharmacist|medtech|medical|physical therapist|dentist)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Nursing & Clinical Care"
    if (/\b(doctor|physician|resident|medical officer)\b/i.test(combined)) {
      roleFamily = "Medical Doctor & Specialist"
    } else if (/\b(pharma|pharmacist|pharmacology)\b/i.test(combined)) {
      roleFamily = "Pharmacy & Pharmacology"
    } else if (/\b(medtech|laboratory|therapist)\b/i.test(combined)) {
      roleFamily = "Allied Health & Medical Tech"
    }
    return { macroIndustry: "HEALTHCARE_PHARMA", roleFamily }
  }

  // 10. CONSULTING_MARKET_RESEARCH
  if (
    /\b(consulting|consultant|market research|nielsen|mckinsey|bcg|bain|research associate|research executive)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Strategy & Management Consulting"
    if (/\b(market research|consumer research|survey)\b/i.test(combined)) {
      roleFamily = "Market & Consumer Research"
    } else if (/\b(business analyst|process)\b/i.test(combined)) {
      roleFamily = "Business Analysis"
    }
    return { macroIndustry: "CONSULTING_MARKET_RESEARCH", roleFamily }
  }

  // 11. MANUFACTURING_LOGISTICS
  if (
    /\b(manufacturing|factory|plant|production|logistics|freight|warehouse|inventory|shipping|supply chain management)\b/i.test(
      combined
    )
  ) {
    let roleFamily = "Plant & Production Engineering"
    if (/\b(warehouse|inventory|logistics|freight)\b/i.test(combined)) {
      roleFamily = "Warehouse & Logistics"
    } else if (/\b(quality control|qc)\b/i.test(combined)) {
      roleFamily = "Quality Control & Assurance"
    }
    return { macroIndustry: "MANUFACTURING_LOGISTICS", roleFamily }
  }

  // Default OTHER
  let roleFamily = "General Business & Operations"
  if (
    /\b(hr|human resources|recruiter|recruitment|talent acquisition)\b/i.test(
      combined
    )
  ) {
    roleFamily = "Human Resources & Talent Acquisition"
  } else if (/\b(admin|assistant|office|secretary)\b/i.test(combined)) {
    roleFamily = "General Administration"
  } else if (/\b(management trainee|trainee|mt)\b/i.test(combined)) {
    roleFamily = "Management Trainee"
  }

  return { macroIndustry: "OTHER", roleFamily }
}

// Maps numeric YOE to seniority band
export function mapSeniorityBand(yoe: number): SeniorityBand {
  if (yoe <= 0.5) return "ENTRY_0"
  if (yoe <= 2.5) return "JUNIOR_1_2"
  if (yoe <= 5.5) return "MID_3_5"
  if (yoe <= 9.5) return "SENIOR_6_9"
  return "STAFF_LEAD_10_PLUS"
}

// Parse benefits text into structured BenefitBreakdown
export function parseBenefits(
  monthlyStr: string,
  annualStr: string,
  workScope: WorkScope
): BenefitBreakdown {
  const combined = `${monthlyStr || ""} ${annualStr || ""}`

  // Guaranteed months (default 13 for PH_LOCAL, 12 for remote)
  let guaranteedMonths = workScope === "FOREIGN_REMOTE" ? 12 : 13
  const monthMatch = combined.match(/(\d{2})(?:th|st|nd|rd)?\s*month/i)
  if (monthMatch) {
    const m = parseInt(monthMatch[1], 10)
    if (m >= 13 && m <= 18) {
      guaranteedMonths = m
    }
  }

  // Allowance (monthly)
  let monthlyAllowancePhp = 0
  const allowMatch = combined.match(
    /(?:allowance|rice|meal|de minimis)[^0-9]*(\d[\d,]*)/i
  )
  if (allowMatch) {
    const val = parseFloat(allowMatch[1].replace(/,/g, ""))
    if (val > 0 && val < 50000) {
      monthlyAllowancePhp = val
    }
  }

  // HMO Coverage
  let hmoCoveragePhp: number | null = null
  const hmoMatch = combined.match(/hmo[^0-9]*(\d[\d,]*(?:\.\d+)?)\s*(k|m)?/i)
  if (hmoMatch) {
    let val = parseFloat(hmoMatch[1].replace(/,/g, ""))
    const unit = hmoMatch[2]?.toLowerCase()
    if (unit === "k") val *= 1000
    if (unit === "m") val *= 1000000
    if (val >= 50000 && val <= 2000000) {
      hmoCoveragePhp = val
    }
  }

  // Vacation leave days
  let vacationLeaveDays: number | null = null
  const leaveMatch = combined.match(
    /(\d+)\s*(?:day|days)?\s*(?:vacation|vl|paid leave|leaves?)/i
  )
  if (leaveMatch) {
    const days = parseInt(leaveMatch[1], 10)
    if (days >= 5 && days <= 60) {
      vacationLeaveDays = days
    }
  }

  const rawBenefitsSummary = combined.trim() || null

  return {
    guaranteedMonths,
    monthlyAllowancePhp,
    hmoCoveragePhp,
    vacationLeaveDays,
    rawBenefitsSummary,
  }
}

// Clean and normalize gender
function normalizeGender(raw: string | undefined): Gender {
  if (!raw) return "UNDISCLOSED"
  const s = raw.toLowerCase().trim()
  if (s.startsWith("f") || s.includes("wom")) return "FEMALE"
  if (s.startsWith("m")) return "MALE"
  if (s.includes("non") || s.includes("queer") || s.includes("other"))
    return "NON_BINARY_OTHER"
  return "UNDISCLOSED"
}

// MAIN ETL RUNNER
export function runETL() {
  console.log("Starting Filipino Compensation ETL Pipeline...")

  const records: CareerRecord[] = []
  let recordId = 1

  // 1. Ingest Liyab First Pay Survey
  const liyabPath = path.resolve("data/raw/liyab-first-pay.csv")
  if (fs.existsSync(liyabPath)) {
    console.log("Processing Liyab First Pay Survey...")
    const content = fs.readFileSync(liyabPath, "utf8")
    const rows = parseCSV(content)

    // Liyab headers are at row index 2, data begins at row index 3
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length < 5) continue

      const [
        ,
        rawYear,
        rawIndustry,
        rawRole,
        rawSalary,
        rawSchool,
        rawGender,
        rawNegotiated,
        rawContext,
      ] = row

      const salary = parseSalary(rawSalary)
      // Skip records without parseable salary for quantitative entry
      if (!salary) continue

      let cohortYear = parseInt(rawYear?.trim(), 10)
      if (isNaN(cohortYear) || cohortYear < 2000 || cohortYear > 2026) {
        // Fall back to form timestamp year or 2020
        cohortYear = 2020
      }

      const { macroIndustry, roleFamily } = classifyTaxonomy(
        rawRole || "",
        rawIndustry || ""
      )
      const { canonical: schoolCanonical, tierGroup: schoolTierGroup } =
        normalizeUniversity(rawSchool)
      const workScope = classifyWorkScope(
        `${rawRole} ${rawIndustry} ${rawContext || ""}`,
        salary.median
      )
      const gender = normalizeGender(rawGender)
      const negotiatedOffer = /^yes/i.test(rawNegotiated?.trim())

      const benefits: BenefitBreakdown = {
        guaranteedMonths: workScope === "FOREIGN_REMOTE" ? 12 : 13,
        monthlyAllowancePhp: 0,
        hmoCoveragePhp: null,
        vacationLeaveDays: null,
        rawBenefitsSummary: rawContext?.trim() || null,
      }

      const candidate = {
        id: `liyab-${recordId++}`,
        sourceSheet: "LIYAB_FIRST_PAY" as const,
        cohortYear,
        macroIndustry,
        roleFamily,
        rawTitle: (rawRole || "Associate").trim(),
        yoeYears: 0,
        seniorityBand: "ENTRY_0" as const,
        workScope,
        nominalMonthlyGrossPhp: salary,
        negotiatedOffer,
        schoolCanonical,
        schoolTierGroup,
        gender,
        benefits,
        mentorAdviceQuote: rawContext?.trim() || null,
      }

      const parsed = CareerRecordSchema.safeParse(candidate)
      if (parsed.success) {
        records.push(parsed.data)
      }
    }
    console.log(`Ingested ${records.length} records from Liyab First Pay.`)
  }

  // 2. Ingest Career Path Information Sheet
  const cpiPath = path.resolve("data/raw/career-path-info.csv")
  if (fs.existsSync(cpiPath)) {
    console.log("Processing Career Path Information Sheet...")
    const content = fs.readFileSync(cpiPath, "utf8")
    const rows = parseCSV(content)

    let cpiCount = 0
    // Row 0 is header
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row || row.length < 2) continue

      const [
        ,
        rawOccupation,
        rawSalary,
        rawMonthlyBenefits,
        rawAnnualBenefits,
        rawQuote,
        rawYoe,
        rawSchool,
        rawCompany,
      ] = row

      const salary = parseSalary(rawSalary)
      const quote = rawQuote?.trim() || null

      // Drop only if BOTH salary is unparseable AND quote is empty
      if (!salary && !quote) continue

      // Parse YOE
      let yoe = 0
      if (rawYoe && rawYoe.trim() !== "") {
        const parsedYoe = parseFloat(rawYoe.trim().replace(/[^0-9.]/g, ""))
        if (!isNaN(parsedYoe) && parsedYoe >= 0 && parsedYoe < 50) {
          yoe = parsedYoe
        }
      }

      const cohortYear = 2018 // Default timestamp year for Sheet 2
      const { macroIndustry, roleFamily } = classifyTaxonomy(
        rawOccupation || "",
        ""
      )
      const { canonical: schoolCanonical, tierGroup: schoolTierGroup } =
        normalizeUniversity(rawSchool)
      const workScope = classifyWorkScope(
        `${rawOccupation} ${rawCompany || ""} ${rawQuote || ""}`,
        salary?.median || 0
      )
      const benefits = parseBenefits(
        rawMonthlyBenefits,
        rawAnnualBenefits,
        workScope
      )

      const candidate = {
        id: `cpi-${recordId++}`,
        sourceSheet: "CAREER_PATH_INFO" as const,
        cohortYear,
        macroIndustry,
        roleFamily,
        rawTitle: (rawOccupation || "Professional").trim(),
        yoeYears: yoe,
        seniorityBand: mapSeniorityBand(yoe),
        workScope,
        nominalMonthlyGrossPhp: salary || { min: 0, median: 0, max: 0 },
        negotiatedOffer: null,
        schoolCanonical,
        schoolTierGroup,
        gender: "UNDISCLOSED" as const,
        benefits,
        mentorAdviceQuote: quote,
      }

      const parsed = CareerRecordSchema.safeParse(candidate)
      if (parsed.success) {
        records.push(parsed.data)
        cpiCount++
      }
    }
    console.log(`Ingested ${cpiCount} records from Career Path Info.`)
  }

  // 3. Write compiled records to public/data/records.json
  const outDir = path.resolve("public/data")
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const outPath = path.join(outDir, "records.json")
  fs.writeFileSync(outPath, JSON.stringify(records, null, 2), "utf8")

  console.log(
    `✅ Success! Generated ${records.length} canonical records at: ${outPath}`
  )
}

if ((import.meta as unknown as { main: boolean }).main) {
  runETL()
}
