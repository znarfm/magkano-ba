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
import { formatPhp, formatPhpK } from "@/lib/utils"
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
  stats?: PercentileStats
  bySeniority: Record<SeniorityBand, PercentileStats>
  cpiAdjusted: boolean
  takeHomeParity: boolean
}

export function PercentileExplorer({
  bySeniority,
  cpiAdjusted,
  takeHomeParity,
}: PercentileExplorerProps) {
  const chartData = prepareSeniorityCurveData(bySeniority)
  const lowSampleBands = chartData.filter((d) => d.isLowSample)

  return (
    <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base font-bold tracking-tight">
            Career Compensation Progression
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Interquartile spread (P25 floor to P75 top quartile) with Median
            growth across experience bands (
            {cpiAdjusted ? "2026 PSA CPI Adjusted" : "Nominal"} ·{" "}
            {takeHomeParity ? "Monthly Net" : "Gross Base"}).
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-blue-500/30 bg-blue-500/10 font-mono text-[11px] text-blue-600 dark:text-blue-400"
          >
            <span className="mr-1 text-[8px]">●</span> P25 Floor
          </Badge>
          <Badge
            variant="outline"
            className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] text-emerald-600 dark:text-emerald-400"
          >
            <span className="mr-1 text-[8px]">●</span> Median (P50)
          </Badge>
          <Badge
            variant="outline"
            className="border-amber-500/30 bg-amber-500/10 font-mono text-[11px] text-amber-600 dark:text-amber-400"
          >
            <span className="mr-1 text-[8px]">●</span> P75 Upper
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
                className="px-1.5 py-0 font-mono text-[10px]"
              >
                {b.label} (n={b.count})
              </Badge>
            ))}
          </div>
        )}

        <div className="h-[290px] min-h-0 w-full min-w-0 pt-2">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="iqrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--primary)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--primary)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.4}
              />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatPhpK}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const pt = payload[0].payload as SeniorityCurvePoint
                  return (
                    <div className="space-y-2 rounded-xl border border-border/80 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-md">
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
                          <span className="text-[10px] text-blue-500">
                            P25 Floor
                          </span>
                          <div className="font-semibold text-foreground">
                            {formatPhp(pt.p25)}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500">
                            Median P50
                          </span>
                          <div className="font-bold text-foreground">
                            {formatPhp(pt.p50)}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-500">
                            P75 Top
                          </span>
                          <div className="font-semibold text-foreground">
                            {formatPhp(pt.p75)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/60 pt-1.5 font-mono text-[10px] text-muted-foreground">
                        <span>IQR Spread</span>
                        <span className="font-semibold text-foreground">
                          {formatPhp(pt.iqrSpread)}
                        </span>
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
                fill="var(--card)"
              />
              {/* P25 Line */}
              <Line
                type="monotone"
                dataKey="p25"
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: "#3b82f6" }}
              />
              {/* Median Line */}
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
              />
              {/* P75 Line */}
              <Line
                type="monotone"
                dataKey="p75"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: "#f59e0b" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
