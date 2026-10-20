"use client"

import React from "react"
import { CareerRecord } from "@/lib/types"
import { computeCompensationView } from "@/lib/economics"
import { formatPhp } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconQuote, IconSchool, IconBriefcase } from "@tabler/icons-react"

export type MentorQuoteItem = Pick<
  CareerRecord,
  | "id"
  | "rawTitle"
  | "yoeYears"
  | "schoolCanonical"
  | "nominalMonthlyGrossPhp"
  | "cohortYear"
  | "workScope"
  | "benefits"
  | "mentorAdviceQuote"
>

interface MentorQuotesFeedProps {
  quotes: MentorQuoteItem[]
  cpiAdjusted: boolean
}

export function MentorQuotesFeed({
  quotes,
  cpiAdjusted,
}: MentorQuotesFeedProps) {
  return (
    <Card className="border-border/70 bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base font-bold tracking-tight">
            Insider Career Advice & Mentor Stories
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Unfiltered workplace learnings, salary pitfalls, and progression
            advice from experienced Filipino practitioners.
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="border-primary/30 bg-muted/50 font-mono text-xs text-muted-foreground"
        >
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
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {quotes.map((q) => {
              const displaySalary = computeCompensationView(q, {
                cpiAdjusted,
                takeHomeParity: false,
              })

              return (
                <div
                  key={q.id}
                  className="relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/40 p-4 text-xs backdrop-blur-xs transition-all duration-150 hover:border-border hover:bg-card/80"
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
                          {formatPhp(displaySalary)}/mo
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
