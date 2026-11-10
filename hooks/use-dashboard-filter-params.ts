"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  FilterState,
  MacroIndustry,
  SeniorityBand,
  SchoolTierGroup,
  WorkScope,
} from "@/lib/types"

export type TableSortColumn =
  | "salary"
  | "cohortYear"
  | "yoeYears"
  | "rawTitle"
  | "schoolCanonical"

export interface TablePaginationParams {
  sortBy: TableSortColumn
  sortOrder: "asc" | "desc"
  page: number
  pageSize: number
}

const DEFAULT_FILTERS: FilterState = {
  macroIndustry: "ALL",
  roleFamily: "ALL",
  seniorityBand: "ALL",
  workScopes: ["PH_LOCAL", "FOREIGN_REMOTE"],
  cpiAdjusted: true,
  takeHomeParity: false,
  schoolTier: "ALL",
  sourceSheet: "ALL",
  searchQuery: "",
}

const DEFAULT_TABLE_PARAMS: TablePaginationParams = {
  sortBy: "salary",
  sortOrder: "desc",
  page: 1,
  pageSize: 25,
}

export type DashboardTab = "curves" | "arbitrage" | "schools" | "auditor" | "table"
const VALID_TABS: DashboardTab[] = [
  "curves",
  "arbitrage",
  "schools",
  "auditor",
  "table",
]

const VALID_SORT_COLUMNS: TableSortColumn[] = [
  "salary",
  "cohortYear",
  "yoeYears",
  "rawTitle",
  "schoolCanonical",
]

/**
 * Central hook for synchronizing active tab, global dashboard filter facets,
 * and raw data table sorting and pagination parameters with URL search params.
 *
 * @returns A tuple of `[filter, setFilter, activeTab, setActiveTab, tableParams, setTableParams]`.
 */
export function useDashboardFilterParams(): [
  FilterState,
  (updater: FilterState | ((prev: FilterState) => FilterState)) => void,
  DashboardTab,
  (nextTab: DashboardTab) => void,
  TablePaginationParams,
  (
    updater:
      | Partial<TablePaginationParams>
      | ((prev: TablePaginationParams) => Partial<TablePaginationParams>)
  ) => void,
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
    const sourceSheet = searchParams.get("source") ?? "ALL"

    const cpiParam = searchParams.get("cpi")
    const cpiAdjusted =
      cpiParam !== null
        ? cpiParam === "true" || cpiParam === "1"
        : DEFAULT_FILTERS.cpiAdjusted

    const parityParam = searchParams.get("parity")
    const takeHomeParity =
      parityParam !== null
        ? parityParam === "true" || parityParam === "1"
        : DEFAULT_FILTERS.takeHomeParity

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
      sourceSheet: (sourceSheet as FilterState["sourceSheet"]) || "ALL",
    }
  }, [searchParams])

  const tableParams = useMemo<TablePaginationParams>(() => {
    const sortParam = searchParams.get("sort") as TableSortColumn | null
    const sortBy =
      sortParam && VALID_SORT_COLUMNS.includes(sortParam)
        ? sortParam
        : DEFAULT_TABLE_PARAMS.sortBy

    const orderParam = searchParams.get("order")
    const sortOrder: "asc" | "desc" =
      orderParam === "asc" ? "asc" : DEFAULT_TABLE_PARAMS.sortOrder

    const pageParam = searchParams.get("page")
    const pageNum = pageParam ? parseInt(pageParam, 10) : DEFAULT_TABLE_PARAMS.page
    const page =
      Number.isFinite(pageNum) && pageNum > 0
        ? pageNum
        : DEFAULT_TABLE_PARAMS.page

    const sizeParam = searchParams.get("pageSize")
    const sizeNum = sizeParam
      ? parseInt(sizeParam, 10)
      : DEFAULT_TABLE_PARAMS.pageSize
    const pageSize =
      Number.isFinite(sizeNum) && sizeNum > 0
        ? sizeNum
        : DEFAULT_TABLE_PARAMS.pageSize

    return {
      sortBy,
      sortOrder,
      page,
      pageSize,
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
      if (next.sourceSheet && next.sourceSheet !== "ALL") {
        params.set("source", next.sourceSheet)
      }
      if (next.cpiAdjusted !== DEFAULT_FILTERS.cpiAdjusted) {
        params.set("cpi", String(next.cpiAdjusted))
      }
      if (next.takeHomeParity !== DEFAULT_FILTERS.takeHomeParity) {
        params.set("parity", String(next.takeHomeParity))
      }

      const scopesSorted = [...next.workScopes].sort().join(",")
      const defaultScopesSorted = [...DEFAULT_FILTERS.workScopes]
        .sort()
        .join(",")
      if (scopesSorted !== defaultScopesSorted) {
        params.set("scopes", next.workScopes.join(","))
      }

      // Preserve table sort options, but reset page to 1 when filters change
      if (tableParams.sortBy !== DEFAULT_TABLE_PARAMS.sortBy) {
        params.set("sort", tableParams.sortBy)
      }
      if (tableParams.sortOrder !== DEFAULT_TABLE_PARAMS.sortOrder) {
        params.set("order", tableParams.sortOrder)
      }
      if (tableParams.pageSize !== DEFAULT_TABLE_PARAMS.pageSize) {
        params.set("pageSize", String(tableParams.pageSize))
      }
      // Note: page resets to 1 (omitted from URL)

      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      router.replace(url, { scroll: false })
    },
    [filter, pathname, router, searchParams, tableParams]
  )

  const setTableParams = useCallback(
    (
      updater:
        | Partial<TablePaginationParams>
        | ((prev: TablePaginationParams) => Partial<TablePaginationParams>)
    ) => {
      const partial =
        typeof updater === "function" ? updater(tableParams) : updater
      const next = { ...tableParams, ...partial }
      const params = new URLSearchParams(searchParams.toString())

      if (next.sortBy !== DEFAULT_TABLE_PARAMS.sortBy) {
        params.set("sort", next.sortBy)
      } else {
        params.delete("sort")
      }

      if (next.sortOrder !== DEFAULT_TABLE_PARAMS.sortOrder) {
        params.set("order", next.sortOrder)
      } else {
        params.delete("order")
      }

      if (next.page !== DEFAULT_TABLE_PARAMS.page) {
        params.set("page", String(next.page))
      } else {
        params.delete("page")
      }

      if (next.pageSize !== DEFAULT_TABLE_PARAMS.pageSize) {
        params.set("pageSize", String(next.pageSize))
      } else {
        params.delete("pageSize")
      }

      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      router.replace(url, { scroll: false })
    },
    [pathname, router, searchParams, tableParams]
  )

  return [filter, setFilter, activeTab, setActiveTab, tableParams, setTableParams]
}
