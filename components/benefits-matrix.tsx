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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
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
    <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-base font-bold tracking-tight">
            Total Comp & Benefits Structure by Macro Industry
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Guaranteed bonus months (13th–16th month), monthly de minimis
            allowances, and annual leave averages.
          </CardDescription>
        </div>
        <div className="flex items-center rounded-md border border-border/70 bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
              viewMode === "chart"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visual Ranking
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-sm px-2 py-1 text-[11px] font-medium transition-colors ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
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
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--border)"
                  strokeOpacity={0.4}
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
                      <div className="space-y-1.5 rounded-xl border border-border/80 bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-md">
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
                  fill="var(--primary)"
                  opacity={0.8}
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
          <Table>
            <TableHeader>
              <TableRow className="border-border/70 hover:bg-transparent">
                <TableHead className="h-9 text-xs font-semibold text-muted-foreground">
                  Macro Industry
                </TableHead>
                <TableHead className="h-9 text-center text-xs font-semibold text-muted-foreground">
                  Guaranteed Months
                </TableHead>
                <TableHead className="h-9 text-right text-xs font-semibold text-muted-foreground">
                  Median Allowance
                </TableHead>
                <TableHead className="h-9 text-center text-xs font-semibold text-muted-foreground">
                  Avg Leaves
                </TableHead>
                <TableHead className="h-9 text-right text-xs font-semibold text-muted-foreground">
                  Sample (n)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {chartData.map((row) => (
                <TableRow
                  key={row.industryKey}
                  className="border-border/40 transition-colors hover:bg-muted/30"
                >
                  <TableCell className="font-sans font-medium text-foreground">
                    {row.industry}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        row.guaranteedMonths >= 14 ? "default" : "secondary"
                      }
                      className="font-mono text-[11px]"
                    >
                      {row.guaranteedMonths} mos
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.allowancePhp > 0 ? formatPhp(row.allowancePhp) : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.leaveDays} days
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.sampleCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
