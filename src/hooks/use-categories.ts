import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { categoriesApi } from "@/lib/api/categories"
import type {
  CategoryInput,
  CategoryReorderItem,
} from "@/lib/api/types/category"
import { invalidateFinancialData, queryKeys } from "@/lib/query-keys"

export function useCategoryTree(type?: string, includeArchived = false) {
  return useQuery({
    queryKey: queryKeys.categories.tree(type, includeArchived),
    queryFn: () => categoriesApi.tree(type, includeArchived),
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.create(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      categoriesApi.update(id, input),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archive = false }: { id: string; archive?: boolean }) =>
      categoriesApi.remove(id, archive),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}

export function useReorderCategories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: CategoryReorderItem[]) => categoriesApi.reorder(items),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.root }),
  })
}

export function useMergeCategories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      categoriesApi.merge(sourceId, targetId),
    onSuccess: () => invalidateFinancialData(queryClient),
  })
}
