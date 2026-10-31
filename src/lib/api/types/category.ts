export interface CategoryTransactionType {
  id: string
  type: string
}

export interface Category {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  transactionTypeId: string
  transactionTypes?: CategoryTransactionType
  icon: string
  bgColor: string
  parentId?: string | null
  sortOrder: number
  isArchived: boolean
  transactionCount: number
  transactionTypeName?: string
  children: Category[]
}

export interface CategoryInput {
  name: string
  transactionTypeId: string
  parentId?: string | null
  bgColor?: string
  icon?: string
  sortOrder?: number
  isArchived?: boolean
}

export interface CategoryReorderItem {
  id: string
  parentId?: string | null
  sortOrder: number
}
