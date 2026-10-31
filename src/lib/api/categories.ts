import { request, toQuery } from "./client"
import type {
  Category,
  CategoryInput,
  CategoryReorderItem,
} from "./types/category"

export const categoriesApi = {
  tree(type?: string, includeArchived = false) {
    return request<Category[]>(
      `/categories/tree${toQuery({
        type: type ?? "",
        includeArchived: includeArchived ? "true" : "",
      })}`,
    )
  },

  create(input: CategoryInput) {
    return request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  update(id: string, input: CategoryInput) {
    return request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  remove(id: string, archive = false) {
    return request<{ message: string }>(
      `/categories/${id}${toQuery({ archive: archive ? "true" : "" })}`,
      { method: "DELETE" },
    )
  },

  reorder(items: CategoryReorderItem[]) {
    return request<{ message: string }>("/categories/reorder", {
      method: "PUT",
      body: JSON.stringify({ items }),
    })
  },

  merge(sourceId: string, targetId: string) {
    return request<{ message: string }>("/categories/merge", {
      method: "POST",
      body: JSON.stringify({ sourceId, targetId }),
    })
  },
}
