"use client"

import React from "react"
import { CareerRecord } from "@/lib/types"
import { getCpiMultiplier } from "@/lib/config/psa-cpi"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconQuote, IconSchool, IconBriefcase } from "@tabler/icons-react"

interface MentorQuotesFeedProps {
  quotes: CareerRecord[]
  cpiAdjusted: boolean
}

export function MentorQuotesFeed({
  quotes,
  cpiAdjusted,
}: MentorQuotesFeedProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">
            Insider Career Advice & Mentor Stories
          </CardTitle>
          <CardDescription className="text-xs">
            Unfiltered workplace learnings, salary pitfalls, and progression
            advice from experienced Filipino practitioners.
          </CardDescription>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {quotes.length} Quotes Matched
        </Badge>
      </CardHeader>

      <CardContent className="pt-2">
        {quotes.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No mentor quotes match your current filter query. Try searching for
            broader terms.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quotes.map((q) => {
              const rawSalary = q.nominalMonthlyGrossPhp.median
              const displaySalary = cpiAdjusted
                ? Math.round(rawSalary * getCpiMultiplier(q.cohortYear))
                : rawSalary

              return (
                <div
                  key={q.id}
                  className="relative flex flex-col justify-between rounded-lg border border-border/70 bg-muted/15 p-4 text-xs transition-colors hover:border-border"
                >
                  <div className="flex gap-2">
                    <IconQuote className="h-5 w-5 shrink-0 rotate-180 text-muted-foreground/60" />
                    <blockquote className="leading-relaxed text-foreground/90 italic">
                      &ldquo;{q.mentorAdviceQuote}&rdquo;
                    </blockquote>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <IconBriefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <strong className="text-foreground">{q.rawTitle}</strong>
                      <span className="font-mono">({q.yoeYears} YOE)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.schoolCanonical && (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-sans">
                          <IconSchool className="h-3 w-3" />
                          {q.schoolCanonical}
                        </span>
                      )}
                      {displaySalary > 0 && (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₱{displaySalary.toLocaleString()}/mo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
