import { request } from "./client"
import type { TransactionTypeRecord } from "./types/transaction-type"

export const transactionTypesApi = {
  list() {
    return request<TransactionTypeRecord[]>("/transaction-type")
  },
}
