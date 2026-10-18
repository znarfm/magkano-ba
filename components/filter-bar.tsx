'use client';

import React from 'react';
import { FilterState, MacroIndustry, SchoolTierGroup, SeniorityBand, WorkScope } from '@/lib/types';

interface FilterBarProps {
  filter: FilterState;
  onChange: (next: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const INDUSTRIES: { label: string; value: MacroIndustry | 'ALL' }[] = [
  { label: 'All Industries', value: 'ALL' },
  { label: 'Tech & IT', value: 'TECH_IT' },
  { label: 'Finance & Banking', value: 'FINANCE_BANKING' },
  { label: 'FMCG & Retail', value: 'FMCG_RETAIL' },
  { label: 'BPO & Shared Services', value: 'BPO_SHARED_SERVICES' },
  { label: 'Engineering & Construction', value: 'ENGINEERING_CONSTRUCTION' },
  { label: 'Media & Creative', value: 'MEDIA_ADVERTISING' },
  { label: 'Government & Public', value: 'GOVERNMENT_PUBLIC_SECTOR' },
  { label: 'Education & Academe', value: 'EDUCATION_ACADEME' },
  { label: 'Healthcare & Pharma', value: 'HEALTHCARE_PHARMA' },
  { label: 'Consulting & Market Research', value: 'CONSULTING_MARKET_RESEARCH' },
  { label: 'Manufacturing & Logistics', value: 'MANUFACTURING_LOGISTICS' },
  { label: 'Other', value: 'OTHER' },
];

const SENIORITIES: { label: string; value: SeniorityBand | 'ALL' }[] = [
  { label: 'All Seniorities', value: 'ALL' },
  { label: '0 YOE (Entry)', value: 'ENTRY_0' },
  { label: '1–2 YOE (Junior)', value: 'JUNIOR_1_2' },
  { label: '3–5 YOE (Mid)', value: 'MID_3_5' },
  { label: '6–9 YOE (Senior)', value: 'SENIOR_6_9' },
  { label: '10+ YOE (Staff/Lead)', value: 'STAFF_LEAD_10_PLUS' },
];

const SCOPES: { label: string; value: WorkScope }[] = [
  { label: 'PH Local', value: 'PH_LOCAL' },
  { label: 'Foreign Remote', value: 'FOREIGN_REMOTE' },
  { label: 'Likely Remote (High Earner)', value: 'LIKELY_REMOTE_INTL' },
  { label: 'Overseas (OFW)', value: 'OVERSEAS_OFW' },
];

export function FilterBar({ filter, onChange, totalCount, filteredCount }: FilterBarProps) {
  const toggleScope = (scope: WorkScope) => {
    const exists = filter.workScopes.includes(scope);
    const nextScopes = exists
      ? filter.workScopes.filter((s) => s !== scope)
      : [...filter.workScopes, scope];
    // Keep at least one selected
    if (nextScopes.length > 0) {
      onChange({ ...filter, workScopes: nextScopes });
    }
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3 shadow-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Search & Selects */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search role, keyword, or school..."
            value={filter.searchQuery || ''}
            onChange={(e) => onChange({ ...filter, searchQuery: e.target.value })}
            className="h-9 w-52 md:w-64 rounded-md border border-input bg-background px-3 text-sm focus:outline-hidden focus:ring-1 focus:ring-primary"
          />

          <select
            value={filter.macroIndustry || 'ALL'}
            onChange={(e) =>
              onChange({ ...filter, macroIndustry: e.target.value as MacroIndustry | 'ALL' })
            }
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>

          <select
            value={filter.seniorityBand || 'ALL'}
            onChange={(e) =>
              onChange({ ...filter, seniorityBand: e.target.value as SeniorityBand | 'ALL' })
            }
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            {SENIORITIES.map((sen) => (
              <option key={sen.value} value={sen.value}>
                {sen.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles: CPI & Parity */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          {/* Work Scopes */}
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-1">
            {SCOPES.map((sc) => {
              const active = filter.workScopes.includes(sc.value);
              return (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => toggleScope(sc.value)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>

          {/* CPI 2026 Toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...filter, cpiAdjusted: !filter.cpiAdjusted })}
            className={`rounded-md border px-2.5 py-1.5 transition-colors ${
              filter.cpiAdjusted
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : 'border-input bg-background text-muted-foreground'
            }`}
          >
            {filter.cpiAdjusted ? '✓ 2026 CPI Adjusted' : 'Nominal PHP'}
          </button>

          {/* Parity Toggle */}
          <button
            type="button"
            onClick={() => onChange({ ...filter, takeHomeParity: !filter.takeHomeParity })}
            className={`rounded-md border px-2.5 py-1.5 transition-colors ${
              filter.takeHomeParity
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-input bg-background text-muted-foreground'
            }`}
          >
            {filter.takeHomeParity ? '✓ Net Take-Home (TRAIN)' : 'Gross Monthly Base'}
          </button>

          <span className="font-mono text-xs text-muted-foreground ml-2">
            {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} records
          </span>
        </div>
      </div>
    </div>
  );
}
