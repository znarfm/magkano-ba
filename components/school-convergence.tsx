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
import { Input } from "@/components/ui/input"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatPhp, formatPhpK } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { IconSearch } from "@tabler/icons-react"

interface SchoolConvergenceProps {
  bySchoolTier: Record<SchoolTierGroup, PercentileStats>
  granularSchools?: GranularSchoolPoint[]
  cpiAdjusted: boolean
  maxDisplay?: number
}

const chartConfig = {
  median: {
    label: "Median Monthly Pay",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function SchoolConvergence({
  bySchoolTier,
  granularSchools = [],
  cpiAdjusted,
  maxDisplay = 15,
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
    <Card className="border-border bg-card shadow-none ring-0">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Alma Mater Compensation Benchmarks
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {viewMode === "granular"
                ? `Median compensation by canonical university (min sample n >= 5, ${
                    cpiAdjusted ? "2026 CPI" : "Nominal"
                  }).`
                : `Median compensation across institutional tiers (${
                    cpiAdjusted ? "2026 CPI" : "Nominal"
                  }).`}
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {viewMode === "granular" && (
              <div className="relative w-44">
                <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  aria-label="Filter universities"
                  placeholder="Filter school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 bg-background pl-8 text-xs"
                />
              </div>
            )}

            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("granular")}
                className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  viewMode === "granular"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Universities ({granularSchools.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tiers")}
                className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  viewMode === "tiers"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tiers
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {activeData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            No university matches found.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full"
            style={{
              height: Math.max(220, activeData.length * 30 + 32),
            }}
          >
            <BarChart
              data={activeData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--border)"
                strokeOpacity={0.6}
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
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const pt = payload[0].payload as (typeof activeData)[0]
                  return (
                    <div className="space-y-1.5 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg">
                      <div className="font-semibold text-foreground">
                        {pt.label}
                      </div>
                      {pt.tierLabel && (
                        <div className="text-[10px] text-muted-foreground">
                          {pt.tierLabel}
                        </div>
                      )}
                      <div className="font-mono font-bold tabular-nums text-primary">
                        Median: {formatPhp(pt.median)}/mo
                      </div>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                        <span>P25: {formatPhp(pt.p25)}</span>
                        <span>P75: {formatPhp(pt.p75)}</span>
                      </div>
                      <div className="border-t border-border pt-1 font-mono text-[10px] text-muted-foreground">
                        Sample: n = {pt.count} graduates
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="median"
                name="Median Monthly Pay"
                fill="var(--color-median)"
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
