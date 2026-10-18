"use client"

import React from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function MethodologyModal() {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer text-xs text-primary underline transition-colors hover:text-primary/80">
        Methodology & Math Model
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Analytical & Economic Framework</DialogTitle>
          <DialogDescription className="text-xs">
            How 4,000+ community salary rows are normalized, inflation-indexed,
            and evaluated for tax parity.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sources" className="mt-2 w-full text-xs">
          <TabsList className="grid h-8 w-full grid-cols-3">
            <TabsTrigger value="sources" className="text-xs">
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="cpi" className="text-xs">
              2026 CPI Index
            </TabsTrigger>
            <TabsTrigger value="tax" className="text-xs">
              TRAIN vs. 8% Tax
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="sources"
            className="space-y-2 pt-2 leading-relaxed text-muted-foreground"
          >
            <p>
              Datasets originate from crowdsourced Philippine compensation
              records:
            </p>
            <ul className="list-disc space-y-1.5 pl-4">
              <li>
                <a
                  href="https://docs.google.com/spreadsheets/d/1gnA91Tjr_3UCNV8x1_LoE0oC56r-pXXRdJcgTfOLlm0/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Liyab First Pay Survey ↗
                </a>
                : ~3,000 entry-level responses detailing initial salaries,
                universities, and offer negotiation outcomes.
              </li>
              <li>
                <a
                  href="https://docs.google.com/spreadsheets/d/14RExibfpaRE0-81jjLvm374_BihMpq7zjUyFKwAqetU/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-foreground underline underline-offset-2 hover:text-primary"
                >
                  Work/Career Path Info Sheet ↗
                </a>
                : ~1,000 submissions detailing guaranteed bonus months
                (13th–16th), allowances, leaves, and mentor advice quotes.
              </li>
            </ul>
            <p className="pt-1 text-[11px]">
              Sanitization boundary: Entries with monthly pay below ₱3,000 or
              above ₱2,000,000 are rejected from numeric stats. Low samples ($n
              &lt; 5$) receive explicit warning badges.
            </p>
          </TabsContent>

          <TabsContent
            value="cpi"
            className="space-y-2 pt-2 leading-relaxed text-muted-foreground"
          >
            <p>
              Submissions range from 2005 to 2021+. To remove temporal
              distortion, historical salaries scale to 2026 purchasing power
              using Philippine Statistics Authority (PSA) Consumer Price Index
              (2018=100 base) annual averages:
            </p>
            <div className="rounded-md bg-muted p-2 font-mono text-[11px] text-foreground">
              AdjustedSalary = NominalSalary × (CPI_2026 / CPI_year)
            </div>
            <p className="text-[11px]">
              Pre-2005 entries clamp to the 2005 CPI index (57.0); 2026 index is
              fixed at 134.5.
            </p>
          </TabsContent>

          <TabsContent
            value="tax"
            className="space-y-2 pt-2 leading-relaxed text-muted-foreground"
          >
            <p>
              When toggled to <em>Net Take-Home</em>, packages evaluate to a
              12-month net equivalent:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong className="text-foreground">PH Local:</strong> 2026
                graduated TRAIN tax schedule, ₱90,000 tax-exempt bonus
                threshold, employee statutory contributions (SSS up to ₱35k MSC,
                2.5% PhilHealth, ₱200 Pag-IBIG cap), plus guaranteed bonuses &
                allowances.
              </li>
              <li>
                <strong className="text-foreground">Foreign Remote:</strong> BIR
                8% flat gross receipts tax (deducting ₱250k exemption for annual
                &le; ₱3M) and voluntary self-employed statutory allocations.
              </li>
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
