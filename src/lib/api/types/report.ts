import type {
  Bill,
  BillLenderSummary,
  BillStatusSummary,
  BillWalletSummary,
} from "./bill"
import type { Budget } from "./budget"
import type { Transaction } from "./transaction"
import type { WalletTypeSummary } from "./wallet"

export interface ReportPeriod {
  from: string
  to: string
}

export interface ReportKPI {
  totalBalance: number
  income: number
  expense: number
  net: number
  debt: number
  incomeDelta: number
  expenseDelta: number
  netDelta: number
  debtDelta: number
}

export interface CashflowPoint {
  period: string
  income: number
  expense: number
  net: number
}

export interface ReportCategory {
  categoryId: string
  name: string
  icon: string
  bgColor: string
  parentId?: string | null
  amount: number
  percentage: number
  count: number
  children?: ReportCategory[]
}

export interface WalletCredit {
  walletId: string
  name: string
  color: string
  limit: number
  used: number
  available: number
  utilization: number
}

export interface ReportTotals {
  from: string
  to: string
  income: number
  expense: number
  net: number
  count: number
}

export interface ReportSummary {
  period: ReportPeriod
  income: number
  expense: number
  net: number
  count: number
  previous: ReportTotals
  incomeDelta: number
  expenseDelta: number
  netDelta: number
}

export interface TrendPoint {
  period: string
  value: number
}

export interface TrendReport {
  current: TrendPoint[]
  previous?: TrendPoint[]
}

export interface DebtPoint {
  period: string
  remaining: number
}

export interface DebtReport {
  outstanding: number
  overdue: number
  dueThisWeek: number
  byLender: BillLenderSummary[]
  byStatus: BillStatusSummary[]
  byWallet: BillWalletSummary[]
  series: DebtPoint[]
}

export interface NetWorthPoint {
  period: string
  netChange: number
}

export interface NetWorthReport {
  assets: number
  liabilities: number
  net: number
  byType: WalletTypeSummary[]
  series: NetWorthPoint[]
}

export interface CalendarDay {
  date: string
  income: number
  expense: number
  net: number
  transactionCount: number
  transactions: Transaction[]
  bills: Bill[]
}

export interface CalendarReport {
  from: string
  to: string
  days: CalendarDay[]
  summary: ReportTotals
  billsDue: number
}

export interface Dashboard {
  period: ReportPeriod
  kpi: ReportKPI
  cashflow: CashflowPoint[]
  categoryBreakdown: ReportCategory[]
  upcomingBills: Bill[]
  recentTransactions: Transaction[]
  budgetProgress: Budget[]
  creditUtilization: WalletCredit[]
}
