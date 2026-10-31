export type WalletType =
  | "cash"
  | "bank"
  | "ewallet"
  | "credit_card"
  | "paylater"
  | "investment"

export interface Wallet {
  id: string
  userId: string
  name: string
  balance: number
  openingBalance: number
  currency: string
  type: WalletType | string
  color: string
  icon: string
  isExclude: boolean
  isArchived: boolean
  creditLimit?: number | null
  used: number
  available: number
  utilization: number
  statementDay?: number | null
  dueDay?: number | null
  interestRate?: number | null
  accountNumber?: string
  createdAt: string
  updatedAt: string
}

export interface WalletInput {
  name: string
  type: WalletType
  currency?: string
  openingBalance?: number
  /** Dipertahankan untuk kompatibilitas payload lama. */
  balance?: number
  color?: string
  icon?: string
  isExclude?: boolean
  isArchived?: boolean
  creditLimit?: number | null
  statementDay?: number | null
  dueDay?: number | null
  interestRate?: number | null
  accountNumber?: string
}

export interface WalletTypeSummary {
  type: string
  total: number
}

export interface WalletSummary {
  totalBalance: number
  creditUsed: number
  creditLimit: number
  available: number
  byType: WalletTypeSummary[]
}

export interface TransferInput {
  walletId: string
  transferWalletId: string
  amount: number
  date: string
  memo?: string
  note?: string
}
