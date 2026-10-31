import type { CategoryBrief, WalletBrief } from "./common"

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER"

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  memo: string
  note: string
  date: string
  transactionTypeId: string
  wallet?: WalletBrief
  transferWallet?: WalletBrief
  category?: CategoryBrief
  createdAt: string
  updatedAt: string
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  walletId: string
  transferWalletId?: string | null
  categoryId?: string | null
  date?: string
  memo?: string
  note?: string
}

export interface TransactionFilter {
  from?: string
  to?: string
  type?: TransactionType | ""
  categoryId?: string
  walletId?: string
  q?: string
  minAmount?: number
  maxAmount?: number
  page?: number
  limit?: number
  sort?: string
}

export interface TransactionSummary {
  income: number
  expense: number
  net: number
  count: number
}

export type BulkTransactionAction = "delete" | "categorize" | "wallet"

export interface BulkTransactionInput {
  ids: string[]
  action: BulkTransactionAction
  value?: string
}
