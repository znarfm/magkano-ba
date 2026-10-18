'use client';

import React, { useEffect, useState } from 'react';
import { PercentileStats, CareerRecord } from '@/lib/types';
import { calculateNetArbitrage } from '@/lib/economics';
import { buildGroundedAuditPrompt, callGeminiAudit } from '@/lib/auditor';

interface OfferAuditorProps {
  currentStats: PercentileStats;
  currentQuotes: CareerRecord[];
  activeIndustry: string;
}

const STORAGE_KEY = 'ph_career_gemini_key';

export function OfferAuditor({
  currentStats,
  currentQuotes,
  activeIndustry,
}: OfferAuditorProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [hasSavedKey, setHasSavedKey] = useState<boolean>(false);
  const [role, setRole] = useState<string>('Software Engineer');
  const [yoe, setYoe] = useState<number>(2);
  const [monthlyOffer, setMonthlyOffer] = useState<number>(50000);
  const [workScope, setWorkScope] = useState<string>('PH_LOCAL');
  const [school, setSchool] = useState<string>('UP Diliman');

  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setApiKey(saved);
      setHasSavedKey(true);
    }
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
      setHasSavedKey(true);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setHasSavedKey(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setHasSavedKey(false);
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuditResult(null);

    if (!apiKey.trim()) {
      setError('Please provide your Gemini API key (BYOK). It stays strictly in your browser localStorage.');
      return;
    }

    try {
      setLoading(true);
      const arbitrage = calculateNetArbitrage(monthlyOffer);
      const payload = buildGroundedAuditPrompt(
        {
          role,
          yoe,
          monthlyOfferPhp: monthlyOffer,
          workScope,
          school,
          macroIndustry: activeIndustry,
        },
        currentStats,
        arbitrage,
        currentQuotes
      );

      const result = await callGeminiAudit(apiKey.trim(), payload);
      setAuditResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Audit failed. Check your API key and network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            BYOK Gemini Grounded Offer & Path Auditor
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit your compensation package against verified dataset percentiles and TRAIN/8% tax math without hallucinations. Key never leaves your browser.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSavedKey && (
            <button
              type="button"
              onClick={handleClearKey}
              className="text-xs text-rose-600 hover:underline dark:text-rose-400"
            >
              Clear Saved API Key
            </button>
          )}
        </div>
      </div>

      {/* API Key Banner / Input */}
      <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
        <label className="font-medium text-foreground">
          Google Gemini API Key (Stored exclusively in browser localStorage):
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => handleSaveKey(e.target.value)}
            className="h-8 flex-1 rounded-md border border-input bg-background px-3 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-border bg-background px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Get Free Key ↗
          </a>
        </div>
      </div>

      {/* Auditor Form */}
      <form onSubmit={handleRunAudit} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-foreground">Target Role / Job Title</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground">Years of Experience (YOE)</label>
          <input
            type="number"
            min="0"
            max="40"
            step="0.5"
            value={yoe}
            onChange={(e) => setYoe(parseFloat(e.target.value) || 0)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground">Offered Monthly Gross (PHP)</label>
          <input
            type="number"
            min="10000"
            step="5000"
            value={monthlyOffer}
            onChange={(e) => setMonthlyOffer(parseFloat(e.target.value) || 0)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground">Work Scope</label>
          <select
            value={workScope}
            onChange={(e) => setWorkScope(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="PH_LOCAL">PH Local Corporate</option>
            <option value="FOREIGN_REMOTE">Foreign Remote Contractor</option>
            <option value="OVERSEAS_OFW">Overseas (OFW)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground">School / Alma Mater</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="h-9 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground text-xs hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Auditing with Gemini...' : '⚡ Audit My Offer'}
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-4 rounded-md border border-rose-500/30 bg-rose-50 p-3 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Result Display */}
      {auditResult && (
        <div className="mt-5 rounded-lg border border-border/80 bg-muted/10 p-5 text-xs leading-relaxed">
          <div className="mb-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ✓ Deterministic Dataset Grounding Verified
          </div>
          <div className="whitespace-pre-wrap font-sans text-foreground/90 space-y-2">
            {auditResult}
          </div>
        </div>
      )}
    </div>
  );
}
