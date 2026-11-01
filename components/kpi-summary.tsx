import React from "react"
import { PercentileStats } from "@/lib/types"
import { calculateNetArbitrage } from "@/lib/economics"
import { formatPhp } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { IconInfoCircle } from "@tabler/icons-react"

interface KpiSummaryProps {
  salaryStats: PercentileStats
  negotiationLift: {
    liftPhp: number
    liftPercent: number
    negotiatedMedian: number
    nonNegotiatedMedian: number
    negotiatedCount: number
    nonNegotiatedCount: number
  }
  cpiAdjusted: boolean
  takeHomeParity: boolean
}

export function KpiSummary({
  salaryStats,
  negotiationLift,
  cpiAdjusted,
  takeHomeParity,
}: KpiSummaryProps) {
  const arbitrage = calculateNetArbitrage(
    salaryStats.p50 || 0,
    13,
    2000,
    24000
  )

  const metrics = [
    {
      title: "Median Compensation",
      value: formatPhp(salaryStats.p50),
      tag: "P50",
      sublabel: takeHomeParity ? "Monthly net take-home" : "Gross monthly base",
      detail: cpiAdjusted ? "2026 CPI indexed" : "Nominal reported",
      tooltip:
        "50th percentile (P50) baseline across active filter selection.",
    },
    {
      title: "Middle 50% Range",
      value: `${formatPhp(salaryStats.p25)} - ${formatPhp(salaryStats.p75)}`,
      tag: "P25-P75",
      sublabel: "Interquartile cohort band",
      detail: `Spread: ${formatPhp(Math.max(0, salaryStats.p75 - salaryStats.p25))}`,
      tooltip:
        "Half of all respondents fall between the P25 floor and P75 upper quartile.",
    },
    {
      title: "Remote Break-Even",
      value: formatPhp(arbitrage.remoteBreakEvenMonthlyGross),
      tag: "8% Tax",
      sublabel: "Contractor gross parity",
      detail: `Local net eq: ${formatPhp(arbitrage.localMonthlyNetEquivalent)}/mo`,
      tooltip:
        "Monthly gross rate a remote contractor needs under 8% flat tax to match local net pay after TRAIN, 13th month, HMO, and allowances.",
    },
    {
      title: "Negotiation Premium",
      value:
        negotiationLift.liftPercent > 0
          ? `+${negotiationLift.liftPercent.toFixed(1)}%`
          : "N/A",
      tag: `n=${negotiationLift.negotiatedCount}`,
      sublabel: "Entry-level counter-offer lift",
      detail:
        negotiationLift.liftPhp > 0
          ? `+${formatPhp(negotiationLift.liftPhp)}/mo advantage`
          : "Insufficient sample",
      tooltip:
        "Empirical median advantage earned by candidates who negotiated their initial offer versus those who accepted as-is.",
    },
  ]

  return (
    <section
      aria-label="Key compensation benchmarks"
      className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
    >
      {metrics.map((item, idx) => (
        <div
          key={item.title}
          className={`flex flex-col justify-between p-4 ${
            idx >= 2 ? "sm:border-t sm:border-border lg:border-t-0" : ""
          } ${idx % 2 === 1 ? "sm:border-l sm:border-border lg:border-l-0" : ""}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {item.title}
              <Tooltip>
                <TooltipTrigger className="cursor-help text-muted-foreground/60 hover:text-foreground">
                  <IconInfoCircle className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {item.tooltip}
                </TooltipContent>
              </Tooltip>
            </span>
            <span className="rounded-md bg-accent px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent-foreground">
              {item.tag}
            </span>
          </div>

          <div className="mt-2 font-mono text-xl font-bold tracking-tight tabular-nums text-foreground sm:text-2xl">
            {item.value}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="truncate">{item.sublabel}</span>
            <span className="shrink-0 font-mono tabular-nums text-foreground/80">
              {item.detail}
            </span>
          </div>
        </div>
      ))}
    </section>
  )
}
