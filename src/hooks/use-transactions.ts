import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { transactionsApi } from "@/lib/api/transactions"
import type {
  BulkTransactionInput,
  TransactionFilter,
  TransactionInput,
} from "@/lib/api/types/transaction"
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys"

export function useTransactions(filter: TransactionFilter = {}) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filter),
    queryFn: () => transactionsApi.list(filter),
    placeholderData: (previous) => previous,
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id ?? ""),
    queryFn: () => transactionsApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useTransactionSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.transactions.summary(from, to),
    queryFn: () => transactionsApi.summary({ from, to }),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TransactionInput) => transactionsApi.create(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) =>
      transactionsApi.update(id, input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useBulkTransactions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BulkTransactionInput) => transactionsApi.bulk(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}
