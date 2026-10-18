import { useCallback, useMemo, useSyncExternalStore } from "react"

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }, [key])

  const getServerSnapshot = useCallback(() => null, [])

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const value = useMemo<T>(() => {
    if (raw === null) return initialValue
    try {
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
  }, [raw, initialValue])

  const setStoredValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      try {
        const next =
          typeof val === "function" ? (val as (prev: T) => T)(value) : val
        localStorage.setItem(key, JSON.stringify(next))
        window.dispatchEvent(new Event("storage"))
      } catch {
        // quota exceeded or private mode
      }
    },
    [key, value]
  )

  return [value, setStoredValue]
}
