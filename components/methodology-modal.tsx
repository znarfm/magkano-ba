'use client';

import React, { useState } from 'react';

export function MethodologyModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-primary underline hover:text-primary/80 transition-colors"
      >
        Methodology & Math Model
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl text-xs space-y-4 text-foreground/90">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <h3 className="text-base font-bold text-foreground">
                Methodology & Analytical Framework
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted font-mono"
              >
                ✕ Close
              </button>
            </div>

            <section className="space-y-1.5">
              <h4 className="font-semibold text-foreground">1. Data Sources & Attribution</h4>
              <p className="text-muted-foreground leading-relaxed">
                Raw data is ingested from public, community-contributed spreadsheets:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Liyab First Pay Survey:</strong> ~3,000 fresh graduate entries covering starting salaries, university cohorts, and initial offer negotiation outcomes.
                </li>
                <li>
                  <strong className="text-foreground">Work/Career Path Information Sheet:</strong> ~1,000 mid-to-senior career path submissions detailing guaranteed bonus months (13th–16th), allowances, leave credits, and long-form insider career advice.
                </li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-semibold text-foreground">2. 2026 PSA CPI Inflation Adjustment</h4>
              <p className="text-muted-foreground leading-relaxed">
                Entries span 2005 to 2021+. To remove temporal distortion, historical nominal PHP is scaled to 2026 purchasing power using official Philippine Statistics Authority (PSA) Consumer Price Index (2018=100 base) annual averages:
              </p>
              <div className="rounded-md bg-muted/40 p-2 font-mono text-[11px] text-foreground">
                AdjustedSalary = NominalSalary × (CPI_2026 / CPI_year)
              </div>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-semibold text-foreground">3. TRAIN vs. 8% Freelancer Tax Parity</h4>
              <p className="text-muted-foreground leading-relaxed">
                When toggled to <em>Net Take-Home</em>, monthly figures are annualized and normalized to a 12-month net equivalent:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">PH Local:</strong> Applies 2026 graduated TRAIN tax brackets, ₱90,000 tax-exempt bonus ceiling, mandatory SSS (4.5% up to ₱35k MSC), PhilHealth (2.5% employee share), Pag-IBIG (₱200 cap), plus prorated 13th+ month pay and standard HMO valuation.
                </li>
                <li>
                  <strong className="text-foreground">Foreign Remote:</strong> Evaluates the BIR 8% flat gross receipts tax (deducting the initial ₱250k exemption for &le; ₱3M gross) and self-employed statutory contributions.
                </li>
              </ul>
            </section>

            <section className="space-y-1.5">
              <h4 className="font-semibold text-foreground">4. Sanitization & Low-Sample Confidence</h4>
              <p className="text-muted-foreground leading-relaxed">
                Troll or corrupted values outside ₱3,000 to ₱2,000,000/month are sanitized. Filter slices with fewer than 5 submissions ($n &lt; 5$) are explicitly flagged with a low-confidence warning badge.
              </p>
            </section>

            <div className="border-t border-border/70 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
