"use client"

import React from "react"
import { PercentileStats, SchoolTierGroup } from "@/lib/types"
import {
  prepareSchoolConvergenceData,
  SchoolTierPoint,
} from "@/lib/chart-adapters"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface SchoolConvergenceProps {
  bySchoolTier: Record<SchoolTierGroup, PercentileStats>
  cpiAdjusted: boolean
}

export function SchoolConvergence({
  bySchoolTier,
  cpiAdjusted,
}: SchoolConvergenceProps) {
  const chartData = prepareSchoolConvergenceData(bySchoolTier)

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            Alma Mater Starting Pay & Tier Benchmarks
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {cpiAdjusted ? "2026 CPI-Adjusted" : "Nominal PHP"}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Median starting compensation and interquartile ranges across
          Philippine university cohorts.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-1">
        {chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            No school cohort data available in current filter.
          </div>
        ) : (
          <div className="h-[200px] min-h-0 w-full min-w-0 pt-1">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) =>
                    `₱${(val / 1000).toFixed(0)}k`
                  }
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const pt = payload[0].payload as SchoolTierPoint
                    return (
                      <div className="space-y-1 rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
                        <div className="font-semibold text-foreground">
                          {pt.label}
                        </div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Median: ₱{pt.median.toLocaleString()}/mo
                        </div>
                        <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-foreground">
                          <span>P25: ₱{pt.p25.toLocaleString()}</span>
                          <span>P75: ₱{pt.p75.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-border/40 pt-1 font-mono text-[10px] text-muted-foreground">
                          Sample Size: n = {pt.count}
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="median"
                  name="Median Monthly Pay"
                  fill="var(--color-primary)"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
