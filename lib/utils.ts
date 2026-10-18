export { cn } from "cn"

export const formatPhp = (val: number): string =>
  `₱${Math.round(val).toLocaleString()}`

export const formatPhpK = (val: number): string =>
  `₱${(val / 1000).toFixed(0)}k`
