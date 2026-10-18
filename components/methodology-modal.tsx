'use client';

import React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function MethodologyModal() {
  return (
    <Dialog>
      <DialogTrigger className="text-xs text-primary underline hover:text-primary/80 transition-colors cursor-pointer">
        Methodology & Math Model
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytical & Economic Framework</DialogTitle>
          <DialogDescription className="text-xs">
            How 4,000+ community salary rows are normalized, inflation-indexed, and evaluated for tax parity.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sources" className="w-full text-xs mt-2">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="sources" className="text-xs">Data Sources</TabsTrigger>
            <TabsTrigger value="cpi" className="text-xs">2026 CPI Index</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs">TRAIN vs. 8% Tax</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-2 pt-2 text-muted-foreground leading-relaxed">
            <p>
              Datasets originate from crowdsourced Philippine compensation records:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong className="text-foreground">Liyab First Pay Survey:</strong> ~3,000 entry-level responses detailing initial salaries, universities, and offer negotiation outcomes.
              </li>
              <li>
                <strong className="text-foreground">Work/Career Path Info Sheet:</strong> ~1,000 submissions detailing guaranteed bonus months (13th–16th), allowances, leaves, and mentor advice quotes.
              </li>
            </ul>
            <p className="text-[11px] pt-1">
              Sanitization boundary: Entries with monthly pay below ₱3,000 or above ₱2,000,000 are rejected from numeric stats. Low samples ($n &lt; 5$) receive explicit warning badges.
            </p>
          </TabsContent>

          <TabsContent value="cpi" className="space-y-2 pt-2 text-muted-foreground leading-relaxed">
            <p>
              Submissions range from 2005 to 2021+. To remove temporal distortion, historical salaries scale to 2026 purchasing power using Philippine Statistics Authority (PSA) Consumer Price Index (2018=100 base) annual averages:
            </p>
            <div className="rounded-md bg-muted p-2 font-mono text-[11px] text-foreground">
              AdjustedSalary = NominalSalary × (CPI_2026 / CPI_year)
            </div>
            <p className="text-[11px]">
              Pre-2005 entries clamp to the 2005 CPI index (57.0); 2026 index is fixed at 134.5.
            </p>
          </TabsContent>

          <TabsContent value="tax" className="space-y-2 pt-2 text-muted-foreground leading-relaxed">
            <p>
              When toggled to <em>Net Take-Home</em>, packages evaluate to a 12-month net equivalent:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong className="text-foreground">PH Local:</strong> 2026 graduated TRAIN tax schedule, ₱90,000 tax-exempt bonus threshold, employee statutory contributions (SSS up to ₱35k MSC, 2.5% PhilHealth, ₱200 Pag-IBIG cap), plus guaranteed bonuses & allowances.
              </li>
              <li>
                <strong className="text-foreground">Foreign Remote:</strong> BIR 8% flat gross receipts tax (deducting ₱250k exemption for annual &le; ₱3M) and voluntary self-employed statutory allocations.
              </li>
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
