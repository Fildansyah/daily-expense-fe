export type BudgetStatus = "aman" | "waspada" | "lebih"

export interface Budget {
  id: string
  categoryId: string
  periodMonth: string
  amount: number
  categoryName: string
  categoryIcon: string
  categoryColor: string
  spent: number
  remaining: number
  percentage: number
  status: BudgetStatus
  createdAt: string
  updatedAt: string
}

export interface BudgetInput {
  categoryId: string
  periodMonth: string
  amount: number
}

export interface BudgetUnbudgeted {
  categoryId: string
  categoryName: string
  categoryIcon: string
  spent: number
}

export interface BudgetSummary {
  periodMonth: string
  totalBudget: number
  totalSpent: number
  remaining: number
  percentage: number
  unbudgeted: BudgetUnbudgeted[]
}

export interface CopyBudgetInput {
  fromMonth: string
  toMonth: string
  skipExisting?: boolean
}
