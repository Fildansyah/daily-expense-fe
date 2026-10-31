"use client"

import { useMemo, useState } from "react"
import { Plus, Search, X } from "lucide-react"

import type { Category } from "@/lib/api/types/category"
import type { ReportCategory } from "@/lib/api/types/report"
import {
  countCategoryTree,
  flattenCategories,
} from "@/lib/categories"
import { monthRange } from "@/lib/format"
import { useCategoryTree } from "@/hooks/use-categories"
import { useCategoryReport } from "@/hooks/use-reports"
import { PageHeader } from "@/components/layout/page-header"
import { CategoryFormDialog } from "@/components/categories/category-form-dialog"
import { CategoryDetailPanel } from "@/components/categories/category-detail-panel"
import { CategoryTree } from "@/components/categories/category-tree"
import { ReorderDialog } from "@/components/categories/reorder-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

type Flow = "EXPENSE" | "INCOME" | "TRANSFER"

const TABS: { value: Flow; label: string }[] = [
  { value: "EXPENSE", label: "Pengeluaran" },
  { value: "INCOME", label: "Pemasukan" },
  { value: "TRANSFER", label: "Transfer & Penyelesaian" },
]

function findReportNode(
  nodes: ReportCategory[],
  id: string,
): ReportCategory | undefined {
  for (const node of nodes) {
    if (node.categoryId === id) return node
    const found = findReportNode(node.children ?? [], id)
    if (found) return found
  }
  return undefined
}

export default function CategoriesPage() {
  const [flow, setFlow] = useState<Flow>("EXPENSE")
  const [search, setSearch] = useState("")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [reorderOpen, setReorderOpen] = useState(false)

  const expenseQuery = useCategoryTree("EXPENSE")
  const incomeQuery = useCategoryTree("INCOME")
  const transferQuery = useCategoryTree("TRANSFER")

  const trees: Record<Flow, Category[]> = useMemo(
    () => ({
      EXPENSE: expenseQuery.data ?? [],
      INCOME: incomeQuery.data ?? [],
      TRANSFER: transferQuery.data ?? [],
    }),
    [expenseQuery.data, incomeQuery.data, transferQuery.data],
  )

  const stats = useMemo(() => {
    const entries = (Object.keys(trees) as Flow[]).map((key) => [
      key,
      countCategoryTree(trees[key]),
    ]) as [Flow, { total: number; children: number }][]

    const result: Record<Flow, { total: number; children: number }> = {
      EXPENSE: { total: 0, children: 0 },
      INCOME: { total: 0, children: 0 },
      TRANSFER: { total: 0, children: 0 },
    }
    for (const [key, value] of entries) result[key] = value
    return result
  }, [trees])

  const total = stats.EXPENSE.total + stats.INCOME.total + stats.TRANSFER.total
  const totalChildren =
    stats.EXPENSE.children + stats.INCOME.children + stats.TRANSFER.children

  const activeTree = trees[flow]
  const flat = useMemo(() => flattenCategories(activeTree), [activeTree])
  const selected =
    flat.find((category) => category.id === selectedId) ?? flat[0] ?? null

  const month = useMemo(() => {
    const now = new Date()
    return monthRange(now.getFullYear(), now.getMonth())
  }, [])

  const reportQuery = useCategoryReport(
    month.from,
    month.to,
    flow,
    flow !== "TRANSFER",
  )

  const reportNode = selected
    ? findReportNode(reportQuery.data ?? [], selected.id)
    : undefined

  const loading =
    expenseQuery.isLoading || incomeQuery.isLoading || transferQuery.isLoading
  const activeQuery =
    flow === "EXPENSE"
      ? expenseQuery
      : flow === "INCOME"
        ? incomeQuery
        : transferQuery

  function toggleCollapse(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function select(category: Category) {
    setSelectedId(category.id)
  }

  return (
    <div className="space-y-4">
      <div className="text-[10px] font-medium tracking-wide text-muted-foreground">
        KEUANGAN INTERNAL / KATEGORI
      </div>

      <PageHeader
        title="Kategori"
        description={`${total} kategori · ${totalChildren} sub-kategori tersinkron`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setReorderOpen(true)}
              disabled={activeTree.length === 0}
            >
              Atur Urutan
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Kategori Baru
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setFlow(tab.value)
              setSelectedId("")
              setSearch("")
            }}
            aria-pressed={flow === tab.value}
            className={
              flow === tab.value
                ? "min-h-8 rounded-lg bg-primary px-3 text-label text-primary-foreground"
                : "min-h-8 rounded-lg px-3 text-label text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            }
          >
            {tab.label}{" "}
            <span className="ml-1 text-[10px] opacity-70">
              {stats[tab.value].total}
            </span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-3 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari kategori atau sub-kategori…"
                className="h-9 rounded-xl pl-8 pr-8"
                aria-label="Cari kategori"
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => setSearch("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <p className="text-caption text-muted-foreground">
              Gunakan pencarian untuk memfilter sub-kategori; induk tetap tampil
              sebagai konteks.
            </p>

            <div className="max-h-[680px] overflow-y-auto pr-1">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-full rounded-lg" />
                  ))}
                </div>
              ) : activeQuery.isError ? (
                <div className="space-y-2 py-6 text-center">
                  <p className="text-sm text-destructive">
                    Gagal memuat kategori: {activeQuery.error.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => activeQuery.refetch()}
                  >
                    Coba lagi
                  </Button>
                </div>
              ) : activeTree.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm font-medium">Belum ada kategori</p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    Tambahkan kategori pertama untuk tipe ini.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setFormOpen(true)}
                  >
                    <Plus className="size-4" />
                    Kategori Baru
                  </Button>
                </div>
              ) : (
                <CategoryTree
                  tree={activeTree}
                  search={search}
                  selectedId={selected?.id}
                  collapsed={collapsed}
                  onToggle={toggleCollapse}
                  onSelect={select}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            {selected ? (
              <CategoryDetailPanel
                key={selected.id}
                category={selected}
                roots={activeTree}
                amount={reportNode?.amount ?? 0}
                count={reportNode?.count ?? selected.transactionCount}
                onDeleted={() => setSelectedId("")}
              />
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium">Pilih kategori</p>
                <p className="max-w-sm text-caption text-muted-foreground">
                  Pilih kategori di panel kiri untuk melihat detail dan
                  mengubahnya, atau buat kategori baru.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {formOpen ? (
        <CategoryFormDialog
          key={flow}
          open
          onOpenChange={setFormOpen}
          defaultType={flow === "INCOME" ? "INCOME" : "EXPENSE"}
        />
      ) : null}

      {reorderOpen ? (
        <ReorderDialog
          open
          onOpenChange={setReorderOpen}
          tree={activeTree}
        />
      ) : null}
    </div>
  )
}
