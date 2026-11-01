"use client"

import React, { useState } from "react"
import { PercentileStats, SchoolTierGroup } from "@/lib/types"
import {
  prepareSchoolConvergenceData,
  GranularSchoolPoint,
} from "@/lib/chart-adapters"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatPhp, formatPhpK } from "@/lib/utils"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { IconSchool, IconSearch } from "@tabler/icons-react"

interface SchoolConvergenceProps {
  bySchoolTier: Record<SchoolTierGroup, PercentileStats>
  granularSchools?: GranularSchoolPoint[]
  cpiAdjusted: boolean
  maxDisplay?: number
}

export function SchoolConvergence({
  bySchoolTier,
  granularSchools = [],
  cpiAdjusted,
  maxDisplay = 20,
}: SchoolConvergenceProps) {
  const [viewMode, setViewMode] = useState<"granular" | "tiers">(
    granularSchools.length > 0 ? "granular" : "tiers"
  )
  const [searchQuery, setSearchQuery] = useState("")

  const tierChartData = prepareSchoolConvergenceData(bySchoolTier)

  const filteredGranularData = granularSchools.filter((s) => {
    if (!searchQuery.trim()) return true
    return (
      s.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tierLabel.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  interface ChartItem {
    label: string
    median: number
    p25: number
    p75: number
    count: number
    tierLabel?: string
  }

  const activeData: ChartItem[] =
    viewMode === "granular"
      ? (maxDisplay > 0
          ? filteredGranularData.slice(0, maxDisplay)
          : filteredGranularData
        ).map((s) => ({
          label: s.school,
          median: s.median,
          p25: s.p25,
          p75: s.p75,
          count: s.count,
          tierLabel: s.tierLabel,
        }))
      : tierChartData.map((t) => ({
          label: t.label,
          median: t.median,
          p25: t.p25,
          p75: t.p75,
          count: t.count,
          tierLabel: t.label,
        }))

  return (
    <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconSchool className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-base font-bold tracking-tight">
              Alma Mater Compensation Benchmarks
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-md border border-border/70 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("granular")}
                className={`rounded-sm px-2 py-0.5 text-xs font-medium transition-colors ${
                  viewMode === "granular"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Top Universities ({granularSchools.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tiers")}
                className={`rounded-sm px-2 py-0.5 text-xs font-medium transition-colors ${
                  viewMode === "tiers"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Broad Tiers
              </button>
            </div>
            <Badge
              variant="outline"
              className="border-primary/30 bg-muted/50 font-mono text-[11px] text-muted-foreground"
            >
              {cpiAdjusted ? "2026 CPI-Adjusted" : "Nominal PHP"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <CardDescription className="text-xs text-muted-foreground">
            {viewMode === "granular"
              ? "Median starting salary by specific canonical university (minimum sample n ≥ 5)."
              : "Median starting compensation and interquartile ranges across institutional tiers."}
          </CardDescription>
          {viewMode === "granular" && (
            <div className="relative w-44">
              <IconSearch className="absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search university..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-[11px] bg-card/70"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {activeData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            No university matches found.
          </div>
        ) : (
          <div
            className="min-h-0 w-full min-w-0 pt-1"
            style={{
              height: Math.max(220, activeData.length * 28 + 40),
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart
                data={activeData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="var(--border)"
                  strokeOpacity={0.4}
                />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatPhpK}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={150}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const pt = payload[0].payload as typeof activeData[0]
                    return (
                      <div className="space-y-1.5 rounded-xl border border-border/80 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-md">
                        <div className="font-semibold text-foreground">
                          {pt.label}
                        </div>
                        {"tierLabel" in pt && (
                          <div className="text-[10px] text-muted-foreground">
                            {(pt as { tierLabel?: string }).tierLabel}
                          </div>
                        )}
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Median: {formatPhp(pt.median)}/mo
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>P25: {formatPhp(pt.p25)}</span>
                          <span>P75: {formatPhp(pt.p75)}</span>
                        </div>
                        <div className="border-t border-border/60 pt-1 font-mono text-[10px] text-muted-foreground">
                          Sample Size: n = {pt.count} graduates
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="median"
                  name="Median Monthly Pay"
                  fill="var(--primary)"
                  opacity={0.8}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
