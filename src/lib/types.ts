export * from "./api/types"

import type { BillFilter, BillStatus } from "./api/types/bill"

export type BillFilters = BillFilter

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  belum_bayar: "Belum Bayar",
  sebagian: "Dibayar Sebagian",
  lunas: "Lunas",
}

export function deriveStatus(paid: number, amount: number): BillStatus {
  if (paid <= 0) return "belum_bayar"
  if (paid >= amount) return "lunas"
  return "sebagian"
}

export function deriveRemaining(amount: number, paid: number): number {
  return Math.max(0, Math.round(amount - paid))
}
