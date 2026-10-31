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
}
