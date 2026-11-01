import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Magkano Ba? | Philippine Compensation & Career Ledger",
    short_name: "Magkano Ba?",
    description:
      "Community-grounded Philippine salary, tax arbitrage, and career intelligence across 4,000+ verified submissions.",
    start_url: "/",
    display: "standalone",
    background_color: "#171816",
    theme_color: "#171816",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
