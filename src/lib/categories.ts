import type { Category } from "@/lib/api/types/category"

export interface FlatCategory extends Category {
  depth: number
  parentName?: string
}

export const CATEGORY_COLORS = [
  "#0F766E",
  "#10B981",
  "#84CC16",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#6366F1",
  "#0EA5E9",
  "#14B8A6",
  "#64748B",
]

export function flattenCategories(
  tree: Category[],
  depth = 0,
  parentName?: string,
): FlatCategory[] {
  const result: FlatCategory[] = []

  for (const category of tree) {
    result.push({ ...category, depth, parentName })
    if (category.children?.length) {
      result.push(
        ...flattenCategories(category.children, depth + 1, category.name),
      )
    }
  }

  return result
}

export function findCategory(
  tree: Category[],
  id?: string | null,
): Category | undefined {
  if (!id) return undefined

  for (const category of tree) {
    if (category.id === id) return category
    const found = findCategory(category.children ?? [], id)
    if (found) return found
  }

  return undefined
}

export function categoryParentName(
  flat: FlatCategory[],
  categoryId?: string | null,
): string | undefined {
  if (!categoryId) return undefined
  return flat.find((category) => category.id === categoryId)?.parentName
}

export function countCategoryTree(tree: Category[]): {
  total: number
  children: number
} {
  let total = 0
  let children = 0

  function walk(items: Category[], depth: number) {
    for (const item of items) {
      total += 1
      if (depth > 0) children += 1
      walk(item.children ?? [], depth + 1)
    }
  }

  walk(tree, 0)
  return { total, children }
}

export function categoryTotalCount(category: Category): number {
  return (
    category.transactionCount +
    (category.children ?? []).reduce(
      (sum, child) => sum + categoryTotalCount(child),
      0,
    )
  )
}
