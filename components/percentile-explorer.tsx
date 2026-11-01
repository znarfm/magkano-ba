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
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatPhp, formatPhpK } from "@/lib/utils"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { IconAlertCircle } from "@tabler/icons-react"

interface PercentileExplorerProps {
  stats?: PercentileStats
  bySeniority: Record<SeniorityBand, PercentileStats>
  cpiAdjusted: boolean
  takeHomeParity: boolean
}

const chartConfig = {
  p75: {
    label: "P75 Upper",
    color: "var(--chart-2)",
  },
  p50: {
    label: "Median (P50)",
    color: "var(--chart-1)",
  },
  p25: {
    label: "P25 Floor",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function PercentileExplorer({
  bySeniority,
  cpiAdjusted,
  takeHomeParity,
}: PercentileExplorerProps) {
  const chartData = prepareSeniorityCurveData(bySeniority)
  const lowSampleBands = chartData.filter((d) => d.isLowSample)

  return (
    <Card className="border-border bg-card shadow-none ring-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">
            Career Compensation Progression
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            P25 floor to P75 upper quartile spread across seniority bands (
            {cpiAdjusted ? "2026 CPI" : "Nominal"} /{" "}
            {takeHomeParity ? "Monthly Net" : "Gross Base"}).
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-(--chart-3)" />
            P25 Floor
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <span className="h-0.5 w-3 bg-(--chart-1)" />
            Median P50
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t border-dashed border-(--chart-2)" />
            P75 Top
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {lowSampleBands.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
            <IconAlertCircle className="size-3.5 shrink-0 text-primary" />
            <span>Low sample size (&lt;5 records):</span>
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

        <ChartContainer config={chartConfig} className="h-[290px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="iqrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-p50)"
                  stopOpacity={0.18}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-p50)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.6}
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
              tickFormatter={formatPhpK}
            />
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const pt = payload[0].payload as SeniorityCurvePoint
                return (
                  <div className="space-y-2 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg">
                    <div className="flex items-center justify-between gap-3 font-semibold text-foreground">
                      <span>{pt.label}</span>
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                      >
                        n = {pt.count}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-1 font-mono text-[11px] tabular-nums">
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          P25 Floor
                        </span>
                        <div className="font-medium text-foreground">
                          {formatPhp(pt.p25)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-primary">
                          Median P50
                        </span>
                        <div className="font-bold text-foreground">
                          {formatPhp(pt.p50)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          P75 Top
                        </span>
                        <div className="font-medium text-foreground">
                          {formatPhp(pt.p75)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      <span>Interquartile Spread</span>
                      <span className="font-semibold text-foreground">
                        {formatPhp(pt.iqrSpread)}
                      </span>
                    </div>
                  </div>
                )
              }}
            />
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
            <Line
              type="monotone"
              dataKey="p25"
              stroke="var(--color-p25)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2.5, fill: "var(--color-p25)" }}
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="var(--color-p50)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "var(--color-p50)" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="p75"
              stroke="var(--color-p75)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 2.5, fill: "var(--color-p75)" }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
