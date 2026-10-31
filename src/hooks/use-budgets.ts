import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { budgetsApi } from "@/lib/api/budgets"
import type { BudgetInput, CopyBudgetInput } from "@/lib/api/types/budget"
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys"

export function useBudgets(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets.list(month),
    queryFn: () => budgetsApi.list(month),
  })
}

export function useBudgetSummary(month: string) {
  return useQuery({
    queryKey: queryKeys.budgets.summary(month),
    queryFn: () => budgetsApi.summary(month),
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root })
      invalidateFinancialData(queryClient)
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      budgetsApi.update(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root })
      invalidateFinancialData(queryClient)
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => budgetsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root })
      invalidateFinancialData(queryClient)
    },
  })
}

export function useCopyBudgets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CopyBudgetInput) => budgetsApi.copy(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.root })
    },
  })
}
