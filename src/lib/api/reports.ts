import { request, toQuery } from "./client"
import type {
  CalendarReport,
  CashflowPoint,
  Dashboard,
  DebtReport,
  NetWorthReport,
  ReportCategory,
  ReportSummary,
  TrendReport,
} from "./types/report"

interface ReportRange {
  from?: string
  to?: string
}

export const reportsApi = {
  dashboard(range: ReportRange = {}) {
    return request<Dashboard>(
      `/dashboard${toQuery({ from: range.from, to: range.to })}`,
    )
  },

  calendar(range: ReportRange = {}) {
    return request<CalendarReport>(
      `/calendar${toQuery({ from: range.from, to: range.to })}`,
    )
  },

  summary(range: ReportRange & { compare?: boolean } = {}) {
    return request<ReportSummary>(
      `/reports/summary${toQuery({
        from: range.from,
        to: range.to,
        compare: range.compare ? "true" : "",
      })}`,
    )
  },

  cashflow(range: ReportRange & { granularity?: string } = {}) {
    return request<CashflowPoint[]>(
      `/reports/cashflow${toQuery({
        from: range.from,
        to: range.to,
        granularity: range.granularity,
      })}`,
    )
  },

  categories(range: ReportRange & { type?: string } = {}) {
    return request<ReportCategory[]>(
      `/reports/categories${toQuery({
        from: range.from,
        to: range.to,
        type: range.type,
      })}`,
    )
  },

  trend(range: ReportRange & { compare?: boolean } = {}) {
    return request<TrendReport>(
      `/reports/trend${toQuery({
        from: range.from,
        to: range.to,
        compare: range.compare ? "true" : "",
      })}`,
    )
  },

  debt(range: ReportRange = {}) {
    return request<DebtReport>(
      `/reports/debt${toQuery({ from: range.from, to: range.to })}`,
    )
  },

  networth(range: ReportRange = {}) {
    return request<NetWorthReport>(
      `/reports/networth${toQuery({ from: range.from, to: range.to })}`,
    )
  },
}
