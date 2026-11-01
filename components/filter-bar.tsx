"use client"

import React from "react"
import type {
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  IconSearch,
  IconBuilding,
  IconBriefcase,
  IconReceipt2,
  IconTrendingUp,
  IconRotateClockwise,
  IconAdjustmentsHorizontal,
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
  { label: "All Experience", value: "ALL" },
  { label: "0 YOE (Entry)", value: "ENTRY_0" },
  { label: "1-2 YOE (Junior)", value: "JUNIOR_1_2" },
  { label: "3-5 YOE (Mid-Level)", value: "MID_3_5" },
  { label: "6-9 YOE (Senior)", value: "SENIOR_6_9" },
  { label: "10+ YOE (Staff/Lead)", value: "STAFF_LEAD_10_PLUS" },
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
  { label: "PH Local Corporate", value: "PH_LOCAL" },
  { label: "Foreign Remote Contractor", value: "FOREIGN_REMOTE" },
  { label: "Likely Remote (High Earner)", value: "LIKELY_REMOTE_INTL" },
  { label: "Overseas (OFW)", value: "OVERSEAS_OFW" },
]

const DEFAULT_SCOPES_KEY = "FOREIGN_REMOTE,PH_LOCAL"

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

  const scopesModified =
    [...filter.workScopes].sort().join(",") !== DEFAULT_SCOPES_KEY

  const extraFilterCount =
    (filter.roleFamily && filter.roleFamily !== "ALL" ? 1 : 0) +
    (filter.schoolTier && filter.schoolTier !== "ALL" ? 1 : 0) +
    (scopesModified ? 1 : 0)

  const isFiltered =
    Boolean(filter.searchQuery) ||
    filter.macroIndustry !== "ALL" ||
    filter.seniorityBand !== "ALL" ||
    extraFilterCount > 0 ||
    !filter.cpiAdjusted ||
    filter.takeHomeParity

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
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
        {/* Primary Inline Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:flex-nowrap">
          <div className="relative min-w-[170px] flex-1 sm:max-w-56">
            <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              aria-label="Search job title, university, or skill"
              placeholder="Search role, school, skill..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 bg-card pr-2.5 pl-8 text-xs"
            />
          </div>

          <div className="w-40 sm:w-44">
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
              <SelectTrigger className="h-8 w-full gap-1.5 bg-card text-xs">
                <IconBuilding className="size-3.5 shrink-0 text-muted-foreground" />
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

          <div className="w-38 sm:w-42">
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
              <SelectTrigger className="h-8 w-full gap-1.5 bg-card text-xs">
                <IconBriefcase className="size-3.5 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="All Experience" />
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

          {/* Secondary Facets Popover */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="default"
                  aria-label="More Filters"
                  className="h-8 gap-1.5 bg-card px-2.5 text-xs"
                />
              }
            >
              <IconAdjustmentsHorizontal className="size-3.5 text-muted-foreground" />
              <span>More Filters</span>
              {extraFilterCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-0.5 h-4 min-w-4 px-1 font-mono text-[10px]"
                >
                  {extraFilterCount}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent align="start" className="w-76 space-y-3.5 p-3.5">
              {roleFamilies.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-foreground">
                    Role Family
                  </label>
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
                    <SelectTrigger className="h-8 w-full bg-background text-xs">
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

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">
                  University Tier
                </label>
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
                  <SelectTrigger className="h-8 w-full bg-background text-xs">
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

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">
                    Employment Scope
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Min 1 active
                  </span>
                </div>
                <div className="space-y-1.5">
                  {SCOPES.map((sc) => {
                    const checked = filter.workScopes.includes(sc.value)
                    return (
                      <label
                        key={sc.value}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-muted/60"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleScope(sc.value)}
                        />
                        <span className="text-foreground">{sc.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <IconRotateClockwise className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Economic Toggles & Sample Count */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              title="Adjust compensation to 2026 purchasing power using PSA CPI (134.5)"
              aria-label="Adjust compensation to 2026 purchasing power using PSA CPI"
              aria-pressed={filter.cpiAdjusted}
              onClick={() =>
                onChange({ ...filter, cpiAdjusted: !filter.cpiAdjusted })
              }
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filter.cpiAdjusted
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconTrendingUp className="size-3" />
              <span>{filter.cpiAdjusted ? "2026 CPI" : "Nominal"}</span>
            </button>
            <button
              type="button"
              title="Estimate monthly net take-home pay after TRAIN tax and statutory deductions"
              aria-label="Estimate monthly net take-home pay after TRAIN tax and statutory deductions"
              aria-pressed={filter.takeHomeParity}
              onClick={() =>
                onChange({ ...filter, takeHomeParity: !filter.takeHomeParity })
              }
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filter.takeHomeParity
                  ? "bg-accent text-accent-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconReceipt2 className="size-3" />
              <span>{filter.takeHomeParity ? "Net Pay" : "Gross"}</span>
            </button>
          </div>

          <div className="rounded-lg border border-border/80 bg-card px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filteredCount.toLocaleString()}
            </span>
            <span className="text-muted-foreground/70">
              {" / "}
              {totalCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
