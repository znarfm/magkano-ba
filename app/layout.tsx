import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Instrument_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

const instrumentSansHeading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://magkano-ba.meinard.dev"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#171816" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Magkano Ba?",
  title: {
    default: "Magkano Ba? | Philippine Compensation & Career Ledger",
    template: "%s | Magkano Ba?",
  },
  description:
    "Community-grounded Philippine salary, tax arbitrage, and career intelligence across 4,000+ verified submissions indexed to 2026 PSA CPI.",
  keywords: [
    "Philippine salary",
    "compensation dashboard",
    "phcareers",
    "Liyab First Pay",
    "salary benchmark Philippines",
    "TRAIN law net pay",
    "8% flat tax calculator",
    "Philippine tech salaries",
  ],
  authors: [{ name: "Magkano Ba Community" }],
  creator: "Magkano Ba",
  publisher: "Magkano Ba",
  category: "finance",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "/",
    siteName: "Magkano Ba?",
    title: "Magkano Ba? | Philippine Compensation & Career Ledger",
    description:
      "Community-grounded Philippine salary, tax arbitrage, and career intelligence across 4,000+ verified submissions indexed to 2026 PSA CPI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Magkano Ba? | Philippine Compensation & Career Ledger",
    description:
      "Community-grounded Philippine salary, tax arbitrage, and career intelligence across 4,000+ verified submissions indexed to 2026 PSA CPI.",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "font-sans",
        fontMono.variable,
        geistSans.variable,
        instrumentSansHeading.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
