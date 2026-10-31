export interface Paginated<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface WalletBrief {
  id: string
  name: string
  type: string
  color: string
  icon: string
}

export interface CategoryBrief {
  id: string
  name: string
  icon: string
  bgColor: string
  parentId?: string | null
  parentName?: string
}
