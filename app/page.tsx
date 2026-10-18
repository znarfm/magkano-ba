'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CareerRecord, FilterState } from '@/lib/types';
import { queryDashboardSlice } from '@/lib/analytics';
import { FilterBar } from '@/components/filter-bar';
import { PercentileExplorer } from '@/components/percentile-explorer';
import { NegotiationLift } from '@/components/negotiation-lift';
import { NetArbitrageSimulator } from '@/components/net-arbitrage';
import { BenefitsMatrix } from '@/components/benefits-matrix';
import { SchoolConvergence } from '@/components/school-convergence';
import { MentorQuotesFeed } from '@/components/mentor-quotes';
import { OfferAuditor } from '@/components/auditor/offer-auditor';
import { MethodologyModal } from '@/components/methodology-modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  IconChartLine,
  IconScale,
  IconSparkles,
  IconMessage2,
  IconBuildingArch,
} from '@tabler/icons-react';

export default function DashboardPage() {
  const [records, setRecords] = useState<CareerRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filter, setFilter] = useState<FilterState>({
    macroIndustry: 'ALL',
    roleFamily: 'ALL',
    seniorityBand: 'ALL',
    workScopes: ['PH_LOCAL', 'FOREIGN_REMOTE'],
    cpiAdjusted: true,
    takeHomeParity: false,
    schoolTier: 'ALL',
    searchQuery: '',
  });

  useEffect(() => {
    fetch('/data/records.json')
      .then((res) => res.json())
      .then((data: CareerRecord[]) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset:', err);
        setLoading(false);
      });
  }, []);

  const analytics = useMemo(() => {
    return queryDashboardSlice(records, filter);
  }, [records, filter]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 px-4 py-4 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🇵🇭</span>
              <h1 className="text-xl font-bold tracking-tight">Magkano Ba?</h1>
              <Badge variant="outline" className="font-mono text-[11px] py-0 border-primary/40 text-primary">
                2026 PSA CPI Rebased
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Filipino Career & Compensation Intelligence · 4,000+ Verified Community Records
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-mono">
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
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading 4,000+ normalized records...</span>
          </div>
        ) : (
          <Tabs defaultValue="curves" className="space-y-6">
            <div className="overflow-x-auto pb-1">
              <TabsList className="h-9 p-1">
                <TabsTrigger value="curves" className="text-xs gap-1.5 px-3">
                  <IconChartLine className="h-3.5 w-3.5" /> Compensation Curves
                </TabsTrigger>
                <TabsTrigger value="arbitrage" className="text-xs gap-1.5 px-3">
                  <IconScale className="h-3.5 w-3.5" /> Net Arbitrage Simulator
                </TabsTrigger>
                <TabsTrigger value="schools" className="text-xs gap-1.5 px-3">
                  <IconBuildingArch className="h-3.5 w-3.5" /> Schools & Benefits
                </TabsTrigger>
                <TabsTrigger value="auditor" className="text-xs gap-1.5 px-3">
                  <IconSparkles className="h-3.5 w-3.5 text-amber-500" /> BYOK Offer Auditor
                </TabsTrigger>
                <TabsTrigger value="quotes" className="text-xs gap-1.5 px-3">
                  <IconMessage2 className="h-3.5 w-3.5" /> Mentor Stories ({analytics.mentorQuotes.length})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Compensation Curves & Negotiation Lift */}
            <TabsContent value="curves" className="space-y-6">
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
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SchoolConvergence
                  bySchoolTier={analytics.bySchoolTier}
                  cpiAdjusted={filter.cpiAdjusted}
                />
                <NetArbitrageSimulator />
              </div>
            </TabsContent>

            {/* TAB 2: Net Arbitrage Simulator */}
            <TabsContent value="arbitrage" className="space-y-6">
              <NetArbitrageSimulator />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <NegotiationLift lift={analytics.negotiationLift} />
                <SchoolConvergence
                  bySchoolTier={analytics.bySchoolTier}
                  cpiAdjusted={filter.cpiAdjusted}
                />
              </div>
            </TabsContent>

            {/* TAB 3: Schools & Benefits Matrix */}
            <TabsContent value="schools" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SchoolConvergence
                  bySchoolTier={analytics.bySchoolTier}
                  cpiAdjusted={filter.cpiAdjusted}
                />
                <NegotiationLift lift={analytics.negotiationLift} />
              </div>
              <BenefitsMatrix matrix={analytics.benefitsMatrix} />
            </TabsContent>

            {/* TAB 4: BYOK Gemini Offer Auditor */}
            <TabsContent value="auditor" className="space-y-6">
              <OfferAuditor
                currentStats={analytics.salaryStats}
                currentQuotes={analytics.mentorQuotes}
                activeIndustry={filter.macroIndustry || 'TECH_IT'}
              />
              <PercentileExplorer
                stats={analytics.salaryStats}
                bySeniority={analytics.bySeniority}
                cpiAdjusted={filter.cpiAdjusted}
                takeHomeParity={filter.takeHomeParity}
              />
            </TabsContent>

            {/* TAB 5: Mentor Advice Stories */}
            <TabsContent value="quotes" className="space-y-6">
              <MentorQuotesFeed
                quotes={analytics.mentorQuotes}
                cpiAdjusted={filter.cpiAdjusted}
              />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card/40 px-4 py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Data sourced from community responses in the <em>Liyab First Pay Survey</em> and <em>Work/Career Path Information Sheet</em>.
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
  );
}
