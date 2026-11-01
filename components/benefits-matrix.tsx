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

const chartConfig = {
  guaranteedMonths: {
    label: "Guaranteed Months",
    color: "var(--chart-1)",
  },
  allowancePhp: {
    label: "Monthly Allowance (PHP)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

export function BenefitsMatrix({ matrix }: BenefitsMatrixProps) {
  const chartData = prepareBenefitsMatrixData(matrix)
  const [viewMode, setViewMode] = useState<"chart" | "table">("table")

  return (
    <Card className="border-border bg-card shadow-none ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">
            Total Compensation & Perks by Industry
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Guaranteed bonus months (13th-16th month), monthly de minimis
            allowances, and annual vacation leaves.
          </CardDescription>
        </div>
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ledger Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("chart")}
            className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors ${
              viewMode === "chart"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Visual Chart
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {viewMode === "chart" ? (
          <ChartContainer config={chartConfig} className="h-[290px] w-full">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 28 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.6}
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
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null
                  const pt = payload[0].payload as IndustryBenefitsPoint
                  return (
                    <div className="space-y-1.5 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg">
                      <div className="font-semibold text-foreground">
                        {pt.industry}
                      </div>
                      <div className="font-mono font-bold tabular-nums text-primary">
                        Guaranteed: {pt.guaranteedMonths} Months Pay
                      </div>
                      <div className="font-mono font-medium tabular-nums text-foreground">
                        Allowance:{" "}
                        {pt.allowancePhp > 0
                          ? `${formatPhp(pt.allowancePhp)}/mo`
                          : "None"}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        Vacation Leaves: {pt.leaveDays} days / Sample: n=
                        {pt.sampleCount}
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="guaranteedMonths"
                name="Guaranteed Months"
                fill="var(--color-guaranteedMonths)"
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
              <Bar
                yAxisId="right"
                dataKey="allowancePhp"
                name="Monthly Allowance"
                fill="var(--color-allowancePhp)"
                radius={[4, 4, 0, 0]}
                maxBarSize={26}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="h-8 text-xs font-medium text-muted-foreground">
                  Industry
                </TableHead>
                <TableHead className="h-8 text-center text-xs font-medium text-muted-foreground">
                  Guaranteed Months
                </TableHead>
                <TableHead className="h-8 text-right text-xs font-medium text-muted-foreground">
                  Median Allowance
                </TableHead>
                <TableHead className="h-8 text-center text-xs font-medium text-muted-foreground">
                  Avg Leaves
                </TableHead>
                <TableHead className="h-8 text-right text-xs font-medium text-muted-foreground">
                  Sample (n)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs tabular-nums">
              {chartData.map((row) => (
                <TableRow
                  key={row.industryKey}
                  className="border-border/50 transition-colors hover:bg-muted/30"
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
                    {row.allowancePhp > 0 ? formatPhp(row.allowancePhp) : "None"}
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
