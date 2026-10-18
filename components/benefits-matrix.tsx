"use client"

import React, { useState } from "react"
import { MacroIndustry } from "@/lib/types"
import {
  prepareBenefitsMatrixData,
  IndustryBenefitsPoint,
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
  Legend,
} from "recharts"

interface BenefitsMatrixProps {
  matrix: Record<
    MacroIndustry,
    {
      sampleCount: number
      medianGuaranteedMonths: number
      medianAllowancePhp: number
      avgLeaveDays: number
    }
  >
}

export function BenefitsMatrix({ matrix }: BenefitsMatrixProps) {
  const chartData = prepareBenefitsMatrixData(matrix)
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart")

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base">
            Total Comp & Benefits Structure by Macro Industry
          </CardTitle>
          <CardDescription className="text-xs">
            Guaranteed bonus months (13th–16th month), monthly de minimis
            allowances, and annual leave averages.
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "chart"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visual Ranking
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "table"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Detailed Table
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {viewMode === "chart" ? (
          <div className="h-[280px] min-h-0 w-full min-w-0 pt-2">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="industry"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  yAxisId="left"
                  domain={[12, 16]}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val: number) => `${val} mos`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatPhpK}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const pt = payload[0].payload as IndustryBenefitsPoint
                    return (
                      <div className="space-y-1 rounded-lg border border-border bg-card p-3 text-xs shadow-md">
                        <div className="font-semibold text-foreground">
                          {pt.industry}
                        </div>
                        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Guaranteed: {pt.guaranteedMonths} Months Pay
                        </div>
                        <div className="font-mono font-medium text-blue-600 dark:text-blue-400">
                          Allowance:{" "}
                          {pt.allowancePhp > 0
                            ? `${formatPhp(pt.allowancePhp)}/mo`
                            : "None"}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          Vacation Leaves: {pt.leaveDays} days · Sample: n=
                          {pt.sampleCount}
                        </div>
                      </div>
                    )
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="guaranteedMonths"
                  name="Guaranteed Months"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  yAxisId="right"
                  dataKey="allowancePhp"
                  name="Monthly Allowance (₱)"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/70 font-semibold text-muted-foreground">
                  <th className="py-2.5 pr-4">Macro Industry</th>
                  <th className="px-3 py-2.5 text-center">Guaranteed Months</th>
                  <th className="px-3 py-2.5 text-right">Median Allowance</th>
                  <th className="px-3 py-2.5 text-center">Avg Leaves</th>
                  <th className="py-2.5 pl-3 text-right">Sample (n)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {chartData.map((row) => (
                  <tr
                    key={row.industryKey}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="py-2.5 pr-4 font-sans font-medium text-foreground">
                      {row.industry}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        variant={
                          row.guaranteedMonths >= 14 ? "default" : "secondary"
                        }
                        className="font-mono text-[11px]"
                      >
                        {row.guaranteedMonths} mos
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {row.allowancePhp > 0 ? formatPhp(row.allowancePhp) : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.leaveDays} days
                    </td>
                    <td className="py-2.5 pl-3 text-right text-muted-foreground">
                      {row.sampleCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
