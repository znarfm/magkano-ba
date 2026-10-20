"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { z } from "zod"
import { CareerRecord, CareerRecordSchema, FilterState } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { queryDashboardSlice, queryGranularSchoolStats } from "@/lib/analytics"
import { prepareGranularSchoolData } from "@/lib/chart-adapters"
import { FilterBar } from "@/components/filter-bar"
import { PercentileExplorer } from "@/components/percentile-explorer"
import { NegotiationLift } from "@/components/negotiation-lift"
import { NavigationHeader } from "@/components/navigation-header"
import { MethodologyModal } from "@/components/methodology-modal"
import { KpiSummary } from "@/components/kpi-summary"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconChartLine,
  IconScale,
  IconSparkles,
  IconBuildingArch,
} from "@tabler/icons-react"

const NetArbitrageSimulator = dynamic(
  () =>
    import("@/components/net-arbitrage").then(
      (mod) => mod.NetArbitrageSimulator
    ),
  { ssr: false }
)
const SchoolConvergence = dynamic(
  () =>
    import("@/components/school-convergence").then(
      (mod) => mod.SchoolConvergence
    ),
  { ssr: false }
)
const BenefitsMatrix = dynamic(
  () =>
    import("@/components/benefits-matrix").then((mod) => mod.BenefitsMatrix),
  { ssr: false }
)
const OfferAuditor = dynamic(
  () =>
    import("@/components/auditor/offer-auditor").then(
      (mod) => mod.OfferAuditor
    ),
  { ssr: false }
)

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
        if (process.env.NODE_ENV === "development") {
          const parsed = z.array(CareerRecordSchema).safeParse(raw)
          if (parsed.success) {
            setRecords(parsed.data)
          } else {
            console.error(
              "Schema validation warning on records.json:",
              parsed.error.issues.length,
              "issues"
            )
            setRecords(Array.isArray(raw) ? (raw as CareerRecord[]) : [])
          }
        } else {
          setRecords(Array.isArray(raw) ? (raw as CareerRecord[]) : [])
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

  const granularSchools = useMemo(() => {
    const stats = queryGranularSchoolStats(records, {
      cpiAdjusted: filter.cpiAdjusted,
      takeHomeParity: filter.takeHomeParity,
      minCount: 15,
    })
    return prepareGranularSchoolData(stats)
  }, [records, filter.cpiAdjusted, filter.takeHomeParity])

  const [activeTab, setActiveTab] = useState("curves")

  // Sync tab with URL query parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      if (
        tabParam &&
        ["curves", "arbitrage", "schools", "auditor"].includes(tabParam)
      ) {
        setActiveTab(tabParam)
      }
    }
  }, [])

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.set("tab", val)
      window.history.replaceState({}, "", url.toString())
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {/* Top Header Navigation */}
      <NavigationHeader />

      {/* Sticky Global Filter Bar */}
      <FilterBar
        filter={filter}
        onChange={setFilter}
        totalCount={records.length}
        filteredCount={analytics.filteredCount}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <Skeleton className="h-8.5 w-80 rounded-lg" />
            <Skeleton className="h-[360px] w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Executive KPI Benchmark Strip */}
            <KpiSummary
              salaryStats={analytics.salaryStats}
              negotiationLift={analytics.negotiationLift}
              cpiAdjusted={filter.cpiAdjusted}
              takeHomeParity={filter.takeHomeParity}
            />

            <Tabs
              value={activeTab}
              onValueChange={(val) => val && handleTabChange(val)}
              className="space-y-6"
            >
            <div className="overflow-x-auto pb-0.5">
              <TabsList className="h-8.5 rounded-lg border border-border/70 bg-muted/30 p-0.5">
                <TabsTrigger value="curves" className="gap-1.5 px-3 text-xs font-medium">
                  <IconChartLine className="h-3.5 w-3.5" /> Salary Ranges & Lift
                </TabsTrigger>
                <TabsTrigger value="arbitrage" className="gap-1.5 px-3 text-xs font-medium">
                  <IconScale className="h-3.5 w-3.5" /> Remote vs Local Calculator
                </TabsTrigger>
                <TabsTrigger value="schools" className="gap-1.5 px-3 text-xs font-medium">
                  <IconBuildingArch className="h-3.5 w-3.5" /> University & Perks
                </TabsTrigger>
                <TabsTrigger value="auditor" className="gap-1.5 px-3 text-xs font-medium">
                  <IconSparkles className="h-3.5 w-3.5 text-amber-500" /> AI Offer Evaluator
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
                    granularSchools={granularSchools}
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
          </Tabs>
          </>
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
