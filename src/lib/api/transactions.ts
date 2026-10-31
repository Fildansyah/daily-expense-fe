import { request, toQuery } from "./client"
import type { Paginated } from "./types/common"
import type {
  BulkTransactionInput,
  Transaction,
  TransactionFilter,
  TransactionInput,
  TransactionSummary,
} from "./types/transaction"

export const transactionsApi = {
  list(filter: TransactionFilter = {}) {
    return request<Paginated<Transaction>>(
      `/transactions${toQuery(filter as Record<string, string | number | undefined>)}`,
    )
  },

  get(id: string) {
    return request<Transaction>(`/transactions/${id}`)
  },

  create(input: TransactionInput) {
    return request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  update(id: string, input: TransactionInput) {
    return request<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  remove(id: string) {
    return request<{ message: string }>(`/transactions/${id}`, {
      method: "DELETE",
    })
  },

  bulk(input: BulkTransactionInput) {
    return request<{ message: string }>("/transactions/bulk", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  summary(filter: { from?: string; to?: string } = {}) {
    return request<TransactionSummary>(`/transactions/summary${toQuery(filter)}`)
  },

  async listAll(
    filter: TransactionFilter = {},
    options: { pageSize?: number; maxPages?: number } = {},
  ) {
    const pageSize = options.pageSize ?? 100
    const maxPages = options.maxPages ?? 20
    const items: Transaction[] = []
    let page = 1
    let totalPages = 1

    do {
      const result = await request<Paginated<Transaction>>(
        `/transactions${toQuery({
          ...filter,
          page,
          limit: pageSize,
        } as Record<string, string | number | undefined>)}`,
      )
      items.push(...result.items)
      totalPages = result.meta.totalPages
      page += 1
    } while (page <= totalPages && page <= maxPages)

    return { items, truncated: totalPages > maxPages }
  },
}
