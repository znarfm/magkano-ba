'use client';

import React from 'react';
import { PercentileStats, SeniorityBand } from '@/lib/types';

interface PercentileExplorerProps {
  stats: PercentileStats;
  bySeniority: Record<SeniorityBand, PercentileStats>;
  cpiAdjusted: boolean;
  takeHomeParity: boolean;
}

const BAND_LABELS: Record<SeniorityBand, { name: string; yoe: string }> = {
  ENTRY_0: { name: 'Entry Level', yoe: '0 YOE' },
  JUNIOR_1_2: { name: 'Junior', yoe: '1–2 YOE' },
  MID_3_5: { name: 'Mid-Level', yoe: '3–5 YOE' },
  SENIOR_6_9: { name: 'Senior', yoe: '6–9 YOE' },
  STAFF_LEAD_10_PLUS: { name: 'Staff / Lead', yoe: '10+ YOE' },
};

export function PercentileExplorer({
  stats,
  bySeniority,
  cpiAdjusted,
  takeHomeParity,
}: PercentileExplorerProps) {
  // Find global max to scale relative progress bars
  const maxVal = Math.max(
    ...Object.values(bySeniority).map((s) => s.p75),
    stats.p75,
    100000
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Role & Industry Compensation Curves
          </h2>
          <p className="text-xs text-muted-foreground">
            P25, Median (P50), and P75 progression across seniority bands. (
            {cpiAdjusted ? '2026 PSA CPI Purchasing Power' : 'Nominal Rates'} ·{' '}
            {takeHomeParity ? 'Estimated Monthly Net' : 'Monthly Gross Base'})
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> P25 (Floor)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Median (P50)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> P75 (Top Quartile)
          </span>
        </div>
      </div>

      {/* Seniority Progression Bars */}
      <div className="mt-4 space-y-4">
        {(Object.keys(BAND_LABELS) as SeniorityBand[]).map((band) => {
          const s = bySeniority[band];
          const info = BAND_LABELS[band];
          const isLowSample = s.count > 0 && s.count < 5;

          if (s.count === 0) {
            return (
              <div
                key={band}
                className="flex items-center justify-between rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground"
              >
                <span>
                  <strong className="text-foreground">{info.name}</strong> ({info.yoe})
                </span>
                <span>No matching data points in current filter</span>
              </div>
            );
          }

          const p25Pct = Math.min(100, Math.round((s.p25 / maxVal) * 100));
          const p50Pct = Math.min(100, Math.round((s.p50 / maxVal) * 100));
          const p75Pct = Math.min(100, Math.round((s.p75 / maxVal) * 100));

          return (
            <div key={band} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{info.name}</span>
                  <span className="text-muted-foreground">({info.yoe})</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                    n = {s.count}
                  </span>
                  {isLowSample && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      ⚠ Low Sample (&lt;5)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 font-mono font-medium">
                  <span className="text-muted-foreground">
                    P25: ₱{s.p25.toLocaleString()}
                  </span>
                  <span className="text-foreground font-bold">
                    Median: ₱{s.p50.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    P75: ₱{s.p75.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Visualizer */}
              <div className="relative h-6 w-full rounded-md bg-muted/40 p-1">
                {/* Inter-quartile range span (P25 to P75) */}
                <div
                  className="absolute top-1 bottom-1 rounded bg-blue-100/70 dark:bg-blue-950/40"
                  style={{
                    left: `${p25Pct}%`,
                    width: `${Math.max(2, p75Pct - p25Pct)}%`,
                  }}
                />
                {/* P25 Marker */}
                <div
                  className="absolute top-1 bottom-1 w-1 rounded bg-blue-500"
                  style={{ left: `${p25Pct}%` }}
                  title={`P25: ₱${s.p25.toLocaleString()}`}
                />
                {/* Median Marker */}
                <div
                  className="absolute top-0.5 bottom-0.5 w-1.5 rounded bg-emerald-600 shadow-xs"
                  style={{ left: `${p50Pct}%` }}
                  title={`Median: ₱${s.p50.toLocaleString()}`}
                />
                {/* P75 Marker */}
                <div
                  className="absolute top-1 bottom-1 w-1 rounded bg-amber-500"
                  style={{ left: `${p75Pct}%` }}
                  title={`P75: ₱${s.p75.toLocaleString()}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
