import { describe, expect, it } from "vitest"

import type { Category } from "@/lib/api/types/category"
import {
  categoryTotalCount,
  countCategoryTree,
  findCategory,
  flattenCategories,
} from "./categories"

function category(
  id: string,
  name: string,
  transactionCount = 0,
  children: Category[] = [],
): Category {
  return {
    id,
    name,
    transactionCount,
    children,
    createdAt: "",
    updatedAt: "",
    transactionTypeId: "tt",
    icon: "tag",
    bgColor: "#0F766E",
    parentId: null,
    sortOrder: 0,
    isArchived: false,
  }
}

describe("category helpers", () => {
  const tree = [
    category("makan", "Makan & Minum", 10, [
      category("kopi", "Kopi", 5),
      category("luar", "Makan di Luar", 3),
    ]),
    category("transport", "Transportasi", 7, [category("bensin", "Bensin", 2)]),
  ]

  it("menghitung total dan jumlah sub-kategori", () => {
    expect(countCategoryTree(tree)).toEqual({ total: 5, children: 3 })
  })

  it("menghitung transaksi induk termasuk anak", () => {
    expect(categoryTotalCount(tree[0])).toBe(18)
    expect(categoryTotalCount(tree[1])).toBe(9)
  })

  it("flatten memberi kedalaman dan nama induk", () => {
    const flat = flattenCategories(tree)
    expect(flat).toHaveLength(5)
    expect(flat.find((item) => item.id === "kopi")).toMatchObject({
      depth: 1,
      parentName: "Makan & Minum",
    })
  })

  it("findCategory mencari sampai level anak", () => {
    expect(findCategory(tree, "bensin")?.name).toBe("Bensin")
    expect(findCategory(tree, "tidak-ada")).toBeUndefined()
  })
})
