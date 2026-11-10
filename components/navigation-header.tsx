"use client"

import React, { useCallback, useMemo } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { AppIcon } from "@/components/icons/app-icon"
import { DashboardTab } from "@/hooks/use-dashboard-filter-params"
import { Button } from "@/components/ui/button"
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
  {
    tab: "table",
    label: "Raw Data",
    icon: IconTable,
  },
]

/**
 * Header navigation component providing workspace view switching,
 * persistent search param URL generation, theme toggling, and methodology dialog.
 */
export function NavigationHeader({
  activeTab = "curves",
  onTabChange,
}: NavigationHeaderProps) {
  const searchParams = useSearchParams()
  const { resolvedTheme, setTheme } = useTheme()

  // Extract shared query parameters to preserve across navigation
  const sharedQueryString = useMemo(() => {
    const params = new URLSearchParams()
    for (const [key, val] of searchParams.entries()) {
      if (key !== "tab") {
        params.set(key, val)
      }
    }
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
              if (onTabChange) {
                e.preventDefault()
                onTabChange("curves")
              }
            }}
            aria-current={activeTab === "curves" ? "page" : undefined}
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
            const isActive = activeTab === view.tab

            if (onTabChange) {
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
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          {actions}
        </div>
      </div>
    </header>
  )
}
