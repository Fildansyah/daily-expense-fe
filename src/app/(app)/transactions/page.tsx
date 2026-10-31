"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Download,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Transaction, TransactionFilter, TransactionType } from "@/lib/api/types/transaction"
import { flattenCategories } from "@/lib/categories"
import { exportTransactionsCSV } from "@/lib/export"
import { formatIDR, monthRange } from "@/lib/format"
import { usePeriodRange } from "@/hooks/use-period"
import { useBillSummary } from "@/hooks/use-bills"
import {
  useBulkTransactions,
  useDeleteTransaction,
  useTransaction,
  useTransactions,
  useTransactionSummary,
} from "@/hooks/use-transactions"
import { useWallets } from "@/hooks/use-wallets"
import { useCategoryTree } from "@/hooks/use-categories"
import { PageHeader } from "@/components/layout/page-header"
import { DateRangeFilter } from "@/components/transactions/date-range-filter"
import { TransactionFormSheet } from "@/components/transactions/transaction-form-sheet"
import { TransactionList } from "@/components/transactions/transaction-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

const TYPE_OPTIONS: { value: "" | TransactionType; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "EXPENSE", label: "Pengeluaran" },
  { value: "INCOME", label: "Pemasukan" },
  { value: "TRANSFER", label: "Transfer" },
]

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsView />
    </Suspense>
  )
}

function TransactionsView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { from, to } = usePeriodRange()

  const defaultRange = useMemo(() => {
    const now = new Date()
    return monthRange(now.getFullYear(), now.getMonth())
  }, [])

  const activeFrom = from ?? defaultRange.from
  const activeTo = to ?? defaultRange.to

  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const rawType = searchParams.get("type")
  const type: "" | TransactionType =
    rawType === "INCOME" || rawType === "EXPENSE" || rawType === "TRANSFER"
      ? rawType
      : ""
  const walletId = searchParams.get("walletId") ?? ""
  const categoryId = searchParams.get("categoryId") ?? ""
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<
    { kind: "one"; transaction: Transaction } | { kind: "bulk" } | null
  >(null)

  const debouncedQuery = useDebounced(query)

  const editId = searchParams.get("edit") ?? undefined
  const formParam = searchParams.get("form")
  const createOpen = formParam === "transaction" && !editId

  const walletsQuery = useWallets()
  const expenseTree = useCategoryTree("EXPENSE")
  const incomeTree = useCategoryTree("INCOME")

  const categories = useMemo(
    () => [
      ...flattenCategories(expenseTree.data ?? []),
      ...flattenCategories(incomeTree.data ?? []),
    ],
    [expenseTree.data, incomeTree.data],
  )
  const wallets = walletsQuery.data ?? []
  const walletItems = [
    { label: "Semua akun", value: "" },
    ...wallets.map((wallet) => ({ label: wallet.name, value: wallet.id })),
  ]
  const categoryItems = [
    { label: "Semua kategori", value: "" },
    ...categories.map((category) => ({
      label: category.depth > 0 ? `— ${category.name}` : category.name,
      value: category.id,
    })),
  ]

  const filter = useMemo<TransactionFilter>(
    () => ({
      page,
      limit: 20,
      sort: "-date",
      from: activeFrom,
      to: activeTo,
      q: debouncedQuery || undefined,
      type: type || undefined,
      walletId: walletId || undefined,
      categoryId: categoryId || undefined,
    }),
    [page, activeFrom, activeTo, debouncedQuery, type, walletId, categoryId],
  )

  const transactionsQuery = useTransactions(filter)
  const summaryQuery = useTransactionSummary(activeFrom, activeTo)
  const billSummaryQuery = useBillSummary({ from: activeFrom, to: activeTo })
  const editQuery = useTransaction(editId)

  const bulkMutation = useBulkTransactions()
  const deleteMutation = useDeleteTransaction()

  const items = transactionsQuery.data?.items ?? []
  const meta = transactionsQuery.data?.meta
  const summary = summaryQuery.data
  const billSummary = billSummaryQuery.data
  const activeBills =
    billSummary?.byStatus
      .filter((status) => status.status !== "lunas")
      .reduce((total, status) => total + status.count, 0) ?? 0

  const firstRow = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0
  const lastRow = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  function setParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    mutator(params)
    const next = params.toString()
    router.push(next ? `${pathname}?${next}` : pathname)
  }

  function openCreate() {
    setParams((params) => {
      params.delete("edit")
      params.set("form", "transaction")
    })
  }

  function openEdit(transaction: Transaction) {
    setParams((params) => {
      params.delete("form")
      params.set("edit", transaction.id)
    })
  }

  function closeForm() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("form")
    params.delete("edit")
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname)
  }

  function updateFilters(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString())
    mutator(params)
    const next = params.toString()
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  function changeType(next: "" | TransactionType) {
    updateFilters((params) => {
      params.delete("page")
      if (next) params.set("type", next)
      else params.delete("type")
    })
    setSelected(new Set())
  }

  function changeWallet(next: string) {
    updateFilters((params) => {
      params.delete("page")
      if (next) params.set("walletId", next)
      else params.delete("walletId")
    })
    setSelected(new Set())
  }

  function changeCategory(next: string) {
    updateFilters((params) => {
      params.delete("page")
      if (next) params.set("categoryId", next)
      else params.delete("categoryId")
    })
    setSelected(new Set())
  }

  function changeRange(next: { from?: string; to?: string }) {
    updateFilters((params) => {
      params.delete("page")
      if (next.from) params.set("from", next.from)
      else params.delete("from")
      if (next.to) params.set("to", next.to)
      else params.delete("to")
    })
    setSelected(new Set())
  }

  function changeQuery(value: string) {
    setQuery(value)
    updateFilters((params) => {
      params.delete("page")
      if (value.trim()) params.set("q", value.trim())
      else params.delete("q")
    })
    setSelected(new Set())
  }

  function resetFilters() {
    setQuery("")
    setSelected(new Set())
    updateFilters((params) => {
      for (const key of [
        "q",
        "type",
        "walletId",
        "categoryId",
        "page",
        "from",
        "to",
      ]) {
        params.delete(key)
      }
    })
  }

  function changePage(next: number) {
    updateFilters((params) => {
      if (next <= 1) params.delete("page")
      else params.set("page", String(next))
    })
    setSelected(new Set())
  }

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll(ids: string[], select: boolean) {
    setSelected((previous) => {
      const next = new Set(previous)
      for (const id of ids) {
        if (select) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return

    const onError = (error: Error) => toast.error(error.message)
    const onDone = () => {
      toast.success("Transaksi dihapus")
      setDeleteTarget(null)
      setSelected(new Set())
    }

    if (deleteTarget.kind === "one") {
      deleteMutation.mutate(deleteTarget.transaction.id, {
        onSuccess: onDone,
        onError,
      })
      return
    }

    bulkMutation.mutate(
      { ids: [...selected], action: "delete" },
      { onSuccess: onDone, onError },
    )
  }

  const deleting = deleteMutation.isPending || bulkMutation.isPending

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="hidden md:block">
        <PageHeader
          title="Transaksi"
          description={
            meta
              ? `${meta.total} transaksi tercatat tahun ini`
              : "Semua pemasukan, pengeluaran, dan transfer."
          }
          actions={
            <>
              <Button
                variant="outline"
                onClick={() =>
                  exportTransactionsCSV(
                    items,
                    `${activeFrom}_${activeTo}`,
                  )
                }
                disabled={items.length === 0}
              >
                <Download className="size-4" />
                Ekspor CSV
              </Button>
              <Button onClick={openCreate}>
                <Plus className="size-4" />
                Tambah transaksi
              </Button>
            </>
          }
        />
      </div>

      <div className="space-y-3 md:hidden">
        <div className="flex items-center gap-2">
          <DateRangeFilter
            from={activeFrom}
            to={activeTo}
            onChange={(range) => changeRange(range)}
            className="h-8 flex-1 rounded-full px-3 text-[11px]"
          />
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5">
            <span className="text-[11px] text-muted-foreground">Net</span>
            <span
              className={cn(
                "num text-[11px] font-semibold",
                (summary?.net ?? 0) >= 0 ? "text-success" : "text-destructive",
              )}
            >
              {(summary?.net ?? 0) < 0 ? "−" : "+"}
              {formatIDR(Math.abs(summary?.net ?? 0))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">Pemasukan</p>
            <p className="num mt-0.5 truncate text-sm font-semibold text-success">
              +{formatIDR(summary?.income ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
            <p className="num mt-0.5 truncate text-sm font-semibold text-destructive">
              −{formatIDR(summary?.expense ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <StatCard
          label="Pengeluaran bulan ini"
          value={summary?.expense ?? 0}
          icon={<ArrowUpRight className="size-4" />}
          tone="rose"
          caption={`${summary?.count ?? 0} transaksi pada periode`}
        />
        <StatCard
          label="Pemasukan bulan ini"
          value={summary?.income ?? 0}
          icon={<ArrowDownLeft className="size-4" />}
          tone="emerald"
          caption={`Net ${formatIDR(summary?.net ?? 0)}`}
        />
        <StatCard
          label="Komitmen PayLater & CC"
          value={billSummary?.remaining ?? 0}
          icon={<CalendarClock className="size-4" />}
          tone="amber"
          caption={`${activeBills} tagihan aktif`}
        />
      </div>

      <Card className="bg-transparent py-0 ring-0 md:bg-card md:py-4 md:ring-1">
        <CardContent className="space-y-3 p-0 md:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => changeQuery(event.target.value)}
                  placeholder="Cari catatan, kategori, atau akun…"
                  className="h-9 pl-8"
                  aria-label="Cari transaksi"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                aria-label="Filter transaksi"
                aria-expanded={mobileFiltersOpen}
                onClick={() => setMobileFiltersOpen((value) => !value)}
                className={cn(
                  "shrink-0 md:hidden",
                  mobileFiltersOpen && "border-primary text-primary",
                )}
              >
                <SlidersHorizontal className="size-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto md:flex-wrap md:overflow-visible md:rounded-xl md:border md:border-border md:bg-card md:p-1">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value || "all"}
                  type="button"
                  onClick={() => changeType(option.value)}
                  className={cn(
                    "min-h-7 shrink-0 rounded-full border px-3 text-[11px] transition-colors md:rounded-lg md:border-0 md:px-2.5 md:text-label",
                    type === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground md:bg-transparent",
                  )}
                >
                  {option.label}
                  {option.value === "" && meta ? (
                    <span className="ml-1 text-[10px] opacity-75">
                      ({meta.total})
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4",
              !mobileFiltersOpen && "hidden md:grid",
            )}
          >
            <Select
              items={walletItems}
              value={walletId}
              onValueChange={(value) => changeWallet(value ?? "")}
            >
              <SelectTrigger className="h-9 w-full rounded-xl bg-card">
                <SelectValue placeholder="Semua akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua akun</SelectItem>
                {(walletsQuery.data ?? []).map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              items={categoryItems}
              value={categoryId}
              onValueChange={(value) => changeCategory(value ?? "")}
            >
              <SelectTrigger className="h-9 w-full rounded-xl bg-card">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.depth > 0 ? `— ${category.name}` : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="hidden md:block">
              <DateRangeFilter
                from={activeFrom}
                to={activeTo}
                onChange={(range) => changeRange(range)}
              />
            </div>

            <Button
              variant="ghost"
              className="h-9 justify-start"
              onClick={resetFilters}
            >
              <X className="size-4" />
              Reset filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {selected.size > 0 ? (
        <div className="sticky bottom-20 z-20 flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card p-3 shadow-lg md:bottom-4">
          <p className="text-sm font-medium">
            {selected.size} transaksi dipilih
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteTarget({ kind: "bulk" })}
            >
              <Trash2 className="size-3.5" />
              Hapus
            </Button>
          </div>
        </div>
      ) : null}

      {transactionsQuery.isLoading ? (
        <TransactionsSkeleton />
      ) : transactionsQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-destructive">
              Gagal memuat transaksi: {transactionsQuery.error.message}
            </p>
            <Button variant="outline" onClick={() => transactionsQuery.refetch()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium">Belum ada transaksi</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {query || type || walletId || categoryId
                ? "Coba ubah filter atau periode."
                : "Catat pengeluaran atau pemasukan pertamamu."}
            </p>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah transaksi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <TransactionList
          transactions={items}
          categories={categories}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onEdit={openEdit}
          onDelete={(transaction) =>
            setDeleteTarget({ kind: "one", transaction })
          }
        />
      )}

      {meta && meta.total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <p>
            Menampilkan {firstRow}–{lastRow} dari {meta.total} transaksi
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => changePage(Math.max(1, page - 1))}
            >
              Sebelumnya
            </Button>
            <span className="num px-2 text-caption">
              {meta.page} / {meta.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => changePage(page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <TransactionFormSheet
          key="new"
          open
          onOpenChange={(open) => {
            if (!open) closeForm()
          }}
        />
      ) : null}

      {editId ? (
        editQuery.data ? (
          <TransactionFormSheet
            key={editId}
            open
            transaction={editQuery.data}
            onOpenChange={(open) => {
              if (!open) closeForm()
            }}
          />
        ) : (
          <Sheet open onOpenChange={(open) => (open ? null : closeForm())}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Ubah Transaksi</SheetTitle>
              </SheetHeader>
              <SheetBody>
                {editQuery.isError ? (
                  <p className="text-sm text-destructive">
                    {editQuery.error.message}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                )}
              </SheetBody>
            </SheetContent>
          </Sheet>
        )
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus transaksi?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.kind === "bulk"
                ? `${selected.size} transaksi akan dihapus dan saldo akun disesuaikan kembali.`
                : "Transaksi akan dihapus dan saldo akun disesuaikan kembali. Tindakan ini tidak bisa dibatalkan."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 className="size-4" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
  caption,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: "rose" | "emerald" | "amber"
  caption: string
}) {
  const toneClass = {
    rose: "bg-destructive/10 text-destructive",
    emerald: "bg-success/10 text-success",
    amber: "bg-warning/10 text-warning",
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-caption text-muted-foreground">{label}</p>
          <p className="num mt-1 text-xl font-semibold">{formatIDR(value)}</p>
          <p className="text-caption text-muted-foreground">{caption}</p>
        </div>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", toneClass)}>
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}
