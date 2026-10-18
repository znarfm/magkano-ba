"use client"

import React, { useState } from "react"
import {
  PercentileStats,
  CareerRecord,
  WorkScope,
  MacroIndustry,
} from "@/lib/types"
import { calculateNetArbitrage } from "@/lib/economics"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconSparkles,
  IconKey,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"

interface OfferAuditorProps {
  currentStats: PercentileStats
  currentQuotes: CareerRecord[]
  activeIndustry: MacroIndustry | "ALL"
}

const WORK_SCOPES: { value: WorkScope; label: string }[] = [
  { value: "PH_LOCAL", label: "PH Local Corporate" },
  { value: "FOREIGN_REMOTE", label: "Foreign Remote Contractor" },
  { value: "OVERSEAS_OFW", label: "Overseas (OFW)" },
]

export function OfferAuditor({
  currentStats,
  currentQuotes,
  activeIndustry,
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

  const handleClearKey = () => {
    setApiKey("")
  }

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAuditResult(null)

    if (!apiKey.trim()) {
      setError(
        "Please provide your Gemini API key (BYOK). It stays strictly in your browser localStorage."
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
      setAuditResult(result)
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

  // Determine offer tier visually relative to current slice
  const getOfferTier = () => {
    if (!currentStats.p50) return null
    if (monthlyOffer < currentStats.p25) {
      return {
        label: "Below P25 Floor",
        color: "text-rose-600 border-rose-500/40 bg-rose-500/10",
      }
    }
    if (monthlyOffer <= currentStats.p75) {
      return {
        label: "Competitive Market Band",
        color: "text-emerald-600 border-emerald-500/40 bg-emerald-500/10",
      }
    }
    return {
      label: "Top Quartile (> P75)",
      color: "text-amber-600 border-amber-500/40 bg-amber-500/10",
    }
  }

  const tier = getOfferTier()

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              BYOK Gemini Grounded Offer & Path Auditor
            </CardTitle>
            <Badge variant="outline" className="gap-1 font-mono text-[11px]">
              <IconSparkles className="h-3 w-3 text-amber-500" /> Grounded AI
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Audit your compensation package against verified dataset percentiles
            and TRAIN/8% tax math without hallucinations. Key never leaves your
            browser.
          </CardDescription>
        </div>
        {hasSavedKey && (
          <button
            type="button"
            onClick={handleClearKey}
            className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Clear Saved API Key
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* API Key Box */}
        <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <IconKey className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              Google Gemini API Key (Stored exclusively in browser
              localStorage):
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-8 flex-1 rounded-md border border-input bg-background px-3 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-border bg-background px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Get Free Key ↗
            </a>
          </div>
        </div>

        {/* Visual Benchmark Bar */}
        {currentStats.p50 > 0 && (
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                Offer Benchmark Visualizer:
              </span>
              {tier && (
                <Badge
                  variant="outline"
                  className={`font-mono text-[11px] ${tier.color}`}
                >
                  {tier.label}
                </Badge>
              )}
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(5, (monthlyOffer / (currentStats.p75 * 1.3)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>P25: {formatPhp(currentStats.p25)}</span>
              <span>Median: {formatPhp(currentStats.p50)}</span>
              <span>P75: {formatPhp(currentStats.p75)}</span>
            </div>
          </div>
        )}

        {/* Form Grid */}
        <form
          onSubmit={handleRunAudit}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Target Role / Job Title
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Years of Experience (YOE)
            </label>
            <input
              type="number"
              min="0"
              max="40"
              step="0.5"
              value={yoe}
              onChange={(e) => setYoe(parseFloat(e.target.value) || 0)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Offered Monthly Gross (PHP)
            </label>
            <input
              type="number"
              min="10000"
              step="5000"
              value={monthlyOffer}
              onChange={(e) => setMonthlyOffer(parseFloat(e.target.value) || 0)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Work Scope
            </label>
            <Select
              items={WORK_SCOPES}
              value={workScope}
              onValueChange={(val) => val && setWorkScope(val as WorkScope)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PH_LOCAL" className="text-xs">
                  PH Local Corporate
                </SelectItem>
                <SelectItem value="FOREIGN_REMOTE" className="text-xs">
                  Foreign Remote Contractor
                </SelectItem>
                <SelectItem value="OVERSEAS_OFW" className="text-xs">
                  Overseas (OFW)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              School / Alma Mater
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              disabled={loading}
              className="h-8 w-full gap-1.5 text-xs font-semibold"
            >
              <IconSparkles className="h-3.5 w-3.5" />
              {loading ? "Auditing with Gemini..." : "Audit My Offer"}
            </Button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <IconAlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Audit Result Display */}
        {auditResult && (
          <div className="space-y-2 rounded-lg border border-border/80 bg-muted/10 p-4 text-xs leading-relaxed">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <IconCheck className="h-4 w-4" />
              <span>Grounded Against 2026 CPI Benchmarks</span>
            </div>
            <div className="space-y-2 border-t border-border/40 pt-1 font-sans whitespace-pre-wrap text-foreground/90">
              {auditResult}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
