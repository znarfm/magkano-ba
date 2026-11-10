import { redirect } from "next/navigation"
import { WORK_SCOPES } from "@/lib/types"

/**
 * Server-side redirect page that routes `/table` traffic to the unified
 * workspace tab (`/?tab=table`), preserving explicit parameters and applying
 * legacy table defaults for `cpi` (false) and `scopes` (all canonical scopes).
 */
export default async function TableRedirectPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const searchParams = await props.searchParams
  const params = new URLSearchParams()
  params.set("tab", "table")
  for (const [key, val] of Object.entries(searchParams)) {
    if (key === "tab") continue
    if (Array.isArray(val)) {
      val.forEach((v) => params.append(key, v))
    } else if (val !== undefined) {
      params.set(key, val)
    }
  }
  if (!params.has("cpi")) {
    params.set("cpi", "false")
  }
  if (!params.has("scopes")) {
    params.set("scopes", WORK_SCOPES.join(","))
  }
  redirect(`/?${params.toString()}`)
}

