import { useQuery } from "@tanstack/react-query"

import { reportsApi } from "@/lib/api/reports"
import { queryKeys } from "@/lib/query-keys"

export function useDashboard(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.dashboard(from, to),
    queryFn: () => reportsApi.dashboard({ from, to }),
  })
}

export function useCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.calendar(from, to),
    queryFn: () => reportsApi.calendar({ from, to }),
  })
}

export function useReportSummary(from?: string, to?: string, compare = false) {
  return useQuery({
    queryKey: queryKeys.reports.summary(from, to, compare),
    queryFn: () => reportsApi.summary({ from, to, compare }),
  })
}

export function useCashflow(from?: string, to?: string, granularity = "month") {
  return useQuery({
    queryKey: queryKeys.reports.cashflow(from, to, granularity),
    queryFn: () => reportsApi.cashflow({ from, to, granularity }),
  })
}

export function useCategoryReport(
  from?: string,
  to?: string,
  type: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE",
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.reports.categories(from, to, type),
    queryFn: () => reportsApi.categories({ from, to, type }),
    enabled,
  })
}

export function useTrendReport(from?: string, to?: string, compare = false) {
  return useQuery({
    queryKey: queryKeys.reports.trend(from, to, compare),
    queryFn: () => reportsApi.trend({ from, to, compare }),
  })
}

export function useDebtReport(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.debt(from, to),
    queryFn: () => reportsApi.debt({ from, to }),
  })
}

export function useNetWorthReport(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.reports.networth(from, to),
    queryFn: () => reportsApi.networth({ from, to }),
  })
}
