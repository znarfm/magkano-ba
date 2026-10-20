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
import { formatPhp, formatPhpK } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

const GUARANTEED_MONTHS_OPTIONS = [
  { value: "12", label: "12 Mos (No 13th Month)" },
  { value: "13", label: "13 Mos (PH Legal Standard)" },
  { value: "14", label: "14 Mos" },
  { value: "15", label: "15 Mos" },
  { value: "16", label: "16 Mos (Top Tier Bank/FMCG)" },
]

export function NetArbitrageSimulator() {
  const [localGross, setLocalGross] = useState<number>(60000)
  const [guaranteedMonths, setGuaranteedMonths] = useState<number>(13)
  const [allowance, setAllowance] = useState<number>(2000)
  const hmoAnnual = 24000

  const result = calculateNetArbitrage(
    localGross || 0,
    guaranteedMonths,
    allowance || 0,
    hmoAnnual || 0
  )

  const stackedData = prepareStackedArbitrageData(result)

  return (
    <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base font-bold tracking-tight">
            PH Local vs. Foreign Remote Net Arbitrage Simulator
          </CardTitle>
          <Badge
            variant="outline"
            className="border-primary/30 bg-muted/50 font-mono text-xs text-muted-foreground"
          >
            2026 TRAIN vs. 8% Freelance Tax
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Interactive break-even calculator: find the exact foreign contractor
          rate needed to match your PH corporate package.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/70 bg-muted/20 p-3.5 sm:grid-cols-2">
          {/* Base Salary Slider */}
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                PH Local Monthly Base Salary:
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
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
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>₱15k</span>
              <span>₱100k</span>
              <span>₱200k</span>
              <span>₱300k</span>
            </div>
          </div>

          {/* Guaranteed Months */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Guaranteed Months
            </label>
            <Select
              items={GUARANTEED_MONTHS_OPTIONS}
              value={String(guaranteedMonths)}
              onValueChange={(v) => v && setGuaranteedMonths(parseInt(v, 10))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12" className="text-xs">
                  12 Mos (No 13th Month)
                </SelectItem>
                <SelectItem value="13" className="text-xs">
                  13 Mos (PH Legal Standard)
                </SelectItem>
                <SelectItem value="14" className="text-xs">
                  14 Mos
                </SelectItem>
                <SelectItem value="15" className="text-xs">
                  15 Mos
                </SelectItem>
                <SelectItem value="16" className="text-xs">
                  16 Mos (Top Tier Bank/FMCG)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allowance */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Monthly De Minimis Allowance
            </label>
            <Input
              type="number"
              step="500"
              min="0"
              value={allowance}
              onChange={(e) => setAllowance(parseFloat(e.target.value) || 0)}
              className="h-8 font-mono text-xs"
            />
          </div>
        </div>

        {/* Break-Even Rate Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-blue-900 uppercase dark:text-blue-300">
              Required Break-Even Remote Contract:
            </span>
            <div className="mt-0.5 font-mono text-2xl font-extrabold text-blue-700 dark:text-blue-300">
              {formatPhp(result.remoteBreakEvenMonthlyGross)}
              <span className="text-xs font-normal text-muted-foreground">
                /month
              </span>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="font-mono text-muted-foreground">
              Net Take-Home:{" "}
              <strong className="text-foreground">
                {formatPhp(result.localMonthlyNetEquivalent)}/mo
              </strong>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              Annual Benefits & Bonuses: {formatPhp(result.benefitsAnnualLocal)}
            </div>
          </div>
        </div>

        {/* Stacked Breakdown Chart */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-foreground">
            Monthly Package Component Breakdown (Take-Home vs. Taxes & Benefits)
          </span>
          <div className="h-[140px] min-h-0 w-full min-w-0 pt-1">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart
                data={stackedData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  horizontal={false}
                  stroke="var(--border)"
                  strokeOpacity={0.4}
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
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val: unknown) =>
                    typeof val === "number" ? formatPhp(val) : String(val ?? 0)
                  }
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    fontSize: "11px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Bar
                  dataKey="netTakeHome"
                  name="Net Take-Home"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="tax"
                  name="Income Tax"
                  stackId="a"
                  fill="#ef4444"
                />
                <Bar
                  dataKey="statutory"
                  name="Mandatory Deductions"
                  stackId="a"
                  fill="#f59e0b"
                />
                <Bar
                  dataKey="benefits"
                  name="Annual Benefits Value"
                  stackId="a"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
