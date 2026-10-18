'use client';

import React, { useState } from 'react';
import { calculateNetArbitrage } from '@/lib/economics';

export function NetArbitrageSimulator() {
  const [localGross, setLocalGross] = useState<number>(60000);
  const [guaranteedMonths, setGuaranteedMonths] = useState<number>(13);
  const [allowance, setAllowance] = useState<number>(2000);
  const [hmoAnnual, setHmoAnnual] = useState<number>(24000);

  const result = calculateNetArbitrage(
    localGross || 0,
    guaranteedMonths,
    allowance || 0,
    hmoAnnual || 0
  );

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg font-semibold tracking-tight">
          PH Local vs. Foreign Remote Net Arbitrage Simulator
        </h2>
        <p className="text-xs text-muted-foreground">
          Compute true take-home parity: PH corporate (graduated TRAIN tax + SSS/PhilHealth/Pag-IBIG + 13th month + HMO) vs. Foreign contractor (8% flat tax).
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div>
            <label className="text-xs font-medium text-foreground">
              PH Local Monthly Base Salary (PHP)
            </label>
            <div className="mt-1 flex items-center">
              <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                ₱
              </span>
              <input
                type="number"
                step="5000"
                min="10000"
                max="1000000"
                value={localGross}
                onChange={(e) => setLocalGross(parseFloat(e.target.value) || 0)}
                className="h-9 w-full rounded-r-md border border-input bg-background px-3 font-mono text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground">
                Guaranteed Months
              </label>
              <select
                value={guaranteedMonths}
                onChange={(e) => setGuaranteedMonths(parseInt(e.target.value, 10))}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value={12}>12 Months (No 13th)</option>
                <option value={13}>13 Months (Standard)</option>
                <option value={14}>14 Months</option>
                <option value={15}>15 Months</option>
                <option value={16}>16 Months (Bank/FMCG)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">
                Monthly Allowance (PHP)
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={allowance}
                onChange={(e) => setAllowance(parseFloat(e.target.value) || 0)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">
              Annual HMO Valuation (PHP)
            </label>
            <input
              type="number"
              step="5000"
              min="0"
              value={hmoAnnual}
              onChange={(e) => setHmoAnnual(parseFloat(e.target.value) || 0)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Typical private corporate HMO coverage is valued at ~₱20,000–₱35,000/year.
            </p>
          </div>
        </div>

        {/* Parity Output */}
        <div className="flex flex-col justify-between rounded-lg border border-border/80 bg-background p-4 shadow-xs">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Break-Even Foreign Remote Rate
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              ₱{result.remoteBreakEvenMonthlyGross.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              To match your ₱{result.localMonthlyGross.toLocaleString()}/mo local total package take-home, a foreign remote client contract must pay at least this amount before the 8% contractor tax.
            </p>
          </div>

          <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Local Net Take-Home (Monthly Eq.):</span>
              <span className="font-mono font-bold text-foreground">
                ₱{result.localMonthlyNetEquivalent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remote Net Take-Home (8% Tax):</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                ₱{result.remoteMonthlyNetEquivalent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual Bonus & Benefits Value:</span>
              <span className="font-mono font-medium text-foreground">
                ₱{result.benefitsAnnualLocal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual Tax Difference (TRAIN vs 8%):</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                ₱{Math.abs(result.taxDifferenceAnnual).toLocaleString()}{' '}
                {result.taxDifferenceAnnual >= 0 ? '(Higher on Local)' : '(Higher on Remote)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
