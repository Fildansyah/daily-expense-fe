import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billsApi } from "@/lib/api";
import { toISODate } from "@/lib/format";
import type { BillFilters, BillInput } from "@/lib/types";

export function useBills(filters: BillFilters, enabled = true) {
  return useQuery({
    queryKey: ["bills", filters],
    queryFn: () => billsApi.list(filters),
    enabled,
  })
}

export function useBill(id: string | undefined) {
  return useQuery({
    queryKey: ["bills", id],
    queryFn: () => billsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useBillSummary(filters: BillFilters) {
  return useQuery({
    queryKey: ["bill-summary", filters],
    queryFn: () => billsApi.summary(filters),
  })
}

// "Hari ini" dihitung di dalam queryFn (saat fetch, bukan saat render)
export function useUpcomingBills() {
  return useQuery({
    queryKey: ["bills-upcoming"],
    queryFn: () => {
      const now = new Date()
      return billsApi.list({
        from: toISODate(now),
        to: toISODate(new Date(now.getTime() + 7 * 86_400_000)),
      })
    },
  })
}

export function usePastBills() {
  return useQuery({
    queryKey: ["bills-past"],
    queryFn: () =>
      billsApi.list({ to: toISODate(new Date(Date.now() - 86_400_000)) }),
  })
}

export function useLenders() {
  return useQuery({
    queryKey: ["lenders"],
    queryFn: () => billsApi.lenders(),
    staleTime: Infinity,
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BillInput) => billsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BillInput }) =>
      billsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }),
  });
}
