"use client"

import React, { useMemo, useState } from "react"
import type {
  PercentileStats,
  CareerRecord,
  WorkScope,
  MacroIndustry,
} from "@/lib/types"
import {
  calculateNetArbitrage,
  computeCompensationView,
} from "@/lib/economics"
import { computePercentileRank } from "@/lib/analytics"
import { buildGroundedAuditPrompt, callGeminiAudit } from "@/lib/auditor"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { formatPhp } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  IconSparkles,
  IconKey,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"

interface OfferAuditorProps {
  currentStats: PercentileStats
  salaryValues?: number[]
  currentQuotes: CareerRecord[]
  activeIndustry: MacroIndustry | "ALL"
  takeHomeParity?: boolean
}

const WORK_SCOPES: { value: WorkScope; label: string }[] = [
  { value: "PH_LOCAL", label: "PH Local Corporate" },
  { value: "FOREIGN_REMOTE", label: "Foreign Remote Contractor" },
  { value: "OVERSEAS_OFW", label: "Overseas (OFW)" },
]

export function OfferAuditor({
  currentStats,
  salaryValues = [],
  currentQuotes,
  activeIndustry,
  takeHomeParity = false,
}: OfferAuditorProps) {
  const [apiKey, setApiKey] = useLocalStorage<string>(
    "ph_career_gemini_key",
    ""
  )
  const [role, setRole] = useState<string>("Software Engineer")
  const [yoe, setYoe] = useState<number>(2)
  const [monthlyOffer, setMonthlyOffer] = useState<number>(50000)
  const [workScope, setWorkScope] = useState<WorkScope>("PH_LOCAL")
  const [school, setSchool] = useState<string>("UP Diliman")

  const [loading, setLoading] = useState<boolean>(false)
  const [auditResult, setAuditResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasSavedKey = Boolean(apiKey.trim())

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAuditResult(null)

    if (!apiKey.trim()) {
      setError(
        "Open the Gemini Key menu in the top-right corner of this panel to add your API key (stored locally in your browser)."
      )
      return
    }

    try {
      setLoading(true)
      const arbitrage = calculateNetArbitrage(monthlyOffer)
      const payload = buildGroundedAuditPrompt(
        {
          role,
          yoe,
          monthlyOfferPhp: monthlyOffer,
          workScope,
          school,
          macroIndustry: activeIndustry === "ALL" ? "OTHER" : activeIndustry,
        },
        currentStats,
        arbitrage,
        currentQuotes
      )

      const result = await callGeminiAudit(apiKey.trim(), payload)
      setAuditResult(result.replace(/[—–]/g, "-"))
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Audit failed. Check your API key and network."
      )
    } finally {
      setLoading(false)
    }
  }

  const instantArbitrage = useMemo(
    () => calculateNetArbitrage(monthlyOffer),
    [monthlyOffer]
  )
  const comparableOffer = useMemo(
    () =>
      computeCompensationView(
        {
          cohortYear: 2026,
          workScope,
          nominalMonthlyGrossPhp: {
            min: monthlyOffer,
            median: monthlyOffer,
            max: monthlyOffer,
          },
          benefits: {
            guaranteedMonths: workScope === "FOREIGN_REMOTE" ? 12 : 13,
            monthlyAllowancePhp: 0,
            hmoCoveragePhp: null,
            vacationLeaveDays: null,
            rawBenefitsSummary: null,
          },
        },
        { cpiAdjusted: false, takeHomeParity }
      ),
    [takeHomeParity, monthlyOffer, workScope]
  )

  const getOfferTierLabel = () => {
    if (!currentStats.p50) return null
    if (comparableOffer < currentStats.p25) return "Below P25 Floor"
    if (comparableOffer <= currentStats.p75) return "Middle 50% Market Band"
    return "Top Quartile (> P75)"
  }

  const tierLabel = getOfferTierLabel()
  const percentileRank = useMemo(
    () => computePercentileRank(salaryValues, comparableOffer),
    [salaryValues, comparableOffer]
  )

  return (
    <Card className="overflow-hidden border-border bg-card shadow-none ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">
            Grounded Offer & Career Path Auditor
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Compare any job offer against verified cohort percentiles, TRAIN/8%
            tax math, and practitioner field notes.
          </CardDescription>
        </div>

        {/* Compact BYOK API Key Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                aria-label={hasSavedKey ? "Gemini Key Saved" : "Set Gemini Key"}
                className="h-8 gap-1.5 bg-background text-xs"
              />
            }
          >
            <IconKey
              className={`size-3.5 ${
                hasSavedKey ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span>{hasSavedKey ? "Gemini Key Saved" : "Set Gemini Key"}</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-3 p-3.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  BYOK Gemini API Key
                </span>
                {hasSavedKey && (
                  <button
                    type="button"
                    onClick={() => setApiKey("")}
                    className="text-[11px] font-medium text-destructive hover:underline"
                  >
                    Clear key
                  </button>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Stored strictly in your browser localStorage. Never sent to any
                intermediary server.
              </p>
            </div>
            <Input
              type="password"
              aria-label="Google Gemini API Key"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-8 font-mono text-xs"
            />
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                Get free key from Google AI Studio
              </a>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left Column: Offer Form */}
          <form
            onSubmit={handleRunAudit}
            className="space-y-4 p-5 lg:col-span-5"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="audit-role"
                className="block text-xs font-medium text-foreground"
              >
                Target Role / Job Title
              </label>
              <Input
                id="audit-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="audit-yoe"
                  className="block text-xs font-medium text-foreground"
                >
                  Experience (YOE)
                </label>
                <Input
                  id="audit-yoe"
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={yoe}
                  onChange={(e) => setYoe(parseFloat(e.target.value) || 0)}
                  className="h-8 font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="audit-offer"
                  className="block text-xs font-medium text-foreground"
                >
                  Monthly Gross (PHP)
                </label>
                <Input
                  id="audit-offer"
                  type="number"
                  min="3000"
                  step="5000"
                  value={monthlyOffer}
                  onChange={(e) =>
                    setMonthlyOffer(parseFloat(e.target.value) || 0)
                  }
                  className="h-8 font-mono text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">
                  Work Scope
                </label>
                <Select
                  items={WORK_SCOPES}
                  value={workScope}
                  onValueChange={(val) => val && setWorkScope(val as WorkScope)}
                >
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_SCOPES.map((ws) => (
                      <SelectItem
                        key={ws.value}
                        value={ws.value}
                        className="text-xs"
                      >
                        {ws.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="audit-school"
                  className="block text-xs font-medium text-foreground"
                >
                  Alma Mater
                </label>
                <Input
                  id="audit-school"
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-8 w-full gap-1.5 text-xs font-semibold"
            >
              <IconSparkles className="size-3.5" />
              <span>{loading ? "Auditing Offer..." : "Audit Offer"}</span>
            </Button>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Right Column: Live Deterministic Standing & Grounded Audit Output */}
          <div className="flex flex-col divide-y divide-border lg:col-span-7">
            {currentStats.p50 > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x sm:divide-border">
                <div className="bg-accent/40 p-3.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Cohort Standing
                  </span>
                  <div className="mt-1 font-mono text-xl font-bold tabular-nums text-primary">
                    P{percentileRank}
                  </div>
                  {tierLabel && (
                    <span className="mt-0.5 block text-[10px] font-medium text-foreground/80">
                      {tierLabel}
                    </span>
                  )}
                </div>

                <div className="border-l border-border p-3.5 sm:border-l-0">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Cohort Median (P50)
                  </span>
                  <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatPhp(currentStats.p50)}/mo
                  </div>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-muted-foreground">
                    P25: {formatPhp(currentStats.p25)}
                  </span>
                </div>

                <div className="border-t border-border p-3.5 sm:border-t-0">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Local Net Take-Home
                  </span>
                  <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatPhp(instantArbitrage.localMonthlyNetEquivalent)}/mo
                  </div>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-muted-foreground">
                    After TRAIN & SSS
                  </span>
                </div>

                <div className="border-t border-l border-border p-3.5 sm:border-t-0 sm:border-l-0">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Remote Break-Even
                  </span>
                  <div className="mt-1 font-mono text-sm font-bold tabular-nums text-foreground">
                    {formatPhp(instantArbitrage.remoteBreakEvenMonthlyGross)}/mo
                  </div>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums text-muted-foreground">
                    8% flat tax parity
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 p-5">
              {auditResult ? (
                <div className="space-y-2.5 text-xs leading-relaxed">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                      <IconCheck className="size-3.5" />
                      Grounded Against 2026 CPI Benchmarks
                    </span>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      n={currentStats.count} cohort records
                    </Badge>
                  </div>
                  <div className="border-t border-border pt-2.5 font-sans whitespace-pre-wrap text-foreground/90">
                    {auditResult}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[160px] flex-col items-center justify-center text-center">
                  <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                    Instant deterministic percentile and tax parity metrics
                    update live above as you type. Add a free Gemini API key and
                    run <strong className="text-foreground">Audit Offer</strong>{" "}
                    for a tailored negotiation memo grounded in{" "}
                    <span className="font-mono text-foreground">
                      {currentStats.count.toLocaleString()}
                    </span>{" "}
                    matching records.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
