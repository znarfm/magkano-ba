"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import type { CareerRecord } from "@/lib/types"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { formatPhp } from "@/lib/utils"
import {
  IconSearch,
  IconDownload,
  IconChevronRight,
  IconChevronLeft,
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
  { label: "All Experience", value: "ALL" },
  { label: "0 YOE (Entry)", value: "ENTRY_0" },
  { label: "1-2 YOE (Junior)", value: "JUNIOR_1_2" },
  { label: "3-5 YOE (Mid-Level)", value: "MID_3_5" },
  { label: "6-9 YOE (Senior)", value: "SENIOR_6_9" },
  { label: "10+ YOE (Staff/Lead)", value: "STAFF_LEAD_10_PLUS" },
]

const SOURCES = [
  { label: "All Datasets (4,010)", value: "ALL" },
  { label: "Liyab First Pay (2,942)", value: "LIYAB_FIRST_PAY" },
  { label: "r/phcareers (1,068)", value: "CAREER_PATH_INFO" },
]

function TableContent() {
  const [records, setRecords] = useState<CareerRecord[]>([])
  const [loading, setLoading] = useState(true)

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

  const [selectedRecord, setSelectedRecord] = useState<CareerRecord | null>(
    null
  )
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
    link.setAttribute(
      "download",
      `magkano-ba-filtered-salaries-${Date.now()}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background font-sans text-foreground">
      <NavigationHeader />

      {/* Sticky Table Filter Bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:flex-nowrap">
            <div className="relative min-w-[180px] flex-1 sm:max-w-60">
              <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                aria-label="Search job title, university, or advice"
                placeholder="Search title, school, advice..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-8 bg-card pl-8 text-xs"
              />
            </div>

            <div className="w-40 sm:w-44">
              <Select
                items={INDUSTRIES}
                value={industry}
                onValueChange={(val) => {
                  setParams({ macroIndustry: val || "ALL", page: 1 })
                }}
              >
                <SelectTrigger className="h-8 w-full bg-card text-xs">
                  <SelectValue placeholder="Industry" />
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
                value={seniority}
                onValueChange={(val) => {
                  setParams({ seniorityBand: val || "ALL", page: 1 })
                }}
              >
                <SelectTrigger className="h-8 w-full bg-card text-xs">
                  <SelectValue placeholder="Experience" />
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

            <div className="w-44">
              <Select
                items={SOURCES}
                value={sourceSheet}
                onValueChange={(val) => {
                  setParams({ sourceSheet: val || "ALL", page: 1 })
                }}
              >
                <SelectTrigger className="h-8 w-full bg-card text-xs">
                  <SelectValue placeholder="Dataset Source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((src) => (
                    <SelectItem
                      key={src.value}
                      value={src.value}
                      className="text-xs"
                    >
                      {src.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setParams({ cpiAdjusted: !cpiAdjusted, page: 1 })}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                cpiAdjusted
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
              title="Adjust pay to 2026 inflation using official PSA Consumer Price Index (134.5)"
              aria-label="Toggle 2026 CPI inflation adjustment"
            >
              <IconTrendingUp className="size-3.5" />
              <span>{cpiAdjusted ? "2026 CPI" : "Nominal PHP"}</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              className="h-8 gap-1.5 bg-card text-xs font-medium"
            >
              <IconDownload className="size-3.5" />
              <span>
                Export CSV ({queryResult.totalFiltered.toLocaleString()})
              </span>
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead
                    className="cursor-pointer text-xs font-medium text-muted-foreground"
                    onClick={() => toggleSort("rawTitle")}
                  >
                    <div className="flex items-center gap-1">
                      Role Title
                      {sortBy === "rawTitle" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="size-3 text-primary" />
                        ) : (
                          <IconArrowDown className="size-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-muted-foreground">
                    Industry
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-xs font-medium text-muted-foreground"
                    onClick={() => toggleSort("yoeYears")}
                  >
                    <div className="flex items-center gap-1">
                      Experience
                      {sortBy === "yoeYears" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="size-3 text-primary" />
                        ) : (
                          <IconArrowDown className="size-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-right text-xs font-medium text-muted-foreground"
                    onClick={() => toggleSort("salary")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {cpiAdjusted ? "2026 CPI Pay" : "Monthly Gross"}
                      {sortBy === "salary" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="size-3 text-primary" />
                        ) : (
                          <IconArrowDown className="size-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-xs font-medium text-muted-foreground"
                    onClick={() => toggleSort("schoolCanonical")}
                  >
                    <div className="flex items-center gap-1">
                      University
                      {sortBy === "schoolCanonical" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="size-3 text-primary" />
                        ) : (
                          <IconArrowDown className="size-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer text-center text-xs font-medium text-muted-foreground"
                    onClick={() => toggleSort("cohortYear")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Year
                      {sortBy === "cohortYear" &&
                        (sortOrder === "asc" ? (
                          <IconArrowUp className="size-3 text-primary" />
                        ) : (
                          <IconArrowDown className="size-3 text-primary" />
                        ))}
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-xs font-medium text-muted-foreground">
                    Source
                  </TableHead>
                  <TableHead className="w-8"></TableHead>
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
                    const isSelected = selectedRecord?.id === r.id
                    return (
                      <TableRow
                        key={r.id}
                        tabIndex={0}
                        onClick={() => setSelectedRecord(r)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setSelectedRecord(r)
                          }
                        }}
                        className={`cursor-pointer border-border/50 transition-colors focus-visible:bg-accent/40 focus-visible:outline-hidden ${
                          isSelected ? "bg-accent/50" : "hover:bg-muted/40"
                        }`}
                      >
                        <TableCell className="text-xs font-medium text-foreground">
                          {r.rawTitle}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.macroIndustry.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {r.yoeYears} YOE
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-bold tabular-nums text-foreground">
                          {formatPhp(
                            cpiAdjusted
                              ? computeCompensationView(r, {
                                  cpiAdjusted: true,
                                  takeHomeParity: false,
                                })
                              : r.nominalMonthlyGrossPhp.median
                          )}
                          {cpiAdjusted && (
                            <div className="font-mono text-[10px] font-normal tabular-nums text-muted-foreground">
                              nom: {formatPhp(r.nominalMonthlyGrossPhp.median)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.schoolCanonical || "Unspecified"}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs tabular-nums text-muted-foreground">
                          {r.cohortYear}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className="py-0 font-mono text-[10px]"
                          >
                            {r.sourceSheet === "LIYAB_FIRST_PAY"
                              ? "Liyab"
                              : "phcareers"}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-8 px-2 text-right">
                          <IconChevronRight className="size-3.5 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Table Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 text-xs">
            <div className="text-muted-foreground">
              Showing{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {queryResult.records.length > 0
                  ? (queryResult.page - 1) * queryResult.pageSize + 1
                  : 0}
              </span>{" "}
              to{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {Math.min(
                  queryResult.page * queryResult.pageSize,
                  queryResult.totalFiltered
                )}
              </span>{" "}
              of{" "}
              <span className="font-mono font-semibold tabular-nums text-foreground">
                {queryResult.totalFiltered.toLocaleString()}
              </span>{" "}
              records
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>Rows:</span>
                <select
                  aria-label="Rows per page"
                  value={pageSize}
                  onChange={(e) => {
                    setParams({ pageSize: Number(e.target.value), page: 1 })
                  }}
                  className="rounded-md border border-input bg-background px-2 py-0.5 font-mono text-xs text-foreground"
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
                  className="size-7 p-0"
                  aria-label="Previous page"
                >
                  <IconChevronLeft className="size-3.5" />
                </Button>
                <span className="px-2 font-mono text-xs tabular-nums text-muted-foreground">
                  {queryResult.page} / {queryResult.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= queryResult.totalPages}
                  onClick={() => setParams({ page: page + 1 })}
                  className="size-7 p-0"
                  aria-label="Next page"
                >
                  <IconChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Slide-Over Record Inspector Sheet */}
      <Sheet
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null)
        }}
      >
        <SheetContent side="right" className="overflow-y-auto">
          {selectedRecord && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {selectedRecord.sourceSheet === "LIYAB_FIRST_PAY"
                      ? "Liyab First Pay"
                      : "r/phcareers"}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    Cohort {selectedRecord.cohortYear}
                  </span>
                </div>
                <SheetTitle className="mt-1 text-lg">
                  {selectedRecord.rawTitle}
                </SheetTitle>
                <SheetDescription>
                  {selectedRecord.roleFamily} /{" "}
                  {selectedRecord.macroIndustry.replace(/_/g, " ")}
                </SheetDescription>
              </SheetHeader>

              <Separator />

              {/* Compensation Summary */}
              <div className="grid grid-cols-2 divide-x divide-border rounded-xl border border-border bg-muted/20">
                <div className="p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    2026 CPI-Adjusted Gross
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold tabular-nums text-primary">
                    {formatPhp(
                      computeCompensationView(selectedRecord, {
                        cpiAdjusted: true,
                        takeHomeParity: false,
                      })
                    )}
                    /mo
                  </div>
                </div>
                <div className="p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Nominal Reported Gross
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground">
                    {formatPhp(selectedRecord.nominalMonthlyGrossPhp.median)}/mo
                  </div>
                </div>
              </div>

              {/* Package Metadata Ledger */}
              <div className="space-y-2.5 text-xs">
                <h4 className="font-semibold text-foreground">
                  Compensation & Benefits Ledger
                </h4>
                <dl className="divide-y divide-border rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">Experience</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {selectedRecord.yoeYears} YOE
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">University</dt>
                    <dd className="font-medium text-foreground">
                      {selectedRecord.schoolCanonical || "Unspecified"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">Employment Scope</dt>
                    <dd className="font-mono text-foreground">
                      {selectedRecord.workScope.replace(/_/g, " ")}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">Guaranteed Months</dt>
                    <dd className="font-mono font-semibold text-foreground">
                      {selectedRecord.benefits.guaranteedMonths} mos
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">Monthly Allowance</dt>
                    <dd className="font-mono text-foreground">
                      {formatPhp(selectedRecord.benefits.monthlyAllowancePhp)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">HMO Coverage</dt>
                    <dd className="font-mono text-foreground">
                      {selectedRecord.benefits.hmoCoveragePhp
                        ? formatPhp(selectedRecord.benefits.hmoCoveragePhp)
                        : "Unspecified"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">Vacation Leaves</dt>
                    <dd className="font-mono text-foreground">
                      {selectedRecord.benefits.vacationLeaveDays !== null
                        ? `${selectedRecord.benefits.vacationLeaveDays} days`
                        : "Standard"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5">
                    <dt className="text-muted-foreground">Negotiated Offer</dt>
                    <dd className="font-mono text-foreground">
                      {selectedRecord.negotiatedOffer === true
                        ? "Yes"
                        : selectedRecord.negotiatedOffer === false
                          ? "No"
                          : "Not Tracked"}
                    </dd>
                  </div>
                </dl>

                {selectedRecord.benefits.rawBenefitsSummary && (
                  <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                    <span className="mb-1 block font-medium text-foreground">
                      Raw Benefits Note
                    </span>
                    {selectedRecord.benefits.rawBenefitsSummary.replace(
                      /[—–]/g,
                      "-"
                    )}
                  </div>
                )}
              </div>

              {/* Practitioner Advice Quote */}
              <div className="space-y-2 text-xs">
                <h4 className="font-semibold text-foreground">
                  Practitioner Field Note
                </h4>
                {selectedRecord.mentorAdviceQuote ? (
                  <blockquote className="rounded-xl border border-border bg-muted/20 p-3.5 leading-relaxed text-foreground/90 italic">
                    &ldquo;
                    {selectedRecord.mentorAdviceQuote.replace(/[—–]/g, "-")}
                    &rdquo;
                  </blockquote>
                ) : (
                  <p className="rounded-xl border border-border bg-muted/10 p-3.5 text-muted-foreground">
                    No advice quote submitted for this record.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function TablePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <TableContent />
    </Suspense>
  )
}
