import { describe, expect, it } from "vitest"

import { formatIDR, fromISODate, monthRange, toISODate } from "./format"

function normalize(value: string) {
  return value.replace(/\u00a0/g, " ")
}

describe("formatIDR", () => {
  it("memformat rupiah tanpa desimal", () => {
    expect(normalize(formatIDR(1250000))).toBe("Rp 1.250.000")
    expect(normalize(formatIDR(0))).toBe("Rp 0")
  })
})

describe("date helpers", () => {
  it("mengubah Date ke ISO date tanpa timezone shift", () => {
    expect(toISODate(new Date(2026, 9, 5))).toBe("2026-10-05")
  })

  it("mengembalikan ISO date ke Date lokal", () => {
    const date = fromISODate("2026-10-05")
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(9)
    expect(date.getDate()).toBe(5)
  })

  it("menghitung rentang bulan termasuk akhir bulan", () => {
    expect(monthRange(2026, 9)).toEqual({ from: "2026-10-01", to: "2026-10-31" })
    expect(monthRange(2024, 1)).toEqual({ from: "2024-02-01", to: "2024-02-29" })
  })
})
