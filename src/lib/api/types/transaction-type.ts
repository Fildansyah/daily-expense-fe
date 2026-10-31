export type TransactionTypeValue = "INCOME" | "EXPENSE" | "TRANSFER"

export interface TransactionTypeRecord {
  id: string
  createdAt: string
  type: TransactionTypeValue
}
