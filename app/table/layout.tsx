import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Raw Compensation Records",
  description:
    "Search, filter, sort, and export 4,010 verified Philippine salary submissions from Liyab First Pay and r/phcareers.",
  alternates: {
    canonical: "/table",
  },
  openGraph: {
    title: "Raw Compensation Records | Magkano Ba?",
    description:
      "Search, filter, sort, and export 4,010 verified Philippine salary submissions from Liyab First Pay and r/phcareers.",
    url: "/table",
  },
}

export default function TableLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
