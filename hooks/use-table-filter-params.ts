"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { TableQueryOptions } from "@/lib/analytics"

export interface TableFiltersState {
  searchQuery: string
  macroIndustry: string
  seniorityBand: string
  sourceSheet: string
  cpiAdjusted: boolean
  sortBy: NonNullable<TableQueryOptions["sortBy"]>
  sortOrder: "asc" | "desc"
  page: number
  pageSize: number
}

const DEFAULTS: TableFiltersState = {
  searchQuery: "",
  macroIndustry: "ALL",
  seniorityBand: "ALL",
  sourceSheet: "ALL",
  cpiAdjusted: false,
  sortBy: "salary",
  sortOrder: "desc",
  page: 1,
  pageSize: 25,
}

export function useTableFilterParams(): [
  TableFiltersState,
  (updater: Partial<TableFiltersState> | ((prev: TableFiltersState) => Partial<TableFiltersState>)) => void
] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const state = useMemo<TableFiltersState>(() => {
    const q = searchParams.get("q") ?? DEFAULTS.searchQuery
    const industry = searchParams.get("industry") ?? DEFAULTS.macroIndustry
    const seniority = searchParams.get("seniority") ?? DEFAULTS.seniorityBand
    const source = searchParams.get("source") ?? DEFAULTS.sourceSheet

    const cpiParam = searchParams.get("cpi")
    const cpiAdjusted = cpiParam !== null ? cpiParam === "true" || cpiParam === "1" : DEFAULTS.cpiAdjusted

    const sortParam = searchParams.get("sort") as TableQueryOptions["sortBy"] | null
    const validSorts: NonNullable<TableQueryOptions["sortBy"]>[] = [
      "salary",
      "cohortYear",
      "yoeYears",
      "rawTitle",
      "schoolCanonical",
    ]
    const sortBy = sortParam && validSorts.includes(sortParam) ? sortParam : DEFAULTS.sortBy

    const orderParam = searchParams.get("order")
    const sortOrder = orderParam === "asc" ? "asc" : DEFAULTS.sortOrder

    const pageParam = searchParams.get("page")
    const pageNum = pageParam ? parseInt(pageParam, 10) : DEFAULTS.page
    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : DEFAULTS.page

    const sizeParam = searchParams.get("pageSize")
    const sizeNum = sizeParam ? parseInt(sizeParam, 10) : DEFAULTS.pageSize
    const pageSize = Number.isFinite(sizeNum) && sizeNum > 0 ? sizeNum : DEFAULTS.pageSize

    return {
      searchQuery: q,
      macroIndustry: industry,
      seniorityBand: seniority,
      sourceSheet: source,
      cpiAdjusted,
      sortBy,
      sortOrder,
      page,
      pageSize,
    }
  }, [searchParams])

  const setParams = useCallback(
    (updater: Partial<TableFiltersState> | ((prev: TableFiltersState) => Partial<TableFiltersState>)) => {
      const partial = typeof updater === "function" ? updater(state) : updater
      const next = { ...state, ...partial }
      const params = new URLSearchParams()

      if (next.searchQuery.trim()) {
        params.set("q", next.searchQuery.trim())
      }
      if (next.macroIndustry && next.macroIndustry !== DEFAULTS.macroIndustry) {
        params.set("industry", next.macroIndustry)
      }
      if (next.seniorityBand && next.seniorityBand !== DEFAULTS.seniorityBand) {
        params.set("seniority", next.seniorityBand)
      }
      if (next.sourceSheet && next.sourceSheet !== DEFAULTS.sourceSheet) {
        params.set("source", next.sourceSheet)
      }
      if (next.cpiAdjusted !== DEFAULTS.cpiAdjusted) {
        params.set("cpi", String(next.cpiAdjusted))
      }
      if (next.sortBy !== DEFAULTS.sortBy) {
        params.set("sort", next.sortBy)
      }
      if (next.sortOrder !== DEFAULTS.sortOrder) {
        params.set("order", next.sortOrder)
      }
      if (next.page !== DEFAULTS.page) {
        params.set("page", String(next.page))
      }
      if (next.pageSize !== DEFAULTS.pageSize) {
        params.set("pageSize", String(next.pageSize))
      }

      const qs = params.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      router.replace(url, { scroll: false })
    },
    [pathname, router, state]
  )

  return [state, setParams]
}
