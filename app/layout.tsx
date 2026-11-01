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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://magkano-ba.meinard.dev"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171816" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Magkano Ba? | Filipino Career & Compensation Dashboard",
    template: "%s | Magkano Ba?",
  },
  description:
    "Community-grounded Philippine salary and career intelligence dashboard across 4,000+ verified submissions.",
  keywords: [
    "Philippine salary",
    "compensation dashboard",
    "phcareers",
    "Liyab First Pay",
    "salary benchmark Philippines",
    "TRAIN law net pay",
    "Philippine tech salaries",
  ],
  authors: [{ name: "Magkano Ba Community" }],
  creator: "Magkano Ba",
  publisher: "Magkano Ba",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteUrl,
    siteName: "Magkano Ba?",
    title: "Magkano Ba? | Filipino Career & Compensation Dashboard",
    description:
      "Community-grounded Philippine salary and career intelligence dashboard across 4,000+ verified submissions.",
  },
  twitter: {
    card: "summary",
    title: "Magkano Ba? | Filipino Career & Compensation Dashboard",
    description:
      "Community-grounded Philippine salary and career intelligence dashboard across 4,000+ verified submissions.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
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
