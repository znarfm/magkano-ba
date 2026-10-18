'use client';

import React from 'react';
import { MacroIndustry } from '@/lib/types';

interface BenefitsMatrixProps {
  matrix: Record<
    MacroIndustry,
    {
      sampleCount: number;
      medianGuaranteedMonths: number;
      medianAllowancePhp: number;
      avgLeaveDays: number;
    }
  >;
}

const INDUSTRY_NAMES: Record<MacroIndustry, string> = {
  TECH_IT: 'Tech & IT',
  FINANCE_BANKING: 'Finance & Banking',
  FMCG_RETAIL: 'FMCG & Retail',
  BPO_SHARED_SERVICES: 'BPO & Shared Services',
  ENGINEERING_CONSTRUCTION: 'Engineering & Construction',
  MEDIA_ADVERTISING: 'Media & Advertising',
  GOVERNMENT_PUBLIC_SECTOR: 'Government & Public',
  EDUCATION_ACADEME: 'Education & Academe',
  HEALTHCARE_PHARMA: 'Healthcare & Pharma',
  CONSULTING_MARKET_RESEARCH: 'Consulting & Market Research',
  MANUFACTURING_LOGISTICS: 'Manufacturing & Logistics',
  OTHER: 'General Business & Other',
};

export function BenefitsMatrix({ matrix }: BenefitsMatrixProps) {
  const industries = Object.keys(matrix) as MacroIndustry[];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Total Comp & Benefits Structure by Macro Industry
        </h2>
        <p className="text-xs text-muted-foreground">
          Industry benchmarks for bonus months (13th–16th), monthly allowances, and annual vacation/sick leave credits.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground font-semibold">
              <th className="py-2.5 pr-4">Macro Industry</th>
              <th className="py-2.5 px-3 text-center">Guaranteed Months</th>
              <th className="py-2.5 px-3 text-right">Median Monthly Allowance</th>
              <th className="py-2.5 px-3 text-center">Typical Leave Days</th>
              <th className="py-2.5 pl-3 text-right">Sample (n)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {industries.map((ind) => {
              const row = matrix[ind];
              return (
                <tr key={ind} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 pr-4 font-sans font-medium text-foreground">
                    {INDUSTRY_NAMES[ind]}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block rounded-sm px-2 py-0.5 text-xs font-bold ${
                        row.medianGuaranteedMonths >= 14
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {row.medianGuaranteedMonths} mos
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    {row.medianAllowancePhp > 0
                      ? `₱${row.medianAllowancePhp.toLocaleString()}`
                      : 'None / Included'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {row.avgLeaveDays} days
                  </td>
                  <td className="py-2.5 pl-3 text-right text-muted-foreground">
                    {row.sampleCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
