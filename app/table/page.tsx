import { redirect } from "next/navigation"

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
  redirect(`/?${params.toString()}`)
}
