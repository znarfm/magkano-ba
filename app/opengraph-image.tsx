import { ImageResponse } from "next/og"

export const alt = "Magkano Ba? Philippine Compensation & Career Ledger"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#171816",
          color: "#f5f5f2",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            paddingBottom: "28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "#32966d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                fontWeight: 700,
                color: "#171816",
              }}
            >
              ₱
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Magkano Ba?
            </span>
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor: "rgba(50,150,109,0.18)",
              color: "#6ee7b7",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            2026 PSA CPI Indexed (134.5)
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              maxWidth: "960px",
            }}
          >
            Philippine Compensation & Career Intelligence Ledger
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#a3a69e",
              maxWidth: "880px",
              lineHeight: 1.4,
            }}
          >
            4,010+ verified community salary records, TRAIN vs. 8% remote tax
            arbitrage, university benchmarks, and BYOK Gemini offer auditing.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "28px",
            justifyContent: "space-between",
            fontSize: "20px",
            color: "#a3a69e",
          }}
        >
          <span>Liyab First Pay + r/phcareers Cohort</span>
          <span style={{ color: "#6ee7b7", fontWeight: 600 }}>
            100% Client-Side Analytics
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
