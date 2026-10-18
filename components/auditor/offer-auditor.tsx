'use client';

import React, { useEffect, useState } from 'react';
import { PercentileStats, CareerRecord } from '@/lib/types';
import { calculateNetArbitrage } from '@/lib/economics';
import { buildGroundedAuditPrompt, callGeminiAudit } from '@/lib/auditor';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconSparkles, IconKey, IconCheck, IconAlertTriangle } from '@tabler/icons-react';

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

  // Determine offer tier visually relative to current slice
  const getOfferTier = () => {
    if (!currentStats.p50) return null;
    if (monthlyOffer < currentStats.p25) {
      return { label: 'Below P25 Floor', color: 'text-rose-600 border-rose-500/40 bg-rose-500/10' };
    }
    if (monthlyOffer <= currentStats.p75) {
      return { label: 'Competitive Market Band', color: 'text-emerald-600 border-emerald-500/40 bg-emerald-500/10' };
    }
    return { label: 'Top Quartile (> P75)', color: 'text-amber-600 border-amber-500/40 bg-amber-500/10' };
  };

  const tier = getOfferTier();

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">BYOK Gemini Grounded Offer & Path Auditor</CardTitle>
            <Badge variant="outline" className="text-[11px] gap-1 font-mono">
              <IconSparkles className="h-3 w-3 text-amber-500" /> Grounded AI
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Audit your compensation package against verified dataset percentiles and TRAIN/8% tax math without hallucinations. Key never leaves your browser.
          </CardDescription>
        </div>
        {hasSavedKey && (
          <button
            type="button"
            onClick={handleClearKey}
            className="text-xs text-rose-600 hover:underline dark:text-rose-400 font-medium"
          >
            Clear Saved API Key
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* API Key Box */}
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <IconKey className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Google Gemini API Key (Stored exclusively in browser localStorage):</span>
          </div>
          <div className="flex gap-2">
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

        {/* Visual Benchmark Bar */}
        {currentStats.p50 > 0 && (
          <div className="rounded-lg border border-border/70 bg-muted/10 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Offer Benchmark Visualizer:</span>
              {tier && (
                <Badge variant="outline" className={`font-mono text-[11px] ${tier.color}`}>
                  {tier.label}
                </Badge>
              )}
            </div>
            <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(5, (monthlyOffer / (currentStats.p75 * 1.3)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>P25: ₱{currentStats.p25.toLocaleString()}</span>
              <span>Median: ₱{currentStats.p50.toLocaleString()}</span>
              <span>P75: ₱{currentStats.p75.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Form Grid */}
        <form onSubmit={handleRunAudit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Target Role / Job Title</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Years of Experience (YOE)</label>
            <input
              type="number"
              min="0"
              max="40"
              step="0.5"
              value={yoe}
              onChange={(e) => setYoe(parseFloat(e.target.value) || 0)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Offered Monthly Gross (PHP)</label>
            <input
              type="number"
              min="10000"
              step="5000"
              value={monthlyOffer}
              onChange={(e) => setMonthlyOffer(parseFloat(e.target.value) || 0)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Work Scope</label>
            <Select value={workScope} onValueChange={(val) => val && setWorkScope(val)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PH_LOCAL" className="text-xs">PH Local Corporate</SelectItem>
                <SelectItem value="FOREIGN_REMOTE" className="text-xs">Foreign Remote Contractor</SelectItem>
                <SelectItem value="OVERSEAS_OFW" className="text-xs">Overseas (OFW)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">School / Alma Mater</label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              disabled={loading}
              className="h-8 w-full text-xs font-semibold gap-1.5"
            >
              <IconSparkles className="h-3.5 w-3.5" />
              {loading ? 'Auditing with Gemini...' : 'Audit My Offer'}
            </Button>
          </div>
        </form>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
            <IconAlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Audit Result Display */}
        {auditResult && (
          <div className="rounded-lg border border-border/80 bg-muted/10 p-4 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <IconCheck className="h-4 w-4" />
              <span>Grounded Against 2026 CPI Benchmarks</span>
            </div>
            <div className="whitespace-pre-wrap font-sans text-foreground/90 space-y-2 pt-1 border-t border-border/40">
              {auditResult}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
