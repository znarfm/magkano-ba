'use client';

import React from 'react';

interface NegotiationLiftProps {
  lift: {
    negotiatedMedian: number;
    nonNegotiatedMedian: number;
    liftPhp: number;
    liftPercent: number;
    negotiatedCount: number;
    nonNegotiatedCount: number;
  };
}

export function NegotiationLift({ lift }: NegotiationLiftProps) {
  const hasData = lift.negotiatedCount > 0 && lift.nonNegotiatedCount > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Fresh Grad Negotiation Lift
          </h2>
          <p className="text-xs text-muted-foreground">
            Monetary and percentage advantage of negotiating initial first-job offers (Liyab cohort).
          </p>
        </div>
        {hasData && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              lift.liftPercent >= 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            +{lift.liftPercent}% Median Lift
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Insufficient negotiation comparisons for the selected filter slice.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Negotiated Card */}
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <span className="text-xs text-muted-foreground font-medium">Negotiated First Offer</span>
            <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₱{lift.negotiatedMedian.toLocaleString()}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Median starting pay (n = {lift.negotiatedCount})
            </span>
          </div>

          {/* Non-negotiated Card */}
          <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
            <span className="text-xs text-muted-foreground font-medium">Accepted Initial Offer</span>
            <div className="mt-1 font-mono text-2xl font-bold text-foreground">
              ₱{lift.nonNegotiatedMedian.toLocaleString()}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Median starting pay (n = {lift.nonNegotiatedCount})
            </span>
          </div>

          {/* Lift Difference Card */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              Expected Monetary Premium
            </span>
            <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              +₱{Math.max(0, lift.liftPhp).toLocaleString()}
              <span className="text-sm font-normal text-emerald-800 dark:text-emerald-400">/mo</span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
              ≈ ₱{(Math.max(0, lift.liftPhp) * 13).toLocaleString()}/year extra (including 13th month)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
