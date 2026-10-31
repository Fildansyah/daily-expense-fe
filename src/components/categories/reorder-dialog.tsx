"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type {
  Category,
  CategoryReorderItem,
} from "@/lib/api/types/category"
import { useReorderCategories } from "@/hooks/use-categories"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ReorderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tree: Category[]
}

export function ReorderDialog({ open, onOpenChange, tree }: ReorderDialogProps) {
  const reorder = useReorderCategories()
  const [orders, setOrders] = useState<Record<string, number>>(() => {
    const next: Record<string, number> = {}
    const walk = (items: Category[]) => {
      items.forEach((item, index) => {
        next[item.id] = item.sortOrder ?? index
        walk(item.children ?? [])
      })
    }
    walk(tree)
    return next
  })

  function sorted(items: Category[]): Category[] {
    return [...items].sort((a, b) => (orders[a.id] ?? 0) - (orders[b.id] ?? 0))
  }

  function move(item: Category, siblings: Category[], direction: -1 | 1) {
    const list = sorted(siblings)
    const index = list.findIndex((entry) => entry.id === item.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= list.length) return

    const currentOrder = orders[item.id] ?? index
    const targetOrder = orders[list[target].id] ?? target

    setOrders({
      ...orders,
      [item.id]: targetOrder,
      [list[target].id]: currentOrder,
    })
  }

  function save() {
    const items: CategoryReorderItem[] = []
    const walk = (categories: Category[], parentId: string | null) => {
      for (const category of categories) {
        items.push({
          id: category.id,
          parentId,
          sortOrder: orders[category.id] ?? category.sortOrder,
        })
        walk(sorted(category.children ?? []), category.id)
      }
    }
    walk(sorted(tree), null)

    reorder.mutate(items, {
      onSuccess: () => {
        toast.success("Urutan kategori disimpan")
        onOpenChange(false)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  function renderRow(category: Category, siblings: Category[], depth: number) {
    const list = sorted(siblings)
    const index = list.findIndex((entry) => entry.id === category.id)
    const isFirst = index <= 0
    const isLast = index >= list.length - 1

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
          style={{ paddingLeft: 8 + depth * 20 }}
        >
          <CategoryIcon icon={category.icon} color={category.bgColor} size="sm" />
          <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Naikkan ${category.name}`}
            disabled={isFirst}
            onClick={() => move(category, siblings, -1)}
          >
            <ArrowUp className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Turunkan ${category.name}`}
            disabled={isLast}
            onClick={() => move(category, siblings, 1)}
          >
            <ArrowDown className="size-3.5" />
          </Button>
        </div>
        {(category.children ?? []).map((child) =>
          renderRow(child, category.children ?? [], depth + 1),
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atur Urutan Kategori</DialogTitle>
          <DialogDescription>
            Urutan ini menentukan tampilan kategori pada form transaksi dan
            laporan. Gunakan tombol naik/turun per level.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto rounded-xl border border-border p-1">
          {sorted(tree).map((category) =>
            renderRow(category, tree, 0),
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={save} disabled={reorder.isPending}>
            {reorder.isPending ? <Loader2 className="animate-spin" /> : null}
            Simpan Urutan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
