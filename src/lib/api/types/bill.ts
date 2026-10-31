import type { CategoryBrief, WalletBrief } from "./common"

export type BillStatus = "belum_bayar" | "sebagian" | "lunas"

export interface Bill {
  id: string
  lenderId: string
  lender: Lender
  amount: number
  paidAmount: number
  remainingAmount: number
  status: BillStatus
  isOverdue: boolean
  daysUntilDue: number
  dueDate: string
  deskripsi: string
  walletId?: string | null
  categoryId?: string | null
  installmentTotal?: number | null
  installmentIndex?: number | null
  interestRate?: number | null
  remindH3: boolean
  remindH1: boolean
  remindDue: boolean
  currency: string
  wallet?: WalletBrief
  category?: CategoryBrief
  createdAt: string
  updatedAt: string
}

export interface BillInput {
  lenderId: string
  amount: number
  paidAmount: number
  dueDate: string
  deskripsi: string
  walletId?: string | null
  categoryId?: string | null
  installmentTotal?: number | null
  installmentIndex?: number | null
  interestRate?: number | null
  remindH3?: boolean
  remindH1?: boolean
  remindDue?: boolean
  currency?: string
}

export interface BillFilter {
  from?: string
  to?: string
  lenderId?: string
  status?: BillStatus | ""
  walletId?: string
  overdue?: boolean
  q?: string
  page?: number
  limit?: number
  sort?: string
}

export interface BillLenderSummary {
  lenderId: string
  lender: Lender
  count: number
  total: number
  paid: number
  remaining: number
}

export interface BillStatusSummary {
  status: BillStatus
  count: number
  total: number
  paid: number
  remaining: number
}

export interface BillWalletSummary {
  walletId?: string
  walletName?: string
  count: number
  total: number
  paid: number
  remaining: number
}

export interface BillSummary {
  total: number
  paid: number
  remaining: number
  remainingAll: number
  overdueTotal: number
  dueThisWeek: number
  perLender: BillLenderSummary[]
  byStatus: BillStatusSummary[]
  byWallet: BillWalletSummary[]
}

export interface BillPayment {
  id: string
  billId: string
  amount: number
  paidAt: string
  walletId?: string | null
  note: string
  transactionId?: string | null
  createdAt: string
}

export interface BillPaymentInput {
  amount: number
  paidAt?: string
  walletId?: string | null
  note?: string
  createTransaction?: boolean
  categoryId?: string | null
}

export interface Lender {
  id: string
  name: string
}
