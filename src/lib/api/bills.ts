import { request, toQuery } from "./client"
import type { Paginated } from "./types/common"
import type {
  Bill,
  BillFilter,
  BillInput,
  BillPayment,
  BillPaymentInput,
  BillSummary,
  Lender,
} from "./types/bill"
import type { Transaction } from "./types/transaction"

export const billsApi = {
  list(filter: BillFilter = {}) {
    return request<Paginated<Bill>>(
      `/bills${toQuery(filter as Record<string, string | number | undefined>)}`,
    )
  },

  get(id: string) {
    return request<Bill>(`/bills/${id}`)
  },

  create(input: BillInput) {
    return request<Bill>("/bills", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  update(id: string, input: BillInput) {
    return request<Bill>(`/bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  remove(id: string) {
    return request<{ message: string }>(`/bills/${id}`, { method: "DELETE" })
  },

  summary(filter: { from?: string; to?: string } = {}) {
    return request<BillSummary>(`/bills/summary${toQuery(filter)}`)
  },

  payments(billId: string) {
    return request<BillPayment[]>(`/bills/${billId}/payments`)
  },

  addPayment(billId: string, input: BillPaymentInput) {
    return request<{
      payment: BillPayment
      bill: Bill
      transaction?: Transaction
    }>(`/bills/${billId}/payments`, {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  removePayment(billId: string, paymentId: string) {
    return request<{ message: string }>(
      `/bills/${billId}/payments/${paymentId}`,
      { method: "DELETE" },
    )
  },

  lenders() {
    return request<Lender[]>("/lenders")
  },

  createLender(name: string) {
    return request<Lender>("/lenders", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  },

  updateLender(id: string, name: string) {
    return request<Lender>(`/lenders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    })
  },

  removeLender(id: string) {
    return request<{ message: string }>(`/lenders/${id}`, { method: "DELETE" })
  },
}
