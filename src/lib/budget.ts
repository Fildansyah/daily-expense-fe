import type { BudgetStatus } from "@/lib/api/types/budget"
import { monthLabel, toISODate } from "@/lib/format"

export type BudgetStatusValue = BudgetStatus

export const BUDGET_STATUS_LABEL: Record<BudgetStatus, string> = {
  aman: "Aman",
  waspada: "Mendekati",
  lebih: "Over-budget",
}

export const BUDGET_STATUS_CLASS: Record<BudgetStatus, string> = {
  aman: "bg-success/10 text-success",
  waspada: "bg-warning/15 text-[#8a5a00]",
  lebih: "bg-destructive/10 text-destructive",
}

export function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function shiftMonthKey(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number)
  const date = new Date(year, (monthNumber ?? 1) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function monthBoundsFromKey(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split("-").map(Number)
  const start = new Date(year, (monthNumber ?? 1) - 1, 1)
  const end = new Date(year, monthNumber ?? 1, 0)
  return { from: toISODate(start), to: toISODate(end) }
}

export function monthLabelFromKey(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  return monthLabel(year, (monthNumber ?? 1) - 1)
}

export function daysInMonth(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(year, monthNumber ?? 1, 0).getDate()
}

export function daysElapsed(month: string): number {
  const now = new Date()
  const key = currentMonthKey()
  if (month < key) return daysInMonth(month)
  if (month > key) return 0
  return now.getDate()
}

export function daysRemaining(month: string): number {
  return Math.max(0, daysInMonth(month) - daysElapsed(month))
}

export function overviewStatus(percentage: number): BudgetStatus {
  if (percentage > 100) return "lebih"
  if (percentage >= 80) return "waspada"
  return "aman"
}

export function formatCompact(value: number): string {
  const absolute = Math.abs(value)
  const sign = value < 0 ? "-" : ""
  if (absolute >= 1_000_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000_000).toFixed(1).replace(".", ",")} M`
  }
  if (absolute >= 1_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000).toFixed(1).replace(".", ",")} jt`
  }
  if (absolute >= 1_000) {
    return `${sign}Rp ${Math.round(absolute / 1_000)} rb`
  }
  return `${sign}Rp ${absolute}`
}
