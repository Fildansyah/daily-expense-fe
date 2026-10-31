"use client"

import { useSearchParams } from "next/navigation"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"

import { monthRange } from "@/lib/format"

export interface PeriodRange {
  from?: string
  to?: string
}

export function usePeriodRange(): {
  from?: string
  to?: string
  range: PeriodRange
  setRange: (range: PeriodRange) => void
  setMonth: (year: number, month: number) => void
} {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const from = searchParams.get("from") ?? undefined
  const to = searchParams.get("to") ?? undefined

  const setRange = useCallback(
    (range: PeriodRange) => {
      const params = new URLSearchParams(searchParams.toString())
      if (range.from) params.set("from", range.from)
      else params.delete("from")
      if (range.to) params.set("to", range.to)
      else params.delete("to")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams],
  )

  const setMonth = useCallback(
    (year: number, month: number) => {
      const range = monthRange(year, month)
      setRange(range)
    },
    [setRange],
  )

  return useMemo(
    () => ({ from, to, range: { from, to }, setRange, setMonth }),
    [from, to, setRange, setMonth],
  )
}
