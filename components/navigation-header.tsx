"use client"

import React, { useCallback, useMemo } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { AppIcon } from "@/components/icons/app-icon"
import { DashboardTab } from "@/hooks/use-dashboard-filter-params"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MethodologyModal } from "@/components/methodology-modal"
import {
  IconChartLine,
  IconBuildingArch,
  IconScale,
  IconSparkles,
  IconTable,
  IconSun,
  IconMoon,
} from "@tabler/icons-react"

interface NavigationHeaderProps {
  activeTab?: DashboardTab
  onTabChange?: (tab: DashboardTab) => void
}

const DASHBOARD_VIEWS: {
  tab: DashboardTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    tab: "curves",
    label: "Benchmarks",
    icon: IconChartLine,
  },
  {
    tab: "schools",
    label: "Schools & Perks",
    icon: IconBuildingArch,
  },
  {
    tab: "arbitrage",
    label: "Arbitrage",
    icon: IconScale,
  },
  {
    tab: "auditor",
    label: "Offer Auditor",
    icon: IconSparkles,
  },
]

export function NavigationHeader({
  activeTab = "curves",
  onTabChange,
}: NavigationHeaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { resolvedTheme, setTheme } = useTheme()
  const isTablePage = pathname.startsWith("/table")

  // Extract shared query parameters (q, industry, seniority, cpi) to preserve across routes
  const sharedQueryString = useMemo(() => {
    const params = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) params.set("q", q)
    const industry = searchParams.get("industry")
    if (industry && industry !== "ALL") params.set("industry", industry)
    const seniority = searchParams.get("seniority")
    if (seniority && seniority !== "ALL") params.set("seniority", seniority)
    const cpi = searchParams.get("cpi")
    if (cpi !== null) params.set("cpi", cpi)
    return params.toString()
  }, [searchParams])

  const getDashboardHref = useCallback(
    (tab: DashboardTab) => {
      const params = new URLSearchParams(sharedQueryString)
      if (tab !== "curves") {
        params.set("tab", tab)
      }
      const qs = params.toString()
      return qs ? `/?${qs}` : "/"
    },
    [sharedQueryString]
  )

  const tableHref = useMemo(() => {
    return sharedQueryString ? `/table?${sharedQueryString}` : "/table"
  }, [sharedQueryString])

  const homeHref = useMemo(() => {
    return getDashboardHref("curves")
  }, [getDashboardHref])

  const actions = (
    <>
      <MethodologyModal />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle color theme"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="text-muted-foreground hover:text-foreground"
            />
          }
        >
          <IconSun className="hidden size-4 dark:block" />
          <IconMoon className="block size-4 dark:hidden" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Toggle theme (Press D)
        </TooltipContent>
      </Tooltip>
    </>
  )

  return (
    <header className="border-b border-border bg-background/95 px-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col pb-2.5 md:h-14 md:flex-row md:items-center md:justify-between md:gap-4 md:pb-0">
        {/* Top row: Brand + Mobile Actions */}
        <div className="flex h-14 items-center justify-between gap-2 md:h-auto">
          <Link
            href={homeHref}
            onClick={(e) => {
              if (!isTablePage && onTabChange) {
                e.preventDefault()
                onTabChange("curves")
              }
            }}
            aria-current={!isTablePage && activeTab === "curves" ? "page" : undefined}
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <AppIcon className="size-6 shrink-0 rounded-md" />
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-sm font-semibold tracking-tight text-foreground sm:text-base">
                Magkano Ba?
              </span>
              <span className="hidden text-xs text-muted-foreground lg:inline">
                PH Compensation Ledger
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            {actions}
          </div>
        </div>

        {/* Unified Workspace Navigation */}
        <nav
          aria-label="Primary workspace navigation"
          className="flex w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border/80 bg-muted/50 p-0.5 [scrollbar-width:none] md:w-auto [&::-webkit-scrollbar]:hidden"
        >
          {DASHBOARD_VIEWS.map((view) => {
            const Icon = view.icon
            const isActive = !isTablePage && activeTab === view.tab

            if (!isTablePage && onTabChange) {
              return (
                <button
                  key={view.tab}
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onTabChange(view.tab)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span>{view.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={view.tab}
                href={getDashboardHref(view.tab)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon
                  className={`size-3.5 shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span>{view.label}</span>
              </Link>
            )
          })}

          <Separator orientation="vertical" className="mx-0.5 h-4" />

          <Link
            href={tableHref}
            aria-current={isTablePage ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              isTablePage
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <IconTable
              className={`size-3.5 shrink-0 ${
                isTablePage ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <span>Raw Data</span>
          </Link>
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {actions}
        </div>
      </div>
    </header>
  )
}
