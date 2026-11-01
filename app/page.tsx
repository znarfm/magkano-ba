"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { z } from "zod"
import { CareerRecord, CareerRecordSchema } from "@/lib/types"
import { useDashboardFilterParams } from "@/hooks/use-dashboard-filter-params"
import {
  computeBenefitsMatrix,
  queryDashboardSlice,
  queryGranularSchoolStats,
} from "@/lib/analytics"
import { prepareGranularSchoolData } from "@/lib/chart-adapters"
import { FilterBar } from "@/components/filter-bar"
import { PercentileExplorer } from "@/components/percentile-explorer"
import { NegotiationLift } from "@/components/negotiation-lift"
import { MentorQuotesFeed } from "@/components/mentor-quotes"
import { NavigationHeader } from "@/components/navigation-header"
import { KpiSummary } from "@/components/kpi-summary"
import { Skeleton } from "@/components/ui/skeleton"

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

function DashboardContent() {
  const [records, setRecords] = useState<CareerRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const [filter, setFilter, activeTab, setActiveTab] =
    useDashboardFilterParams()

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

  const staticBenefitsMatrix = useMemo(() => {
    return computeBenefitsMatrix(records)
  }, [records])

  const roleFamilies = useMemo(() => {
    const set = new Set<string>()
    for (const r of records) {
      if (
        filter.macroIndustry === "ALL" ||
        r.macroIndustry === filter.macroIndustry
      ) {
        set.add(r.roleFamily)
      }
    }
    return Array.from(set).sort()
  }, [records, filter.macroIndustry])

  const analytics = useMemo(() => {
    return queryDashboardSlice(records, filter, staticBenefitsMatrix)
  }, [records, filter, staticBenefitsMatrix])

  const granularSchools = useMemo(() => {
    const stats = queryGranularSchoolStats(analytics.filteredRecords, {
      cpiAdjusted: filter.cpiAdjusted,
      takeHomeParity: filter.takeHomeParity,
      minCount: 5,
    })
    return prepareGranularSchoolData(stats)
  }, [analytics.filteredRecords, filter.cpiAdjusted, filter.takeHomeParity])

  const showFilterBar = activeTab !== "arbitrage"
  const showKpiSummary = activeTab === "curves" || activeTab === "schools"

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background font-sans text-foreground">
      <NavigationHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {showFilterBar && (
        <FilterBar
          filter={filter}
          onChange={setFilter}
          totalCount={records.length}
          filteredCount={analytics.filteredCount}
          roleFamilies={roleFamilies}
        />
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Skeleton className="h-[340px] w-full rounded-xl lg:col-span-2" />
              <Skeleton className="h-[340px] w-full rounded-xl lg:col-span-1" />
            </div>
          </div>
        ) : (
          <>
            {showKpiSummary && (
              <KpiSummary
                salaryStats={analytics.salaryStats}
                negotiationLift={analytics.negotiationLift}
                cpiAdjusted={filter.cpiAdjusted}
                takeHomeParity={filter.takeHomeParity}
              />
            )}

            {activeTab === "curves" && (
              <div className="space-y-6">
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
                <MentorQuotesFeed
                  quotes={analytics.mentorQuotes}
                  cpiAdjusted={filter.cpiAdjusted}
                />
              </div>
            )}

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

            {activeTab === "arbitrage" && <NetArbitrageSimulator />}

            {activeTab === "auditor" && (
              <OfferAuditor
                currentStats={analytics.salaryStats}
                salaryValues={analytics.salaryValues}
                currentQuotes={analytics.mentorQuotes}
                activeIndustry={filter.macroIndustry || "TECH_IT"}
                takeHomeParity={filter.takeHomeParity}
              />
            )}
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-border bg-card/40 px-4 py-5 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <p>
            Sourced from{" "}
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
              r/phcareers Compensation Sheet
            </a>
            .
          </p>
          <span className="font-mono text-[11px]">
            Client-side analytics · BYOK Gemini grounding
          </span>
        </div>
      </footer>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <DashboardContent />
    </Suspense>
  )
}
