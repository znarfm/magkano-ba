"use client"

import React from "react"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts"

interface NegotiationLiftProps {
  lift: {
    negotiatedMedian: number
    nonNegotiatedMedian: number
    liftPhp: number
    liftPercent: number
    negotiatedCount: number
    nonNegotiatedCount: number
    negotiatedStats?: { p25: number; p50: number; p75: number }
    nonNegotiatedStats?: { p25: number; p75: number; p50: number }
  }
}

const chartConfig = {
  median: {
    label: "Median Monthly Pay",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function NegotiationLift({ lift }: NegotiationLiftProps) {
  const chartData = [
    {
      category: "Negotiated",
      p25:
        lift.negotiatedStats?.p25 || Math.round(lift.negotiatedMedian * 0.85),
      median: lift.negotiatedMedian,
      p75: lift.negotiatedStats?.p75 || Math.round(lift.negotiatedMedian * 1.2),
      count: lift.negotiatedCount,
    },
    {
      category: "Accepted Initial",
      p25:
        lift.nonNegotiatedStats?.p25 ||
        Math.round(lift.nonNegotiatedMedian * 0.85),
      median: lift.nonNegotiatedMedian,
      p75:
        lift.nonNegotiatedStats?.p75 ||
        Math.round(lift.nonNegotiatedMedian * 1.2),
      count: lift.nonNegotiatedCount,
    },
  ]
  const hasData = lift.negotiatedCount > 0 && lift.nonNegotiatedCount > 0

  return (
    <Card className="flex h-full flex-col justify-between border-border bg-card shadow-none ring-0">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">
            Negotiation Lift
          </CardTitle>
          {hasData && (
            <Badge
              variant="secondary"
              className="bg-accent font-mono text-[11px] font-semibold text-accent-foreground"
            >
              +{lift.liftPercent}% Median
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Entry-level comparison between candidates who counter-offered vs.
          accepted initial offers.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between space-y-4 pt-4">
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            Insufficient negotiation records in current filter slice.
          </div>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="h-[195px] w-full">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="category"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
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
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const pt = payload[0].payload as (typeof chartData)[0]
                    return (
                      <div className="space-y-1.5 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg">
                        <div className="font-semibold text-foreground">
                          {pt.category}
                        </div>
                        <div className="font-mono text-sm font-bold tabular-nums text-primary">
                          Median: {formatPhp(pt.median)}/mo
                        </div>
                        <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          P25-P75: {formatPhp(pt.p25)} - {formatPhp(pt.p75)}
                        </div>
                        <div className="border-t border-border pt-1 font-mono text-[10px] text-muted-foreground">
                          Sample: n = {pt.count.toLocaleString()} offers
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="median" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  <Cell fill="var(--chart-1)" />
                  <Cell fill="var(--chart-4)" />
                </Bar>
              </BarChart>
            </ChartContainer>

            <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
              <div>
                <div className="font-medium text-foreground">
                  Expected Monthly Advantage
                </div>
                <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  +{formatPhp(Math.max(0, lift.liftPhp) * 13)}/yr (13 mos)
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-base font-bold tabular-nums text-primary">
                  +{formatPhp(Math.max(0, lift.liftPhp))}/mo
                </div>
                <div className="font-mono text-[10px] text-muted-foreground">
                  n={lift.negotiatedCount + lift.nonNegotiatedCount}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
