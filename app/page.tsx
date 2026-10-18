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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-card/60 px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇵🇭</span>
              <h1 className="text-xl font-bold tracking-tight">Magkano Ba?</h1>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                v1.0 2026 CPI
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filipino Career & Compensation Intelligence · 4,000+ Normalized Community Benchmarks
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span>PSA CPI Rebased 2026</span>
            <span>•</span>
            <span>TRAIN 2026 Brackets</span>
          </div>
        </div>
      </header>

      {/* Sticky Filter Bar */}
      <FilterBar
        filter={filter}
        onChange={setFilter}
        totalCount={records.length}
        filteredCount={analytics.filteredCount}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xs text-muted-foreground font-mono">
            Loading normalized community datasets (4,000+ records)...
          </div>
        ) : (
          <>
            {/* Top Grid: Percentile Explorer & Negotiation Lift */}
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

            {/* Middle Grid: Net Arbitrage Simulator & School Convergence */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <NetArbitrageSimulator />
              <SchoolConvergence
                bySchoolTier={analytics.bySchoolTier}
                cpiAdjusted={filter.cpiAdjusted}
              />
            </div>

            {/* Benefits Matrix by Macro Industry */}
            <BenefitsMatrix matrix={analytics.benefitsMatrix} />

            {/* BYOK Gemini Grounded Auditor */}
            <OfferAuditor
              currentStats={analytics.salaryStats}
              currentQuotes={analytics.mentorQuotes}
              activeIndustry={filter.macroIndustry || 'TECH_IT'}
            />

            {/* Mentor Quotes Feed */}
            <MentorQuotesFeed
              quotes={analytics.mentorQuotes}
              cpiAdjusted={filter.cpiAdjusted}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border bg-card/40 px-4 py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Data sourced from public community responses in the <em>Liyab First Pay Survey</em> and <em>Work/Career Path Information Sheet</em>.
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
