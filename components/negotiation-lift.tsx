"use client"

import React from "react"
import {
  prepareNegotiationChartData,
  NegotiationPoint,
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
  }
}

export function NegotiationLift({ lift }: NegotiationLiftProps) {
  const chartData = prepareNegotiationChartData(lift)
  const hasData = lift.negotiatedCount > 0 && lift.nonNegotiatedCount > 0

  return (
    <Card className="flex flex-col justify-between shadow-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            Fresh Grad Negotiation Lift
          </CardTitle>
          {hasData && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
            >
              +{lift.liftPercent}% Median Lift
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          Starting salary comparison between fresh grads who negotiated vs.
          those who accepted initial offers.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
            Insufficient negotiation records in current filter slice.
          </div>
        ) : (
          <>
            <div className="h-[170px] min-h-0 w-full min-w-0">
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
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="category"
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
                      const pt = payload[0].payload as NegotiationPoint
                      return (
                        <div className="space-y-1 rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
                          <div className="font-semibold text-foreground">
                            {pt.category}
                          </div>
                          <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPhp(pt.median)}/mo
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground">
                            Sample Size: n = {pt.count}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="median" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    <Cell fill="#10b981" />
                    <Cell fill="var(--color-primary)" opacity={0.65} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stat Summary Box */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-emerald-950 dark:text-emerald-200">
                  Expected Monthly Premium:
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(Math.max(0, lift.liftPhp))}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                ≈ +{formatPhp(Math.max(0, lift.liftPhp) * 13)}/year annualized
                with 13th month.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
