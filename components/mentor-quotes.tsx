'use client';

import React from 'react';
import { CareerRecord } from '@/lib/types';
import { getCpiMultiplier } from '@/lib/config/psa-cpi';

interface MentorQuotesFeedProps {
  quotes: CareerRecord[];
  cpiAdjusted: boolean;
}

export function MentorQuotesFeed({ quotes, cpiAdjusted }: MentorQuotesFeedProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Insider Career Advice & Mentor Stories
          </h2>
          <p className="text-xs text-muted-foreground">
            Unfiltered workplace learnings, salary pitfalls, and career progression notes from experienced professionals.
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          Showing {quotes.length} quotes
        </span>
      </div>

      {quotes.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          No mentor quotes match your current filter query. Try searching for broader terms.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {quotes.map((q) => {
            const rawSalary = q.nominalMonthlyGrossPhp.median;
            const displaySalary = cpiAdjusted
              ? Math.round(rawSalary * getCpiMultiplier(q.cohortYear))
              : rawSalary;

            return (
              <div
                key={q.id}
                className="flex flex-col justify-between rounded-lg border border-border/70 bg-muted/15 p-4 text-xs hover:border-border transition-colors"
              >
                <blockquote className="italic leading-relaxed text-foreground/90">
                  &ldquo;{q.mentorAdviceQuote}&rdquo;
                </blockquote>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  <div>
                    <strong className="text-foreground">{q.rawTitle}</strong>
                    <span className="ml-1.5 font-mono">({q.yoeYears} YOE)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {q.schoolCanonical && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-sans">
                        {q.schoolCanonical}
                      </span>
                    )}
                    {displaySalary > 0 && (
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ₱{displaySalary.toLocaleString()}/mo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
