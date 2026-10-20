import React from "react"
import { PercentileStats } from "@/lib/types"
import { calculateNetArbitrage } from "@/lib/economics"
import { formatPhp } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  IconChartBar,
  IconArrowsDiff,
  IconTrendingUp,
  IconGlobe,
  IconInfoCircle,
} from "@tabler/icons-react"

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
  // Compute break-even remote rate corresponding to current median local compensation
  const arbitrage = calculateNetArbitrage(
    salaryStats.p50 || 0,
    13,
    2000,
    24000
  )

  const cards = [
    {
      title: "Median Compensation",
      icon: IconChartBar,
      value: formatPhp(salaryStats.p50),
      label: takeHomeParity ? "Monthly Net Take-Home" : "Gross Monthly Base",
      badge: "P50 Benchmark",
      badgeColor:
        "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      accent: "text-emerald-500",
      subtext: cpiAdjusted ? "2026 PSA CPI adjusted" : "Nominal reported rate",
      tooltip:
        "The 50th percentile (P50) baseline across current active filters.",
    },
    {
      title: "Interquartile Spread",
      icon: IconArrowsDiff,
      value: `${formatPhp(salaryStats.p25)} – ${formatPhp(salaryStats.p75)}`,
      label: "Middle 50% Cohort Range",
      badge: "P25 Floor – P75 Top",
      badgeColor:
        "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10",
      accent: "text-blue-500",
      subtext: `IQR spread: ${formatPhp(salaryStats.p75 - salaryStats.p25)}`,
      tooltip:
        "The middle 50% distribution. Half of all respondents fall between P25 (entry floor) and P75 (top quartile).",
    },
    {
      title: "Remote Arbitrage Target",
      icon: IconGlobe,
      value: formatPhp(arbitrage.remoteBreakEvenMonthlyGross),
      label: "Break-Even Contractor Gross",
      badge: "8% Flat Tax Parity",
      badgeColor:
        "border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10",
      accent: "text-cyan-500",
      subtext: `Matches local net: ${formatPhp(arbitrage.localMonthlyNetEquivalent)}/mo`,
      tooltip:
        "Gross rate a remote contractor must bill under 8% flat tax to match local net pay after TRAIN, 13th month, HMO, and allowances.",
    },
    {
      title: "Negotiation Lift",
      icon: IconTrendingUp,
      value:
        negotiationLift.liftPercent > 0
          ? `+${negotiationLift.liftPercent.toFixed(1)}%`
          : "—",
      label: "Median Premium for Negotiators",
      badge: `${negotiationLift.negotiatedCount} negotiated`,
      badgeColor:
        "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10",
      accent: "text-amber-500",
      subtext:
        negotiationLift.liftPhp > 0
          ? `+${formatPhp(negotiationLift.liftPhp)}/mo advantage`
          : "Insufficient sample",
      tooltip:
        "Empirical compensation advantage achieved by candidates who negotiated their initial offer versus those who accepted without counter-offering.",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur-xs transition-all duration-150 hover:border-border hover:bg-card/90 hover:shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                <Icon className={`h-3.5 w-3.5 ${card.accent}`} />
                {card.title}
                <Tooltip>
                  <TooltipTrigger className="cursor-help text-muted-foreground/60 hover:text-muted-foreground">
                    <IconInfoCircle className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs font-normal">
                    {card.tooltip}
                  </TooltipContent>
                </Tooltip>
              </span>
              <span
                className={`rounded-full border px-1.5 py-0.2 font-mono text-[10px] font-medium ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>
            <div className="mt-2 font-mono text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              {card.value}
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{card.label}</span>
              <span className="font-mono text-[11px] opacity-80">{card.subtext}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
