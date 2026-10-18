"use client"

import React from "react"
import {
  FilterState,
  MacroIndustry,
  SeniorityBand,
  WorkScope,
} from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { IconSearch, IconAdjustmentsHorizontal } from "@tabler/icons-react"

interface FilterBarProps {
  filter: FilterState
  onChange: (next: FilterState) => void
  totalCount: number
  filteredCount: number
}

const INDUSTRIES: { label: string; value: MacroIndustry | "ALL" }[] = [
  { label: "All Macro Industries", value: "ALL" },
  { label: "Tech & IT", value: "TECH_IT" },
  { label: "Finance & Banking", value: "FINANCE_BANKING" },
  { label: "FMCG & Retail", value: "FMCG_RETAIL" },
  { label: "BPO & Shared Services", value: "BPO_SHARED_SERVICES" },
  { label: "Engineering & Construction", value: "ENGINEERING_CONSTRUCTION" },
  { label: "Media & Creative", value: "MEDIA_ADVERTISING" },
  { label: "Government & Public", value: "GOVERNMENT_PUBLIC_SECTOR" },
  { label: "Education & Academe", value: "EDUCATION_ACADEME" },
  { label: "Healthcare & Pharma", value: "HEALTHCARE_PHARMA" },
  {
    label: "Consulting & Market Research",
    value: "CONSULTING_MARKET_RESEARCH",
  },
  { label: "Manufacturing & Logistics", value: "MANUFACTURING_LOGISTICS" },
  { label: "General Business & Other", value: "OTHER" },
]

const SENIORITIES: { label: string; value: SeniorityBand | "ALL" }[] = [
  { label: "All Seniority Bands", value: "ALL" },
  { label: "0 YOE (Entry Level)", value: "ENTRY_0" },
  { label: "1–2 YOE (Junior)", value: "JUNIOR_1_2" },
  { label: "3–5 YOE (Mid-Level)", value: "MID_3_5" },
  { label: "6–9 YOE (Senior)", value: "SENIOR_6_9" },
  { label: "10+ YOE (Staff / Lead)", value: "STAFF_LEAD_10_PLUS" },
]

const SCOPES: { label: string; value: WorkScope }[] = [
  { label: "PH Local", value: "PH_LOCAL" },
  { label: "Foreign Remote", value: "FOREIGN_REMOTE" },
  { label: "Likely Remote (High Earner)", value: "LIKELY_REMOTE_INTL" },
  { label: "Overseas (OFW)", value: "OVERSEAS_OFW" },
]

export function FilterBar({
  filter,
  onChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = React.useState(filter.searchQuery || "")

  React.useEffect(() => {
    setSearchInput(filter.searchQuery || "")
  }, [filter.searchQuery])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filter.searchQuery || "")) {
        onChange({ ...filter, searchQuery: searchInput })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [searchInput, filter, onChange])

  const toggleScope = (scope: WorkScope) => {
    const exists = filter.workScopes.includes(scope)
    const nextScopes = exists
      ? filter.workScopes.filter((s) => s !== scope)
      : [...filter.workScopes, scope]
    if (nextScopes.length > 0) {
      onChange({ ...filter, workScopes: nextScopes })
    }
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border/80 bg-background/95 px-4 py-3 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Search & Select Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search title, school, or skill..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-48 rounded-md border border-input bg-background pr-3 pl-8 text-xs placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-hidden sm:w-60"
            />
          </div>

          <div className="w-48 sm:w-56">
            <Select
              value={filter.macroIndustry || "ALL"}
              onValueChange={(val) =>
                onChange({
                  ...filter,
                  macroIndustry: (val as MacroIndustry | "ALL") || "ALL",
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Macro Industries" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem
                    key={ind.value}
                    value={ind.value}
                    className="text-xs"
                  >
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44 sm:w-52">
            <Select
              value={filter.seniorityBand || "ALL"}
              onValueChange={(val) =>
                onChange({
                  ...filter,
                  seniorityBand: (val as SeniorityBand | "ALL") || "ALL",
                })
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Seniority Bands" />
              </SelectTrigger>
              <SelectContent>
                {SENIORITIES.map((sen) => (
                  <SelectItem
                    key={sen.value}
                    value={sen.value}
                    className="text-xs"
                  >
                    {sen.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Work Scope Badges & Analytical Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Work Scopes */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 p-1">
            {SCOPES.map((sc) => {
              const active = filter.workScopes.includes(sc.value)
              return (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => toggleScope(sc.value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sc.label}
                </button>
              )
            })}
          </div>

          {/* CPI 2026 Toggle */}
          <button
            type="button"
            onClick={() =>
              onChange({ ...filter, cpiAdjusted: !filter.cpiAdjusted })
            }
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-all ${
              filter.cpiAdjusted
                ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.cpiAdjusted ? "✓ 2026 CPI Adjusted" : "Nominal Rates"}
          </button>

          {/* Net Parity Toggle */}
          <button
            type="button"
            onClick={() =>
              onChange({ ...filter, takeHomeParity: !filter.takeHomeParity })
            }
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-all ${
              filter.takeHomeParity
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.takeHomeParity ? "✓ Net Take-Home" : "Gross Monthly Base"}
          </button>

          <Badge variant="secondary" className="ml-1 font-mono text-[11px]">
            {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}{" "}
            rows
          </Badge>
        </div>
      </div>
    </div>
  )
}
