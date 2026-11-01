"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FilterState, MacroIndustry, SeniorityBand, SchoolTierGroup, WorkScope } from "@/lib/types"

const DEFAULT_FILTERS: FilterState = {
  macroIndustry: "ALL",
  roleFamily: "ALL",
  seniorityBand: "ALL",
  workScopes: ["PH_LOCAL", "FOREIGN_REMOTE"],
  cpiAdjusted: true,
  takeHomeParity: false,
  schoolTier: "ALL",
  searchQuery: "",
}

export type DashboardTab = "curves" | "arbitrage" | "schools" | "auditor"
const VALID_TABS: DashboardTab[] = ["curves", "arbitrage", "schools", "auditor"]

export function useDashboardFilterParams(): [
  FilterState,
  (updater: FilterState | ((prev: FilterState) => FilterState)) => void,
  DashboardTab,
  (nextTab: DashboardTab) => void
] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = useMemo<DashboardTab>(() => {
    const t = searchParams.get("tab") as DashboardTab | null
    return t && VALID_TABS.includes(t) ? t : "curves"
  }, [searchParams])

  const setActiveTab = useCallback(
    (nextTab: DashboardTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextTab === "curves") {
        params.delete("tab")
      } else {
        params.set("tab", nextTab)
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const filter = useMemo<FilterState>(() => {
    const q = searchParams.get("q") ?? ""
    const industry = searchParams.get("industry") ?? "ALL"
    const seniority = searchParams.get("seniority") ?? "ALL"
    const schoolTier = searchParams.get("schoolTier") ?? "ALL"
    const roleFamily = searchParams.get("roleFamily") ?? "ALL"

    const cpiParam = searchParams.get("cpi")
    const cpiAdjusted = cpiParam !== null ? cpiParam === "true" || cpiParam === "1" : DEFAULT_FILTERS.cpiAdjusted

    const parityParam = searchParams.get("parity")
    const takeHomeParity = parityParam !== null ? parityParam === "true" || parityParam === "1" : DEFAULT_FILTERS.takeHomeParity

    const scopesParam = searchParams.get("scopes")
    let workScopes = DEFAULT_FILTERS.workScopes
    if (scopesParam) {
      const parsed = scopesParam.split(",").filter(Boolean) as WorkScope[]
      if (parsed.length > 0) {
        workScopes = parsed
      }
    }

    return {
      searchQuery: q,
      macroIndustry: industry as MacroIndustry | "ALL",
      roleFamily,
      seniorityBand: seniority as SeniorityBand | "ALL",
      workScopes,
      cpiAdjusted,
      takeHomeParity,
      schoolTier: schoolTier as SchoolTierGroup | "ALL",
    }
  }, [searchParams])

  const setFilter = useCallback(
    (updater: FilterState | ((prev: FilterState) => FilterState)) => {
      const next = typeof updater === "function" ? updater(filter) : updater
      const params = new URLSearchParams()
      const currentTab = searchParams.get("tab")
      if (currentTab) {
        params.set("tab", currentTab)
      }

      if (next.searchQuery.trim()) {
        params.set("q", next.searchQuery.trim())
      }
      if (next.macroIndustry && next.macroIndustry !== "ALL") {
        params.set("industry", next.macroIndustry)
      }
      if (next.seniorityBand && next.seniorityBand !== "ALL") {
        params.set("seniority", next.seniorityBand)
      }
      if (next.schoolTier && next.schoolTier !== "ALL") {
        params.set("schoolTier", next.schoolTier)
      }
      if (next.roleFamily && next.roleFamily !== "ALL") {
        params.set("roleFamily", next.roleFamily)
      }
      if (next.cpiAdjusted !== DEFAULT_FILTERS.cpiAdjusted) {
        params.set("cpi", String(next.cpiAdjusted))
      }
      if (next.takeHomeParity !== DEFAULT_FILTERS.takeHomeParity) {
        params.set("parity", String(next.takeHomeParity))
      }

      const scopesSorted = [...next.workScopes].sort().join(",")
      const defaultScopesSorted = [...DEFAULT_FILTERS.workScopes].sort().join(",")
      if (scopesSorted !== defaultScopesSorted) {
        params.set("scopes", next.workScopes.join(","))
      }

      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      router.replace(url, { scroll: false })
    },
    [filter, pathname, router, searchParams]
  )

  return [filter, setFilter, activeTab, setActiveTab]
}
