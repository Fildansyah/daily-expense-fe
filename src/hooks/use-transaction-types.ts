import { useQuery } from "@tanstack/react-query"

import { transactionTypesApi } from "@/lib/api/transaction-types"

export function useTransactionTypes() {
  return useQuery({
    queryKey: ["transaction-types"] as const,
    queryFn: () => transactionTypesApi.list(),
    staleTime: Infinity,
  })
}
