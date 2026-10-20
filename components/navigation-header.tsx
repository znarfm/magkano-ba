"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AppIcon } from "@/components/icons/app-icon"
import { Badge } from "@/components/ui/badge"
import {
  IconChartBar,
  IconTable,
} from "@tabler/icons-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MethodologyModal } from "@/components/methodology-modal"

export function NavigationHeader() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Overview",
      icon: IconChartBar,
      active: pathname === "/",
    },
    {
      href: "/table",
      label: "Raw Records",
      icon: IconTable,
      active: pathname.startsWith("/table"),
    },
  ]

  return (
    <header className="border-b border-border/80 bg-card/50 px-4 py-2.5 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <AppIcon className="h-7 w-7 shrink-0 rounded-lg shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-foreground">
                  Magkano Ba?
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="inline-flex cursor-help">
                      <Badge
                        variant="outline"
                        className="border-primary/40 py-0 font-mono text-[10px] text-primary"
                      >
                        2026 PSA CPI
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Philippine Statistics Authority (PSA) Consumer Price Index (2018=100). Current 2026 index is 134.5 (+34.5% cumulative inflation since 2018). Adjusts historical peso compensation to 2026 purchasing power.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Philippine Compensation Intelligence
              </p>
            </div>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  item.active
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${item.active ? "text-primary" : "text-muted-foreground"}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right Status Strip */}
        <div className="hidden items-center gap-2.5 font-mono text-xs text-muted-foreground md:flex">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PSA CPI: 134.5
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                Active macroeconomic deflator: 2026 CPI benchmark at 134.5 rebased from 2018=100.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span>•</span>
          <MethodologyModal />
        </div>
      </div>
    </header>
  )
}
