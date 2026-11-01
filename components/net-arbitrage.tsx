"use client"

import React, { useState } from "react"
import { calculateNetArbitrage } from "@/lib/economics"
import { prepareStackedArbitrageData } from "@/lib/chart-adapters"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Legend,
} from "recharts"

const GUARANTEED_MONTHS_OPTIONS = [
  { value: "12", label: "12 Mos (No 13th Month)" },
  { value: "13", label: "13 Mos (PH Legal Standard)" },
  { value: "14", label: "14 Mos" },
  { value: "15", label: "15 Mos" },
  { value: "16", label: "16 Mos (Top Tier Bank/FMCG)" },
]

const chartConfig = {
  netTakeHome: {
    label: "Net Take-Home",
    color: "var(--chart-1)",
  },
  benefits: {
    label: "Amortized Benefits",
    color: "var(--chart-3)",
  },
  statutory: {
    label: "Statutory (SSS/PHIC/HDMF)",
    color: "var(--chart-2)",
  },
  tax: {
    label: "Income Tax",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function NetArbitrageSimulator() {
  const [localGross, setLocalGross] = useState<number>(60000)
  const [guaranteedMonths, setGuaranteedMonths] = useState<number>(13)
  const [allowance, setAllowance] = useState<number>(2000)
  const [hmoAnnual, setHmoAnnual] = useState<number>(24000)

  const result = calculateNetArbitrage(
    localGross || 0,
    guaranteedMonths,
    allowance || 0,
    hmoAnnual || 0
  )

  const stackedData = prepareStackedArbitrageData(result)

  return (
    <Card className="overflow-hidden border-border bg-card shadow-none ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">
            PH Local vs. Foreign Remote Net Arbitrage Workbench
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Calculate the exact foreign contractor gross rate required to match
            a Philippine corporate package after 2026 TRAIN and 8% flat tax.
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="font-mono text-[11px] text-muted-foreground"
        >
          2026 TRAIN vs. 8% Flat Tax
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left Column: Package Inputs */}
          <div className="space-y-5 p-5 lg:col-span-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="local-gross-input"
                  className="text-xs font-medium text-foreground"
                >
                  PH Local Monthly Base (Gross)
                </label>
                <span className="font-mono text-sm font-bold tabular-nums text-primary">
                  {formatPhp(localGross)}/mo
                </span>
              </div>
              <Slider
                value={[localGross]}
                onValueChange={(val) => {
                  if (Array.isArray(val) && val.length > 0) {
                    setLocalGross(val[0])
                  }
                }}
                min={15000}
                max={300000}
                step={5000}
                className="py-1"
              />
              <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
                <span>₱15k</span>
                <span>₱100k</span>
                <span>₱200k</span>
                <span>₱300k</span>
              </div>
              <Input
                id="local-gross-input"
                type="number"
                min={15000}
                max={1000000}
                step={1000}
                value={localGross}
                onChange={(e) => setLocalGross(parseFloat(e.target.value) || 0)}
                className="h-8 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                Guaranteed Bonus Months
              </label>
              <Select
                items={GUARANTEED_MONTHS_OPTIONS}
                value={String(guaranteedMonths)}
                onValueChange={(v) => v && setGuaranteedMonths(parseInt(v, 10))}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GUARANTEED_MONTHS_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="allowance-input"
                  className="block text-xs font-medium text-foreground"
                >
                  Monthly De Minimis (PHP)
                </label>
                <Input
                  id="allowance-input"
                  type="number"
                  step="500"
                  min="0"
                  value={allowance}
                  onChange={(e) =>
                    setAllowance(parseFloat(e.target.value) || 0)
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="hmo-input"
                  className="block text-xs font-medium text-foreground"
                >
                  Annual HMO Value (PHP)
                </label>
                <Input
                  id="hmo-input"
                  type="number"
                  step="2000"
                  min="0"
                  value={hmoAnnual}
                  onChange={(e) =>
                    setHmoAnnual(parseFloat(e.target.value) || 0)
                  }
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Parity Output & Chart */}
          <div className="flex flex-col justify-between divide-y divide-border lg:col-span-7">
            {/* Top Parity Ledger */}
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="bg-accent/40 p-4 sm:col-span-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Break-Even Remote Gross
                </span>
                <div className="mt-1 font-mono text-2xl font-bold tracking-tight tabular-nums text-primary">
                  {formatPhp(result.remoteBreakEvenMonthlyGross)}
                </div>
                <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                  Required monthly invoice
                </span>
              </div>

              <div className="p-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Local Monthly Net Eq.
                </span>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground">
                  {formatPhp(result.localMonthlyNetEquivalent)}/mo
                </div>
                <span className="mt-1 block font-mono text-[11px] tabular-nums text-muted-foreground">
                  Tax: {formatPhp(result.localMonthlyTax)}/mo
                </span>
              </div>

              <div className="p-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Annual Perks & Bonuses
                </span>
                <div className="mt-1 font-mono text-lg font-bold tabular-nums text-foreground">
                  {formatPhp(result.benefitsAnnualLocal)}/yr
                </div>
                <span className="mt-1 block font-mono text-[11px] tabular-nums text-muted-foreground">
                  +{formatPhp(Math.round(result.benefitsAnnualLocal / 12))}/mo
                  amortized
                </span>
              </div>
            </div>

            {/* Bottom Stacked Comparison Chart */}
            <div className="p-5">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Monthly Compensation & Tax Allocation
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  12-month amortized view
                </span>
              </div>
              <ChartContainer config={chartConfig} className="h-[165px] w-full">
                <BarChart
                  data={stackedData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--border)"
                    strokeOpacity={0.6}
                  />
                  <XAxis
                    type="number"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatPhpK}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={125}
                  />
                  <ChartTooltip
                    formatter={(val: unknown) =>
                      typeof val === "number"
                        ? formatPhp(val)
                        : String(val ?? 0)
                    }
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      fontSize: "11px",
                      borderRadius: "12px",
                    }}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar
                    dataKey="netTakeHome"
                    name="Net Take-Home"
                    stackId="a"
                    fill="var(--color-netTakeHome)"
                  />
                  <Bar
                    dataKey="benefits"
                    name="Amortized Benefits"
                    stackId="a"
                    fill="var(--color-benefits)"
                  />
                  <Bar
                    dataKey="statutory"
                    name="Statutory Deductions"
                    stackId="a"
                    fill="var(--color-statutory)"
                  />
                  <Bar
                    dataKey="tax"
                    name="Income Tax"
                    stackId="a"
                    fill="var(--color-tax)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
