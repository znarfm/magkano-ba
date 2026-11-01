"use client"

import React, { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

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

const INITIAL_QUOTE_COUNT = 4

export function MentorQuotesFeed({
  quotes,
  cpiAdjusted,
}: MentorQuotesFeedProps) {
  const [expanded, setExpanded] = useState(false)
  const visibleQuotes = expanded
    ? quotes.slice(0, 16)
    : quotes.slice(0, INITIAL_QUOTE_COUNT)

  return (
    <Card className="border-border bg-card shadow-none ring-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <CardTitle className="text-base font-semibold tracking-tight">
            Practitioner Field Notes
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Verified career advice and compensation takeaways from respondents
            in this slice.
          </CardDescription>
        </div>
        <Badge
          variant="secondary"
          className="font-mono text-[11px] text-muted-foreground"
        >
          {quotes.length} notes
        </Badge>
      </CardHeader>

      <CardContent className="p-0">
        {quotes.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No practitioner notes match the current filter selection.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-y-0">
              {visibleQuotes.map((q, idx) => {
                const displaySalary = computeCompensationView(q, {
                  cpiAdjusted,
                  takeHomeParity: false,
                })
                const cleanQuote = (q.mentorAdviceQuote || "")
                  .replace(/[—–]/g, "-")
                  .trim()

                const isLastOdd =
                  visibleQuotes.length % 2 === 1 &&
                  idx === visibleQuotes.length - 1

                return (
                  <article
                    key={q.id}
                    className={`flex flex-col justify-between p-4 text-xs ${
                      idx >= 2 ? "md:border-t md:border-border" : ""
                    } ${idx % 2 === 1 ? "md:border-l md:border-border" : ""} ${
                      isLastOdd ? "md:col-span-2" : ""
                    }`}
                  >
                    <blockquote className="line-clamp-3 leading-relaxed text-foreground/90">
                      &ldquo;{cleanQuote}&rdquo;
                    </blockquote>

                    <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {q.rawTitle}
                        </span>
                        <span className="font-mono">
                          ({q.yoeYears} YOE{q.schoolCanonical ? ` / ${q.schoolCanonical}` : ""})
                        </span>
                      </div>

                      {displaySalary > 0 && (
                        <span className="font-mono font-semibold tabular-nums text-primary">
                          {formatPhp(displaySalary)}/mo
                        </span>
                      )}
                    </footer>
                  </article>
                )
              })}
            </div>

            {quotes.length > INITIAL_QUOTE_COUNT && (
              <div className="flex justify-center border-t border-border bg-muted/20 px-4 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {expanded ? (
                    <>
                      <span>Show fewer notes</span>
                      <IconChevronUp className="size-3.5" />
                    </>
                  ) : (
                    <>
                      <span>
                        Show more notes ({Math.min(quotes.length, 16) - INITIAL_QUOTE_COUNT} more)
                      </span>
                      <IconChevronDown className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
