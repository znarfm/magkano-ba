"use client"

import React from "react"
import {
  FilterState,
  MacroIndustry,
  SchoolTierGroup,
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
import { Input } from "@/components/ui/input"
import {
  IconSearch,
  IconBuilding,
  IconBriefcase,
  IconReceipt2,
  IconTrendingUp,
  IconRotateClockwise,
  IconSchool,
  IconUserScan,
} from "@tabler/icons-react"

interface FilterBarProps {
  filter: FilterState
  onChange: (next: FilterState) => void
  totalCount: number
  filteredCount: number
  roleFamilies?: string[]
}

const INDUSTRIES: { label: string; value: MacroIndustry | "ALL" }[] = [
  { label: "All Industries", value: "ALL" },
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
  { label: "All Experience Levels", value: "ALL" },
  { label: "0 YOE · Entry Level", value: "ENTRY_0" },
  { label: "1–2 YOE · Junior", value: "JUNIOR_1_2" },
  { label: "3–5 YOE · Mid-Level", value: "MID_3_5" },
  { label: "6–9 YOE · Senior", value: "SENIOR_6_9" },
  { label: "10+ YOE · Staff / Lead", value: "STAFF_LEAD_10_PLUS" },
]

const SCHOOL_TIERS: { label: string; value: SchoolTierGroup | "ALL" }[] = [
  { label: "All School Tiers", value: "ALL" },
  { label: "UP System", value: "UP_SYSTEM" },
  { label: "ADMU / DLSU / UST", value: "ADMU_DLSU_UST" },
  { label: "State Univ / Poly (PUP/PLM/TUP)", value: "STATE_UNIV_POLYTECHNIC" },
  { label: "Private Metro Manila", value: "PRIVATE_METRO" },
  { label: "Provincial Univ", value: "PROVINCIAL_UNIV" },
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
  roleFamilies = [],
}: FilterBarProps) {
  const roleItems = React.useMemo(
    () => [
      { label: "All Role Families", value: "ALL" },
      ...roleFamilies.map((rf) => ({ label: rf, value: rf })),
    ],
    [roleFamilies]
  )
  const [searchInput, setSearchInput] = React.useState(filter.searchQuery || "")
  const [prevSearchQuery, setPrevSearchQuery] = React.useState(
    filter.searchQuery
  )

  if (filter.searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(filter.searchQuery)
    setSearchInput(filter.searchQuery || "")
  }

  const filterRef = React.useRef(filter)
  React.useEffect(() => {
    filterRef.current = filter
  })

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filterRef.current.searchQuery || "")) {
        onChange({ ...filterRef.current, searchQuery: searchInput })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [searchInput, onChange])

  const toggleScope = (scope: WorkScope) => {
    const exists = filter.workScopes.includes(scope)
    const nextScopes = exists
      ? filter.workScopes.filter((s) => s !== scope)
      : [...filter.workScopes, scope]
    if (nextScopes.length > 0) {
      onChange({ ...filter, workScopes: nextScopes })
    }
  }

  const isFiltered =
    Boolean(filter.searchQuery) ||
    filter.macroIndustry !== "ALL" ||
    filter.roleFamily !== "ALL" ||
    filter.seniorityBand !== "ALL" ||
    filter.schoolTier !== "ALL" ||
    !filter.cpiAdjusted ||
    filter.takeHomeParity ||
    filter.workScopes.length !== 2

  const resetFilters = () => {
    onChange({
      ...filter,
      macroIndustry: "ALL",
      roleFamily: "ALL",
      seniorityBand: "ALL",
      workScopes: ["PH_LOCAL", "FOREIGN_REMOTE"],
      cpiAdjusted: true,
      takeHomeParity: false,
      schoolTier: "ALL",
      searchQuery: "",
    })
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border/80 bg-background/90 px-4 py-2.5 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5">
        {/* Search & Select Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search title, school, or skill..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 w-44 bg-card/60 pr-3 pl-8 text-xs placeholder:text-muted-foreground sm:w-56"
            />
          </div>

          <div className="w-44 sm:w-52">
            <Select
              items={INDUSTRIES}
              value={filter.macroIndustry || "ALL"}
              onValueChange={(val) =>
                onChange({
                  ...filter,
                  macroIndustry: (val as MacroIndustry | "ALL") || "ALL",
                  roleFamily: "ALL",
                })
              }
            >
              <SelectTrigger className="h-8 border-input bg-card/60 text-xs gap-1.5">
                <IconBuilding className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Industries" />
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

          {roleFamilies.length > 0 && (
            <div className="w-44 sm:w-52">
              <Select
                items={roleItems}
                value={filter.roleFamily || "ALL"}
                onValueChange={(val) =>
                  onChange({
                    ...filter,
                    roleFamily: val || "ALL",
                  })
                }
              >
                <SelectTrigger className="h-8 border-input bg-card/60 text-xs gap-1.5">
                  <IconUserScan className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Role Families" />
                </SelectTrigger>
                <SelectContent>
                  {roleItems.map((rf) => (
                    <SelectItem
                      key={rf.value}
                      value={rf.value}
                      className="text-xs"
                    >
                      {rf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="w-40 sm:w-48">
            <Select
              items={SENIORITIES}
              value={filter.seniorityBand || "ALL"}
              onValueChange={(val) =>
                onChange({
                  ...filter,
                  seniorityBand: (val as SeniorityBand | "ALL") || "ALL",
                })
              }
            >
              <SelectTrigger className="h-8 border-input bg-card/60 text-xs gap-1.5">
                <IconBriefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Experience Levels" />
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

          <div className="w-40 sm:w-48">
            <Select
              items={SCHOOL_TIERS}
              value={filter.schoolTier || "ALL"}
              onValueChange={(val) =>
                onChange({
                  ...filter,
                  schoolTier: (val as SchoolTierGroup | "ALL") || "ALL",
                })
              }
            >
              <SelectTrigger className="h-8 border-input bg-card/60 text-xs gap-1.5">
                <IconSchool className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All School Tiers" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_TIERS.map((st) => (
                  <SelectItem
                    key={st.value}
                    value={st.value}
                    className="text-xs"
                  >
                    {st.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Work Scope Badges & Analytical Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Work Scopes Segmented Group */}
          <div className="flex items-center rounded-md border border-border/70 bg-muted/40 p-0.5">
            {SCOPES.map((sc) => {
              const active = filter.workScopes.includes(sc.value)
              return (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => toggleScope(sc.value)}
                  className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sc.label}
                </button>
              )
            })}
          </div>

          {/* Analytical Segmented Group */}
          <div className="flex items-center rounded-md border border-border/70 bg-muted/40 p-0.5">
            <button
              type="button"
              title="Adjust compensation for 2026 inflation using PSA CPI index"
              onClick={() =>
                onChange({ ...filter, cpiAdjusted: !filter.cpiAdjusted })
              }
              className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
                filter.cpiAdjusted
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconTrendingUp className="h-3 w-3" />
              {filter.cpiAdjusted ? "2026 Inflation" : "Nominal"}
            </button>
            <button
              type="button"
              title="Estimate take-home pay after statutory deductions (SSS/PhilHealth/Pag-IBIG) and TRAIN taxes"
              onClick={() =>
                onChange({ ...filter, takeHomeParity: !filter.takeHomeParity })
              }
              className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
                filter.takeHomeParity
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconReceipt2 className="h-3 w-3" />
              {filter.takeHomeParity ? "After Tax" : "Gross"}
            </button>
          </div>

          {/* Reset Filters Action */}
          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card/60 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconRotateClockwise className="h-3 w-3" />
              Reset
            </button>
          )}

          {/* Filtered Record Count */}
          <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredCount.toLocaleString()}
            </span>
            {" / "}
            <span>{totalCount.toLocaleString()} rows</span>
          </div>
        </div>
      </div>
    </div>
  )
}
