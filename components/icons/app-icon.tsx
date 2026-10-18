import React from "react"

export function AppIcon({
  className = "h-7 w-7",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      {...props}
    >
      <rect width="32" height="32" rx="7" fill="#0F172A" />
      <rect
        x="0.75"
        y="0.75"
        width="30.5"
        height="30.5"
        rx="6.25"
        stroke="#334155"
        strokeWidth="1.5"
      />
      <path
        d="M11 7v18M11 7h5.5a5 5 0 0 1 0 10H11"
        stroke="#F8FAFC"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10.5h13.5M7 13.5h13.5"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="23.5" cy="8.5" r="2.25" fill="#10B981" />
    </svg>
  )
}
