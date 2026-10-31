import type { QueryClient } from "@tanstack/react-query"

import type { BillFilter } from "./api/types/bill"
import type { TransactionFilter } from "./api/types/transaction"

export const queryKeys = {
  transactions: {
    root: ["transactions"] as const,
    list: (filter: TransactionFilter) => ["transactions", "list", filter] as const,
    detail: (id: string) => ["transactions", "detail", id] as const,
    summary: (from?: string, to?: string) =>
      ["transactions", "summary", from ?? "", to ?? ""] as const,
  },
  bills: {
    root: ["bills"] as const,
    list: (filter: BillFilter) => ["bills", "list", filter] as const,
    detail: (id: string) => ["bills", "detail", id] as const,
    summary: (from?: string, to?: string) =>
      ["bills", "summary", from ?? "", to ?? ""] as const,
    payments: (id: string) => ["bills", "payments", id] as const,
    upcoming: (from: string, to: string) =>
      ["bills", "upcoming", from, to] as const,
    past: (to: string) => ["bills", "past", to] as const,
  },
  wallets: {
    root: ["wallets"] as const,
    list: (includeArchived: boolean) =>
      ["wallets", "list", includeArchived] as const,
    detail: (id: string) => ["wallets", "detail", id] as const,
    summary: ["wallets", "summary"] as const,
  },
  categories: {
    root: ["categories"] as const,
    tree: (type?: string, includeArchived = false) =>
      ["categories", "tree", type ?? "", includeArchived] as const,
  },
  budgets: {
    root: ["budgets"] as const,
    list: (month: string) => ["budgets", "list", month] as const,
    summary: (month: string) => ["budgets", "summary", month] as const,
  },
  reports: {
    root: ["reports"] as const,
    dashboard: (from?: string, to?: string) =>
      ["dashboard", from ?? "", to ?? ""] as const,
    calendar: (from?: string, to?: string) =>
      ["calendar", from ?? "", to ?? ""] as const,
    summary: (from?: string, to?: string, compare?: boolean) =>
      ["reports", "summary", from ?? "", to ?? "", Boolean(compare)] as const,
    cashflow: (from?: string, to?: string, granularity?: string) =>
      ["reports", "cashflow", from ?? "", to ?? "", granularity ?? ""] as const,
    categories: (from?: string, to?: string, type?: string) =>
      ["reports", "categories", from ?? "", to ?? "", type ?? ""] as const,
    trend: (from?: string, to?: string, compare?: boolean) =>
      ["reports", "trend", from ?? "", to ?? "", Boolean(compare)] as const,
    debt: (from?: string, to?: string) =>
      ["reports", "debt", from ?? "", to ?? ""] as const,
    networth: (from?: string, to?: string) =>
      ["reports", "networth", from ?? "", to ?? ""] as const,
  },
  lenders: {
    root: ["lenders"] as const,
  },
  user: {
    me: ["user", "me"] as const,
  },
}

export function invalidateFinancialData(queryClient: QueryClient) {
  const roots = [
    queryKeys.transactions.root,
    queryKeys.bills.root,
    queryKeys.wallets.root,
    queryKeys.budgets.root,
    queryKeys.categories.root,
    queryKeys.reports.root,
    ["dashboard"],
    ["calendar"],
  ]

  for (const root of roots) {
    queryClient.invalidateQueries({ queryKey: root })
  }
}
