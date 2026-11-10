import type { CareerRecord } from "@/lib/types"

let cachedRecordsPromise: Promise<CareerRecord[]> | null = null

/**
 * Loads career records from /data/records.json.
 * Caches the in-flight or resolved Promise in memory so subsequent calls
 * across page transitions (e.g. between / and /table) resolve instantaneously
 * without re-fetching or re-parsing the dataset.
 */
export function loadCareerRecords(): Promise<CareerRecord[]> {
  if (cachedRecordsPromise) {
    return cachedRecordsPromise
  }

  cachedRecordsPromise = (async () => {
    try {
      const res = await fetch("/data/records.json")
      if (!res.ok) {
        throw new Error(`Failed to load dataset: ${res.status} ${res.statusText}`)
      }
      const raw = await res.json()

      if (process.env.NODE_ENV === "development") {
        const [{ z }, { CareerRecordSchema }] = await Promise.all([
          import("zod"),
          import("@/lib/types"),
        ])
        const parsed = z.array(CareerRecordSchema).safeParse(raw)
        if (parsed.success) {
          return parsed.data
        }
        console.error(
          "Schema validation warning on records.json:",
          parsed.error.issues.length,
          "issues"
        )
        return Array.isArray(raw) ? (raw as CareerRecord[]) : []
      }

      return Array.isArray(raw) ? (raw as CareerRecord[]) : []
    } catch (err) {
      // Reset cache on network or parse failure so callers can retry
      cachedRecordsPromise = null
      throw err
    }
  })()

  return cachedRecordsPromise
}

/**
 * Clears the in-memory records cache. Useful for test isolation or reload triggers.
 */
export function clearCareerRecordsCache(): void {
  cachedRecordsPromise = null
}
