import { request, toQuery } from "./client"
import type {
  Budget,
  BudgetInput,
  BudgetSummary,
  CopyBudgetInput,
} from "./types/budget"

export const budgetsApi = {
  list(month: string) {
    return request<Budget[]>(`/budgets${toQuery({ month })}`)
  },

  summary(month: string) {
    return request<BudgetSummary>(`/budgets/summary${toQuery({ month })}`)
  },

  create(input: BudgetInput) {
    return request<Budget>("/budgets", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  update(id: string, amount: number) {
    return request<Budget>(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ amount }),
    })
  },

  remove(id: string) {
    return request<{ message: string }>(`/budgets/${id}`, { method: "DELETE" })
  },

  copy(input: CopyBudgetInput) {
    return request<{ message: string; created: number }>("/budgets/copy", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },
}
