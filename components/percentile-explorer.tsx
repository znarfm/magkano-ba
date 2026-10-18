"use client"

import React from "react"
import { PercentileStats, SeniorityBand } from "@/lib/types"
import {
  prepareSeniorityCurveData,
  SeniorityCurvePoint,
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
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"

interface PercentileExplorerProps {
  stats: PercentileStats
  bySeniority: Record<SeniorityBand, PercentileStats>
  cpiAdjusted: boolean
  takeHomeParity: boolean
}

export function PercentileExplorer({
  stats,
  bySeniority,
  cpiAdjusted,
  takeHomeParity,
}: PercentileExplorerProps) {
  const chartData = prepareSeniorityCurveData(bySeniority)
  const lowSampleBands = chartData.filter((d) => d.isLowSample)

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-lg">Career Compensation Curves</CardTitle>
          <CardDescription className="text-xs">
            Interquartile spread (P25 floor to P75 upper quartile) with Median
            progression across experience bands. (
            {cpiAdjusted ? "2026 PSA CPI Adjusted" : "Nominal Rates"} ·{" "}
            {takeHomeParity ? "Monthly Net Take-Home" : "Gross Monthly Base"})
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-blue-500/40 font-mono text-xs text-blue-600 dark:text-blue-400"
          >
            ● P25 Floor
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-500/40 font-mono text-xs text-emerald-600 dark:text-emerald-400"
          >
            ● Median (P50)
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-500/40 font-mono text-xs text-amber-600 dark:text-amber-400"
          >
            ● P75 Top Quartile
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {lowSampleBands.length > 0 && (
          <div className="mb-3 flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300">
            <span>⚠️ Low sample size (&lt;5 records) in:</span>
            {lowSampleBands.map((b) => (
              <Badge
                key={b.bandKey}
                variant="secondary"
                className="px-1.5 py-0 text-[10px]"
              >
                {b.label} (n={b.count})
              </Badge>
            ))}
          </div>
        )}

        <div className="h-[280px] min-h-0 w-full min-w-0 pt-2">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="iqrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const pt = payload[0].payload as SeniorityCurvePoint
                  return (
                    <div className="space-y-1.5 rounded-lg border border-border bg-card p-3 text-xs shadow-md">
                      <div className="flex items-center justify-between gap-3 font-semibold text-foreground">
                        <span>{pt.label}</span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px]"
                        >
                          n = {pt.count}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                        <div>
                          <span className="font-medium text-blue-500">
                            P25:
                          </span>
                          <div className="text-foreground">
                            ₱{pt.p25.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-emerald-500">
                            Median:
                          </span>
                          <div className="font-bold text-foreground">
                            ₱{pt.p50.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-amber-500">
                            P75:
                          </span>
                          <div className="text-foreground">
                            ₱{pt.p75.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-border/50 pt-1 font-mono text-[10px] text-muted-foreground">
                        IQR Spread: ₱{pt.iqrSpread.toLocaleString()}
                      </div>
                    </div>
                  )
                }}
              />
              {/* Shaded P25 to P75 range */}
              <Area
                type="monotone"
                dataKey="p75"
                stroke="transparent"
                fill="url(#iqrGradient)"
              />
              <Area
                type="monotone"
                dataKey="p25"
                stroke="transparent"
                fill="var(--background)"
              />
              {/* P25 Line */}
              <Line
                type="monotone"
                dataKey="p25"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#3b82f6" }}
              />
              {/* Median Line */}
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 5, fill: "#10b981" }}
                activeDot={{ r: 7 }}
              />
              {/* P75 Line */}
              <Line
                type="monotone"
                dataKey="p75"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
