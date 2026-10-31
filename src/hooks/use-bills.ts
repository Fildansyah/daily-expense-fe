import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { billsApi } from "@/lib/api/bills"
import type {
  BillFilter,
  BillInput,
  BillPaymentInput,
} from "@/lib/api/types/bill"
import { toISODate } from "@/lib/format"
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys"

export function useBills(filter: BillFilter = {}) {
  return useQuery({
    queryKey: queryKeys.bills.list(filter),
    queryFn: () => billsApi.list(filter),
    placeholderData: (previous) => previous,
  })
}

export function useBill(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bills.detail(id ?? ""),
    queryFn: () => billsApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useBillSummary(filter: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.bills.summary(filter.from, filter.to),
    queryFn: () => billsApi.summary(filter),
  })
}

export function usePayments(billId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bills.payments(billId ?? ""),
    queryFn: () => billsApi.payments(billId as string),
    enabled: Boolean(billId),
  })
}

export function useUpcomingBills() {
  return useQuery({
    queryKey: ["bills", "upcoming"] as const,
    queryFn: async () => {
      const now = new Date()
      const from = toISODate(now)
      const to = toISODate(new Date(now.getTime() + 7 * 86_400_000))
      const result = await billsApi.list({ from, to, limit: 50 })
      return result.items
    },
  })
}

export function usePastBills() {
  return useQuery({
    queryKey: ["bills", "past"] as const,
    queryFn: async () => {
      const to = toISODate(new Date(Date.now() - 86_400_000))
      const result = await billsApi.list({ to, limit: 100 })
      return result.items
    },
  })
}

export function useLenders() {
  return useQuery({
    queryKey: queryKeys.lenders.root,
    queryFn: () => billsApi.lenders(),
    staleTime: Infinity,
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BillInput) => billsApi.create(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useUpdateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BillInput }) =>
      billsApi.update(id, data),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useDeleteBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => billsApi.remove(id),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useAddPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      billId,
      input,
    }: {
      billId: string
      input: BillPaymentInput
    }) => billsApi.addPayment(billId, input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useDeletePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      billId,
      paymentId,
    }: {
      billId: string
      paymentId: string
    }) => billsApi.removePayment(billId, paymentId),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useCreateLender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => billsApi.createLender(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.root })
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.root })
    },
  })
}

export function useUpdateLender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      billsApi.updateLender(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.root })
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.root })
    },
  })
}

export function useDeleteLender() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => billsApi.removeLender(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lenders.root })
      queryClient.invalidateQueries({ queryKey: queryKeys.bills.root })
    },
  })
}
