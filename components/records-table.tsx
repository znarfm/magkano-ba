"use client"

import React, { useMemo, useState } from "react"
import type { CareerRecord, FilterState } from "@/lib/types"
import { exportRecordsToCsv } from "@/lib/analytics"
import { computeCompensationView } from "@/lib/economics"
import {
  TableSortColumn,
  TablePaginationParams,
} from "@/hooks/use-dashboard-filter-params"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatPhp } from "@/lib/utils"
import {
  IconDownload,
  IconChevronRight,
  IconChevronLeft,
  IconArrowUp,
  IconArrowDown,
} from "@tabler/icons-react"

interface RecordsTableProps {
  records: CareerRecord[]
  totalCount: number
  filter: FilterState
  tableParams: TablePaginationParams
  onTableParamsChange: (
    updater:
      | Partial<TablePaginationParams>
      | ((prev: TablePaginationParams) => Partial<TablePaginationParams>)
  ) => void
}

const PAGE_SIZES = [
  { label: "25", value: "25" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
]

/**
 * Interactive raw records data grid featuring multi-column sorting, pagination,
 * dynamic compensation labeling, CSV export, and record detail drawer inspection.
 */
export function RecordsTable({
  records,
  totalCount,
  filter,
  tableParams,
  onTableParamsChange,
}: RecordsTableProps) {
  const { cpiAdjusted, takeHomeParity } = filter
  const { sortBy, sortOrder, page, pageSize } = tableParams

  const [selectedRecord, setSelectedRecord] = useState<CareerRecord | null>(null)

  // Compute displayed salary column label dynamically based on cpiAdjusted & takeHomeParity
  const salaryHeaderLabel = useMemo(() => {
    if (cpiAdjusted && takeHomeParity) return "2026 CPI Net"
    if (cpiAdjusted && !takeHomeParity) return "2026 CPI Gross"
    if (!cpiAdjusted && takeHomeParity) return "Nominal Net"
    return "Nominal Gross"
  }, [cpiAdjusted, takeHomeParity])

  // Sort records
  const sortedRecords = useMemo(() => {
    const list = [...records]
    if (sortBy === "salary") {
      const decorated = list.map((r) => ({
        r,
        val: computeCompensationView(r, { cpiAdjusted, takeHomeParity }),
      }))
      decorated.sort((a, b) => (sortOrder === "asc" ? a.val - b.val : b.val - a.val))
      return decorated.map((d) => d.r)
    }

    list.sort((a, b) => {
      let diff = 0
      if (sortBy === "cohortYear") {
        diff = a.cohortYear - b.cohortYear
      } else if (sortBy === "yoeYears") {
        diff = a.yoeYears - b.yoeYears
      } else if (sortBy === "rawTitle") {
        diff = a.rawTitle.localeCompare(b.rawTitle)
      } else if (sortBy === "schoolCanonical") {
        diff = (a.schoolCanonical ?? "").localeCompare(b.schoolCanonical ?? "")
      }
      return sortOrder === "asc" ? diff : -diff
    })
    return list
  }, [records, sortBy, sortOrder, cpiAdjusted, takeHomeParity])

  // Paginate records
  const totalFiltered = sortedRecords.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const offset = (safePage - 1) * pageSize
  const paginatedRecords = useMemo(
    () => sortedRecords.slice(offset, offset + pageSize),
    [sortedRecords, offset, pageSize]
  )

  /**
   * Toggles column sort order between ascending and descending, or sets new active sort column.
   */
  const toggleSort = (col: TableSortColumn) => {
    if (sortBy === col) {
      onTableParamsChange({
        sortOrder: sortOrder === "asc" ? "desc" : "asc",
        page: 1,
      })
    } else {
      onTableParamsChange({ sortBy: col, sortOrder: "desc", page: 1 })
    }
  }

  /**
   * Exports the entire active filtered record slice to an RFC-4180 compliant CSV file.
   */
  const handleDownloadCsv = () => {
    const csvContent = exportRecordsToCsv(sortedRecords)
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
    <div className="space-y-4">
      {/* Table Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">
            Raw Compensation Records
          </span>
          <Badge variant="outline" className="font-mono text-[11px] text-muted-foreground">
            {totalFiltered.toLocaleString()} of {totalCount.toLocaleString()}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadCsv}
          className="h-8 gap-1.5 bg-background text-xs font-medium"
        >
          <IconDownload className="size-3.5" />
          <span>Export CSV ({totalFiltered.toLocaleString()})</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead
                aria-sort={
                  sortBy === "rawTitle"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="text-xs font-medium text-muted-foreground"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("rawTitle")}
                  className="flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span>Role Title</span>
                  {sortBy === "rawTitle" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="size-3 text-primary" aria-hidden="true" />
                    ) : (
                      <IconArrowDown className="size-3 text-primary" aria-hidden="true" />
                    ))}
                </button>
              </TableHead>

              <TableHead className="text-xs font-medium text-muted-foreground">
                Industry
              </TableHead>

              <TableHead
                aria-sort={
                  sortBy === "yoeYears"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="text-xs font-medium text-muted-foreground"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("yoeYears")}
                  className="flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span>Experience</span>
                  {sortBy === "yoeYears" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="size-3 text-primary" aria-hidden="true" />
                    ) : (
                      <IconArrowDown className="size-3 text-primary" aria-hidden="true" />
                    ))}
                </button>
              </TableHead>

              <TableHead
                aria-sort={
                  sortBy === "salary"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="text-right text-xs font-medium text-muted-foreground"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("salary")}
                  className="ml-auto flex items-center justify-end gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span>{salaryHeaderLabel}</span>
                  {sortBy === "salary" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="size-3 text-primary" aria-hidden="true" />
                    ) : (
                      <IconArrowDown className="size-3 text-primary" aria-hidden="true" />
                    ))}
                </button>
              </TableHead>

              <TableHead
                aria-sort={
                  sortBy === "schoolCanonical"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="text-xs font-medium text-muted-foreground"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("schoolCanonical")}
                  className="flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span>University</span>
                  {sortBy === "schoolCanonical" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="size-3 text-primary" aria-hidden="true" />
                    ) : (
                      <IconArrowDown className="size-3 text-primary" aria-hidden="true" />
                    ))}
                </button>
              </TableHead>

              <TableHead
                aria-sort={
                  sortBy === "cohortYear"
                    ? sortOrder === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="text-center text-xs font-medium text-muted-foreground"
              >
                <button
                  type="button"
                  onClick={() => toggleSort("cohortYear")}
                  className="mx-auto flex items-center justify-center gap-1 rounded transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span>Year</span>
                  {sortBy === "cohortYear" &&
                    (sortOrder === "asc" ? (
                      <IconArrowUp className="size-3 text-primary" aria-hidden="true" />
                    ) : (
                      <IconArrowDown className="size-3 text-primary" aria-hidden="true" />
                    ))}
                </button>
              </TableHead>

              <TableHead className="text-center text-xs font-medium text-muted-foreground">
                Source
              </TableHead>

              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  No records match the current filter selection.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRecords.map((r) => {
                const isSelected = selectedRecord?.id === r.id
                const effectiveSalary = computeCompensationView(r, {
                  cpiAdjusted,
                  takeHomeParity,
                })
                const isDifferentFromNominal =
                  cpiAdjusted || takeHomeParity

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
                      {formatPhp(effectiveSalary)}
                      {isDifferentFromNominal && (
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

        {/* Table Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 text-xs">
          <div className="text-muted-foreground">
            Showing{" "}
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {totalFiltered > 0 ? (safePage - 1) * pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {Math.min(safePage * pageSize, totalFiltered)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {totalFiltered.toLocaleString()}
            </span>{" "}
            records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>Rows:</span>
              <div className="w-18">
                <Select
                  items={PAGE_SIZES}
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    if (val) {
                      onTableParamsChange({ pageSize: Number(val), page: 1 })
                    }
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Rows per page"
                    className="h-7 w-full bg-background font-mono text-xs text-foreground"
                  >
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((ps) => (
                      <SelectItem
                        key={ps.value}
                        value={ps.value}
                        className="font-mono text-xs"
                      >
                        {ps.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => onTableParamsChange({ page: safePage - 1 })}
                className="size-7 p-0"
                aria-label="Previous page"
              >
                <IconChevronLeft className="size-3.5" />
              </Button>
              <span className="px-2 font-mono text-xs tabular-nums text-muted-foreground">
                {safePage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => onTableParamsChange({ page: safePage + 1 })}
                className="size-7 p-0"
                aria-label="Next page"
              >
                <IconChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                    {salaryHeaderLabel}
                  </span>
                  <div className="mt-1 font-mono text-lg font-bold tabular-nums text-primary">
                    {formatPhp(
                      computeCompensationView(selectedRecord, {
                        cpiAdjusted,
                        takeHomeParity,
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
