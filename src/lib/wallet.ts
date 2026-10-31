import type { Bill } from "@/lib/api/types/bill"
import type { Wallet, WalletInput, WalletType } from "@/lib/api/types/wallet"

export function isLiability(type?: string): boolean {
  return type === "credit_card" || type === "paylater"
}

export const WALLET_TYPE_LABEL: Record<string, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-wallet",
  credit_card: "Kartu Kredit",
  paylater: "PayLater",
  investment: "Investasi",
}

export const WALLET_COLORS = [
  "#0F766E",
  "#0EA5E9",
  "#8B5CF6",
  "#F59E0B",
  "#F43F5E",
  "#84CC16",
  "#EC4899",
  "#64748B",
]

export const WALLET_ICONS = [
  "wallet",
  "landmark",
  "smartphone",
  "banknote",
  "credit-card",
  "piggy-bank",
  "briefcase",
]

export function maskedAccount(number?: string | null): string {
  if (!number) return "•••• ••••"
  const clean = number.replace(/\s+/g, "")
  return `•••• ${clean.slice(-4)}`
}

export function toWalletInput(
  wallet: Wallet,
  overrides: Partial<WalletInput> = {},
): WalletInput {
  return {
    name: wallet.name,
    type: wallet.type as WalletType,
    currency: wallet.currency,
    openingBalance: wallet.openingBalance,
    color: wallet.color,
    icon: wallet.icon,
    isExclude: wallet.isExclude,
    isArchived: wallet.isArchived,
    creditLimit: wallet.creditLimit ?? null,
    statementDay: wallet.statementDay ?? null,
    dueDay: wallet.dueDay ?? null,
    interestRate: wallet.interestRate ?? null,
    accountNumber: wallet.accountNumber ?? "",
    ...overrides,
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function nextDueDate(dueDay?: number | null): Date | null {
  if (!dueDay || dueDay < 1) return null

  const today = startOfDay(new Date())
  let target = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (target < today) {
    target = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
  }
  return target
}

export function statementPeriod(
  statementDay?: number | null,
): { start: Date; end: Date } | null {
  if (!statementDay || statementDay < 1) return null

  const today = startOfDay(new Date())
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth(), statementDay)
  const end = thisMonthEnd <= today ? thisMonthEnd : new Date(today.getFullYear(), today.getMonth() - 1, statementDay)
  const start = new Date(end.getFullYear(), end.getMonth() - 1, statementDay + 1)
  return { start, end }
}

export function daysUntil(date: Date): number {
  const today = startOfDay(new Date())
  return Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000)
}

export function minimumPayment(outstanding: number): number {
  if (outstanding <= 0) return 0
  return Math.max(50_000, Math.round(outstanding * 0.05))
}

export type UtilizationBand = "sehat" | "waspada" | "kritis"

export function utilizationBand(value: number): UtilizationBand {
  if (value >= 70) return "kritis"
  if (value >= 40) return "waspada"
  return "sehat"
}

export function installmentPortion(bills: Bill[]): number {
  return bills.reduce(
    (sum, bill) => (bill.installmentTotal ? sum + bill.remainingAmount : sum),
    0,
  )
}

export function punctualityRate(
  payments: { paidAt: string; dueDate: string }[],
): number | null {
  if (payments.length === 0) return null
  const onTime = payments.filter((payment) => payment.paidAt <= payment.dueDate).length
  return Math.round((onTime / payments.length) * 100)
}
