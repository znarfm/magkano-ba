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
import { formatPhp, formatPhpK } from "@/lib/utils"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    nonNegotiatedStats?: { p25: number; p50: number; p75: number }
  }
}

export function NegotiationLift({ lift }: NegotiationLiftProps) {
  const chartData = [
    {
      category: "Negotiated",
      p25: lift.negotiatedStats?.p25 || Math.round(lift.negotiatedMedian * 0.85),
      median: lift.negotiatedMedian,
      p75: lift.negotiatedStats?.p75 || Math.round(lift.negotiatedMedian * 1.2),
      count: lift.negotiatedCount,
    },
    {
      category: "Did Not Negotiate",
      p25: lift.nonNegotiatedStats?.p25 || Math.round(lift.nonNegotiatedMedian * 0.85),
      median: lift.nonNegotiatedMedian,
      p75: lift.nonNegotiatedStats?.p75 || Math.round(lift.nonNegotiatedMedian * 1.2),
      count: lift.nonNegotiatedCount,
    },
  ]
  const hasData = lift.negotiatedCount > 0 && lift.nonNegotiatedCount > 0

  return (
    <Card className="flex flex-col justify-between border-border/70 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-bold tracking-tight">
            Fresh Grad Negotiation Lift
          </CardTitle>
          {hasData && (
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
            >
              +{lift.liftPercent}% Median Lift
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Salary comparison between entry-level grads who negotiated vs. those who accepted initial offers (Liyab cohort).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            Insufficient negotiation records in current filter slice.
          </div>
        ) : (
          <>
            <div className="h-[180px] min-h-0 w-full min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
              >
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.4}
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
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const pt = payload[0].payload as typeof chartData[0]
                      return (
                        <div className="space-y-1.5 rounded-xl border border-border/80 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-md">
                          <div className="font-semibold text-foreground">
                            {pt.category}
                          </div>
                          <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            Median: {formatPhp(pt.median)}/mo
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            Interquartile (P25–P75): {formatPhp(pt.p25)} – {formatPhp(pt.p75)}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                            Sample Size: n = {pt.count.toLocaleString()} offers
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="median" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    <Cell fill="#10b981" />
                    <Cell fill="var(--muted-foreground)" opacity={0.6} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stat Summary Box */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-emerald-950 dark:text-emerald-200">
                  Expected Monthly Premium:
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(Math.max(0, lift.liftPhp))}
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                ≈ +{formatPhp(Math.max(0, lift.liftPhp) * 13)}/yr with 13th month bonus. Sample: n={lift.negotiatedCount + lift.nonNegotiatedCount} offers.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
