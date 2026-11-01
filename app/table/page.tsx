"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import { CareerRecord } from "@/lib/types"
import {
  queryTableRecords,
  exportRecordsToCsv,
  TableQueryOptions,
} from "@/lib/analytics"
import { useTableFilterParams } from "@/hooks/use-table-filter-params"
import { computeCompensationView } from "@/lib/economics"
import { NavigationHeader } from "@/components/navigation-header"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPhp } from "@/lib/utils"
import {
  IconSearch,
  IconDownload,
  IconChevronDown,
  IconChevronRight,
  IconChevronLeft,
  IconMessage2,
  IconGift,
  IconArrowUp,
  IconArrowDown,
  IconTrendingUp,
} from "@tabler/icons-react"

const INDUSTRIES = [
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
  { label: "Consulting & Research", value: "CONSULTING_MARKET_RESEARCH" },
  { label: "Manufacturing & Logistics", value: "MANUFACTURING_LOGISTICS" },
  { label: "Other / General", value: "OTHER" },
]

const SENIORITIES = [
  { label: "All Experience Levels", value: "ALL" },
  { label: "0 YOE (Entry Level)", value: "ENTRY_0" },
  { label: "1–2 YOE (Junior)", value: "JUNIOR_1_2" },
  { label: "3–5 YOE (Mid-Level)", value: "MID_3_5" },
  { label: "6–9 YOE (Senior)", value: "SENIOR_6_9" },
  { label: "10+ YOE (Staff / Lead)", value: "STAFF_LEAD_10_PLUS" },
]

const SOURCES = [
  { label: "All Datasets (4,010)", value: "ALL" },
  { label: "Liyab First Pay (2,942)", value: "LIYAB_FIRST_PAY" },
  { label: "r/phcareers (1,068)", value: "CAREER_PATH_INFO" },
]

function TableContent() {
  const [records, setRecords] = useState<CareerRecord[]>([])
  const [loading, setLoading] = useState(true)

  // URL-synchronized Query State
  const [params, setParams] = useTableFilterParams()
  const {
    searchQuery,
    macroIndustry: industry,
    seniorityBand: seniority,
    sourceSheet,
    cpiAdjusted,
    sortBy,
    sortOrder,
    page,
    pageSize,
  } = params

  // Expandable row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery)

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery)
    setSearchInput(searchQuery)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setParams({ searchQuery: searchInput, page: 1 })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [searchInput, searchQuery, setParams])

  useEffect(() => {
    fetch("/data/records.json")
      .then((res) => res.json())
      .then((data) => {
        setRecords(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load records:", err)
        setLoading(false)
      })
  }, [])

  const queryResult = useMemo(() => {
    return queryTableRecords(records, {
      searchQuery,
      macroIndustry: industry,
      seniorityBand: seniority,
      sourceSheet,
      cpiAdjusted,
      sortBy,
      sortOrder,
      page,
      pageSize,
    })
  }, [
    records,
    searchQuery,
    industry,
    seniority,
    sourceSheet,
    cpiAdjusted,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ])

  const toggleSort = (col: NonNullable<TableQueryOptions["sortBy"]>) => {
    if (sortBy === col) {
      setParams({ sortOrder: sortOrder === "asc" ? "desc" : "asc", page: 1 })
    } else {
      setParams({ sortBy: col, sortOrder: "desc", page: 1 })
    }
  }

  const handleDownloadCsv = () => {
    // Export all matching records for the current filter criteria
    const allFiltered = queryTableRecords(records, {
      searchQuery,
      macroIndustry: industry,
      seniorityBand: seniority,
      sourceSheet,
      cpiAdjusted,
      sortBy,
      sortOrder,
      page: 1,
      pageSize: 100000,
    }).records

    const csvContent = exportRecordsToCsv(allFiltered)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `magkano-ba-filtered-salaries-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <NavigationHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Raw Career Records Data Table
            </h1>
            <p className="text-xs text-muted-foreground">
              Inspect, sort, filter, and export the verified 4,000+ community salary submissions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <IconDownload className="h-3.5 w-3.5" />
              Export Filtered CSV ({queryResult.totalFiltered.toLocaleString()})
            </Button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-border/70 bg-card/60 p-3 shadow-xs">
          <div className="relative min-w-[200px] flex-1">
            <IconSearch className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by job title, university, or advice..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <div className="w-44">
            <Select
              items={INDUSTRIES}
              value={industry}
              onValueChange={(val) => {
                setParams({ macroIndustry: val || "ALL", page: 1 })
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value} className="text-xs">
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-44">
            <Select
              items={SENIORITIES}
              value={seniority}
              onValueChange={(val) => {
                setParams({ seniorityBand: val || "ALL", page: 1 })
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                {SENIORITIES.map((sen) => (
                  <SelectItem key={sen.value} value={sen.value} className="text-xs">
                    {sen.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select
              items={SOURCES}
              value={sourceSheet}
              onValueChange={(val) => {
                setParams({ sourceSheet: val || "ALL", page: 1 })
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Dataset Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((src) => (
                  <SelectItem key={src.value} value={src.value} className="text-xs">
                    {src.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2026 PSA CPI Inflation Toggle (Off by default) */}
          <button
            type="button"
            onClick={() => setParams({ cpiAdjusted: !cpiAdjusted, page: 1 })}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              cpiAdjusted
                ? "border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-xs"
                : "border-border/70 bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
            title="Adjust pay to 2026 inflation using official PSA Consumer Price Index (134.5)"
          >
            <IconTrendingUp className="h-3.5 w-3.5" />
            {cpiAdjusted ? "2026 CPI Adjusted" : "Nominal PHP"}
          </button>
        </div>

        {/* Data Grid Table */}
        <div className="rounded-xl border border-border/80 bg-card/60 shadow-xs backdrop-blur-xs overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold text-xs text-foreground"
                    onClick={() => toggleSort("rawTitle")}
                  >
                    <div className="flex items-center gap-1">
                      Job Title
                      {sortBy === "rawTitle" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <IconArrowDown className="h-3 w-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-foreground">
                    Industry
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold text-xs text-foreground"
                    onClick={() => toggleSort("yoeYears")}
                  >
                    <div className="flex items-center gap-1">
                      YOE / Band
                      {sortBy === "yoeYears" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <IconArrowDown className="h-3 w-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold text-xs text-foreground text-right"
                    onClick={() => toggleSort("salary")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {cpiAdjusted ? "2026 CPI Pay" : "Monthly Gross"}
                      {sortBy === "salary" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <IconArrowDown className="h-3 w-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold text-xs text-foreground"
                    onClick={() => toggleSort("schoolCanonical")}
                  >
                    <div className="flex items-center gap-1">
                      University
                      {sortBy === "schoolCanonical" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <IconArrowDown className="h-3 w-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer font-semibold text-xs text-foreground text-center"
                    onClick={() => toggleSort("cohortYear")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Year
                      {sortBy === "cohortYear" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <IconArrowDown className="h-3 w-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-foreground text-center">
                    Source
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {queryResult.records.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-xs text-muted-foreground"
                    >
                      No records match the current filter selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  queryResult.records.map((r) => {
                    const isExpanded = expandedRowId === r.id
                    return (
                      <React.Fragment key={r.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() =>
                            setExpandedRowId(isExpanded ? null : r.id)
                          }
                        >
                          <TableCell className="w-8 px-2 text-center">
                            {isExpanded ? (
                              <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-xs text-foreground">
                            {r.rawTitle}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.macroIndustry.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {r.yoeYears} YOE · {r.seniorityBand.replace("_0", " (Entry)").replace("_1_2", " (Jr)").replace("_3_5", " (Mid)").replace("_6_9", " (Sr)").replace("_10_PLUS", " (Staff)")}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-xs text-foreground">
                            {formatPhp(
                              cpiAdjusted
                                ? computeCompensationView(r, {
                                    cpiAdjusted: true,
                                    takeHomeParity: false,
                                  })
                                : r.nominalMonthlyGrossPhp.median
                            )}
                            {cpiAdjusted && (
                              <div className="text-[10px] font-normal text-muted-foreground font-mono">
                                nom: {formatPhp(r.nominalMonthlyGrossPhp.median)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.schoolCanonical || "Unspecified"}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {r.cohortYear}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] py-0 font-mono ${
                                r.sourceSheet === "LIYAB_FIRST_PAY"
                                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "border-blue-500/30 text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {r.sourceSheet === "LIYAB_FIRST_PAY"
                                ? "Liyab"
                                : "phcareers"}
                            </Badge>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Details Drawer */}
                        {isExpanded && (
                          <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                            <TableCell colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Benefits breakdown */}
                                <div className="space-y-2 rounded-lg border border-border/70 bg-card p-3">
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <IconGift className="h-4 w-4 text-primary" />
                                    <span>Benefits & Compensation Package</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-muted-foreground">
                                    <div>
                                      Guaranteed Months:{" "}
                                      <span className="font-bold text-foreground">
                                        {r.benefits.guaranteedMonths}
                                      </span>
                                    </div>
                                    <div>
                                      Monthly Allowance:{" "}
                                      <span className="font-bold text-foreground">
                                        {formatPhp(r.benefits.monthlyAllowancePhp)}
                                      </span>
                                    </div>
                                    <div>
                                      HMO Coverage:{" "}
                                      <span className="font-bold text-foreground">
                                        {r.benefits.hmoCoveragePhp
                                          ? formatPhp(r.benefits.hmoCoveragePhp)
                                          : "None / Not specified"}
                                      </span>
                                    </div>
                                    <div>
                                      Vacation Leave:{" "}
                                      <span className="font-bold text-foreground">
                                        {r.benefits.vacationLeaveDays !== null
                                          ? `${r.benefits.vacationLeaveDays} days`
                                          : "Standard"}
                                      </span>
                                    </div>
                                    <div>
                                      Negotiated:{" "}
                                      <span className="font-bold text-foreground">
                                        {r.negotiatedOffer === true
                                          ? "Yes"
                                          : r.negotiatedOffer === false
                                          ? "No"
                                          : "Not Tracked"}
                                      </span>
                                    </div>
                                    <div>
                                      Work Scope:{" "}
                                      <span className="font-bold text-foreground">
                                        {r.workScope.replace(/_/g, " ")}
                                      </span>
                                    </div>
                                  </div>
                                  {r.benefits.rawBenefitsSummary && (
                                    <div className="border-t border-border/60 pt-1 text-[11px] text-muted-foreground">
                                      <em>{r.benefits.rawBenefitsSummary}</em>
                                    </div>
                                  )}
                                </div>

                                {/* Mentor Advice Quote */}
                                <div className="space-y-2 rounded-lg border border-border/70 bg-card p-3">
                                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                    <IconMessage2 className="h-4 w-4 text-primary" />
                                    <span>Mentor Advice Quote</span>
                                  </div>
                                  {r.mentorAdviceQuote ? (
                                    <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground text-[11px] leading-relaxed">
                                      &ldquo;{r.mentorAdviceQuote}&rdquo;
                                    </blockquote>
                                  ) : (
                                    <p className="text-[11px] text-muted-foreground italic">
                                      No advice quote submitted for this record.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Table Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/80 bg-card/40 px-4 py-3 text-xs">
            <div className="text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground font-mono">
                {queryResult.records.length > 0
                  ? (queryResult.page - 1) * queryResult.pageSize + 1
                  : 0}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground font-mono">
                {Math.min(
                  queryResult.page * queryResult.pageSize,
                  queryResult.totalFiltered
                )}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground font-mono">
                {queryResult.totalFiltered.toLocaleString()}
              </span>{" "}
              filtered records
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setParams({ pageSize: Number(e.target.value), page: 1 })
                  }}
                  className="rounded border border-input bg-background px-1.5 py-0.5 text-xs text-foreground"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setParams({ page: page - 1 })}
                  className="h-7 w-7 p-0"
                >
                  <IconChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 font-mono text-xs text-muted-foreground">
                  {queryResult.page} / {queryResult.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= queryResult.totalPages}
                  onClick={() => setParams({ page: page + 1 })}
                  className="h-7 w-7 p-0"
                >
                  <IconChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TablePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TableContent />
    </Suspense>
  )
}
