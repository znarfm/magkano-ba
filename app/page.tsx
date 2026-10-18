"use client"

import React, { useEffect, useMemo, useState } from "react"
import { z } from "zod"
import { CareerRecord, CareerRecordSchema, FilterState } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { queryDashboardSlice } from "@/lib/analytics"
import { FilterBar } from "@/components/filter-bar"
import { PercentileExplorer } from "@/components/percentile-explorer"
import { NegotiationLift } from "@/components/negotiation-lift"
import { NetArbitrageSimulator } from "@/components/net-arbitrage"
import { BenefitsMatrix } from "@/components/benefits-matrix"
import { SchoolConvergence } from "@/components/school-convergence"
import { MentorQuotesFeed } from "@/components/mentor-quotes"
import { OfferAuditor } from "@/components/auditor/offer-auditor"
import { MethodologyModal } from "@/components/methodology-modal"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  IconChartLine,
  IconScale,
  IconSparkles,
  IconMessage2,
  IconBuildingArch,
} from "@tabler/icons-react"

export default function DashboardPage() {
  const [records, setRecords] = useState<CareerRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [filter, setFilter] = useLocalStorage<FilterState>("mb_filters", {
    macroIndustry: "ALL",
    roleFamily: "ALL",
    seniorityBand: "ALL",
    workScopes: ["PH_LOCAL", "FOREIGN_REMOTE"],
    cpiAdjusted: true,
    takeHomeParity: false,
    schoolTier: "ALL",
    searchQuery: "",
  })

  useEffect(() => {
    fetch("/data/records.json")
      .then((res) => res.json())
      .then((raw) => {
        const parsed = z.array(CareerRecordSchema).safeParse(raw)
        if (parsed.success) {
          setRecords(parsed.data)
        } else {
          console.error(
            "Schema validation warning on records.json:",
            parsed.error.issues.length,
            "issues"
          )
          if (Array.isArray(raw)) {
            setRecords(raw as CareerRecord[])
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load dataset:", err)
        setLoading(false)
      })
  }, [])

  const analytics = useMemo(() => {
    return queryDashboardSlice(records, filter)
  }, [records, filter])

  const [activeTab, setActiveTab] = useState("curves")

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 px-4 py-4 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇵🇭</span>
              <h1 className="text-xl font-bold tracking-tight">Magkano Ba?</h1>
              <Badge
                variant="outline"
                className="border-primary/40 py-0 font-mono text-[11px] text-primary"
              >
                2026 PSA CPI Rebased
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Filipino Career & Compensation Intelligence · 4,000+ Verified
              Community Records
            </p>
          </div>
          <div className="hidden items-center gap-3 font-mono text-xs text-muted-foreground sm:flex">
            <span>PSA CPI Index: 134.5</span>
            <span>•</span>
            <span>TRAIN 2026 Brackets</span>
          </div>
        </div>
      </header>

      {/* Sticky Global Filter Bar */}
      <FilterBar
        filter={filter}
        onChange={setFilter}
        totalCount={records.length}
        filteredCount={analytics.filteredCount}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading 4,000+ normalized records...</span>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(val) => val && setActiveTab(val)}
            className="space-y-6"
          >
            <div className="overflow-x-auto pb-1">
              <TabsList className="h-9 p-1">
                <TabsTrigger value="curves" className="gap-1.5 px-3 text-xs">
                  <IconChartLine className="h-3.5 w-3.5" /> Compensation Curves
                </TabsTrigger>
                <TabsTrigger value="arbitrage" className="gap-1.5 px-3 text-xs">
                  <IconScale className="h-3.5 w-3.5" /> Net Arbitrage Simulator
                </TabsTrigger>
                <TabsTrigger value="schools" className="gap-1.5 px-3 text-xs">
                  <IconBuildingArch className="h-3.5 w-3.5" /> Schools &
                  Benefits
                </TabsTrigger>
                <TabsTrigger value="auditor" className="gap-1.5 px-3 text-xs">
                  <IconSparkles className="h-3.5 w-3.5 text-amber-500" /> BYOK
                  Offer Auditor
                </TabsTrigger>
                <TabsTrigger value="quotes" className="gap-1.5 px-3 text-xs">
                  <IconMessage2 className="h-3.5 w-3.5" /> Mentor Stories (
                  {analytics.mentorQuotes.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Compensation Curves & Negotiation Lift */}
            <TabsContent value="curves" className="space-y-6">
              {activeTab === "curves" && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <PercentileExplorer
                      stats={analytics.salaryStats}
                      bySeniority={analytics.bySeniority}
                      cpiAdjusted={filter.cpiAdjusted}
                      takeHomeParity={filter.takeHomeParity}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <NegotiationLift lift={analytics.negotiationLift} />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Net Arbitrage Simulator */}
            <TabsContent value="arbitrage" className="space-y-6">
              {activeTab === "arbitrage" && (
                <div className="space-y-6">
                  <NetArbitrageSimulator />
                </div>
              )}
            </TabsContent>

            {/* TAB 3: Schools & Benefits Matrix */}
            <TabsContent value="schools" className="space-y-6">
              {activeTab === "schools" && (
                <div className="space-y-6">
                  <SchoolConvergence
                    bySchoolTier={analytics.bySchoolTier}
                    cpiAdjusted={filter.cpiAdjusted}
                  />
                  <BenefitsMatrix matrix={analytics.benefitsMatrix} />
                </div>
              )}
            </TabsContent>

            {/* TAB 4: BYOK Gemini Offer Auditor */}
            <TabsContent value="auditor" className="space-y-6">
              {activeTab === "auditor" && (
                <div className="space-y-6">
                  <OfferAuditor
                    currentStats={analytics.salaryStats}
                    currentQuotes={analytics.mentorQuotes}
                    activeIndustry={filter.macroIndustry || "TECH_IT"}
                  />
                </div>
              )}
            </TabsContent>

            {/* TAB 5: Mentor Advice Stories */}
            <TabsContent value="quotes" className="space-y-6">
              {activeTab === "quotes" && (
                <MentorQuotesFeed
                  quotes={analytics.mentorQuotes}
                  cpiAdjusted={filter.cpiAdjusted}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card/40 px-4 py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p>
            Data sourced from community responses in the{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1gnA91Tjr_3UCNV8x1_LoE0oC56r-pXXRdJcgTfOLlm0/edit?usp=sharing"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              Liyab First Pay Survey
            </a>{" "}
            and{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/14RExibfpaRE0-81jjLvm374_BihMpq7zjUyFKwAqetU/edit?usp=sharing"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              Work/Career Path Information Sheet
            </a>
            .
          </p>
          <div className="flex items-center gap-4">
            <MethodologyModal />
            <span className="font-mono text-[11px]">
              100% Client-Side · No Tracking · BYOK Gemini Grounding
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
