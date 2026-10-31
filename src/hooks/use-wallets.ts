import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { walletsApi } from "@/lib/api/wallets"
import type { TransferInput, WalletInput } from "@/lib/api/types/wallet"
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys"

export function useWallets(includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.wallets.list(includeArchived),
    queryFn: () => walletsApi.list(includeArchived),
  })
}

export function useWallet(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.wallets.detail(id ?? ""),
    queryFn: () => walletsApi.get(id as string),
    enabled: Boolean(id),
  })
}

export function useWalletSummary() {
  return useQuery({
    queryKey: queryKeys.wallets.summary,
    queryFn: () => walletsApi.summary(),
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WalletInput) => walletsApi.create(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useUpdateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WalletInput }) =>
      walletsApi.update(id, input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useDeleteWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archive = false }: { id: string; archive?: boolean }) =>
      walletsApi.remove(id, archive),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TransferInput) => walletsApi.transfer(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}
