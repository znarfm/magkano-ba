'use client';

import React from 'react';
import { PercentileStats, SchoolTierGroup } from '@/lib/types';

interface SchoolConvergenceProps {
  bySchoolTier: Record<SchoolTierGroup, PercentileStats>;
  cpiAdjusted: boolean;
}

const TIER_LABELS: Record<SchoolTierGroup, string> = {
  UP_SYSTEM: 'UP System (UPD, UPLB, UPM, UPV)',
  ADMU_DLSU_UST: 'Ateneo / DLSU / UST',
  STATE_UNIV_POLYTECHNIC: 'State Univ & Polytechnics (PUP, PLM, TUP)',
  PRIVATE_METRO: 'Private Metro Manila (Mapua, FEU, Benilde, UE)',
  PROVINCIAL_UNIV: 'Provincial Universities (SLU, USC, Silliman)',
  UNKNOWN: 'Other / Unspecified',
};

export function SchoolConvergence({ bySchoolTier, cpiAdjusted }: SchoolConvergenceProps) {
  const tiers = (Object.keys(TIER_LABELS) as SchoolTierGroup[]).filter(
    (t) => t !== 'UNKNOWN' && bySchoolTier[t]?.count > 0
  );

  const maxMedian = Math.max(...tiers.map((t) => bySchoolTier[t]?.p50 || 0), 50000);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Alma Mater Starting Pay & Experience Convergence
        </h2>
        <p className="text-xs text-muted-foreground">
          Compare median starting compensation across Philippine university cohorts ({cpiAdjusted ? '2026 CPI-Adjusted' : 'Nominal PHP'}).
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {tiers.map((tier) => {
          const stats = bySchoolTier[tier];
          const pct = Math.min(100, Math.round((stats.p50 / maxMedian) * 100));

          return (
            <div key={tier} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{TIER_LABELS[tier]}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    (n = {stats.count})
                  </span>
                </div>
                <div className="font-mono font-bold text-foreground">
                  ₱{stats.p50.toLocaleString()}/mo
                </div>
              </div>

              <div className="relative h-4 w-full rounded-sm bg-muted/40 p-0.5">
                <div
                  className="h-full rounded-xs bg-primary/80 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>P25: ₱{stats.p25.toLocaleString()}</span>
                <span>P75: ₱{stats.p75.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
