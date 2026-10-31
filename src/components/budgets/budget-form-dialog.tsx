"use client"

import { useMemo, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Budget } from "@/lib/api/types/budget"
import type { ReportCategory } from "@/lib/api/types/report"
import { flattenCategories } from "@/lib/categories"
import {
  BUDGET_STATUS_CLASS,
  BUDGET_STATUS_LABEL,
  daysElapsed,
  daysInMonth,
  daysRemaining,
  monthLabelFromKey,
  overviewStatus,
  shiftMonthKey,
} from "@/lib/budget"
import { formatIDR, formatNumberInput } from "@/lib/format"
import {
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
  useBudgets,
} from "@/hooks/use-budgets"
import { useCategoryTree } from "@/hooks/use-categories"
import { useCategoryReport } from "@/hooks/use-reports"
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
import { Input } from "@/components/ui/input"

interface BudgetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  budget?: Budget | null
  initialCategoryId?: string
}

function flattenReport(
  nodes: ReportCategory[],
  map: Map<string, ReportCategory>,
) {
  for (const node of nodes) {
    map.set(node.categoryId, node)
    flattenReport(node.children ?? [], map)
  }
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  month,
  budget,
  initialCategoryId,
}: BudgetFormDialogProps) {
  const isEdit = Boolean(budget)
  const createBudget = useCreateBudget()
  const updateBudget = useUpdateBudget()
  const deleteBudget = useDeleteBudget()

  const categoriesQuery = useCategoryTree("EXPENSE")
  const budgetsQuery = useBudgets(month)
  const previousMonth = shiftMonthKey(month, -1)
  const previousBudgetsQuery = useBudgets(previousMonth)

  const [categoryId, setCategoryId] = useState(
    budget?.categoryId ?? initialCategoryId ?? "",
  )
  const [amount, setAmount] = useState(
    budget ? String(Math.round(budget.amount)) : "",
  )
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  const reportQuery = useCategoryReport(
    `${month}-01`,
    `${month}-${String(daysInMonth(month)).padStart(2, "0")}`,
    "EXPENSE",
    Boolean(categoryId),
  )

  const flatCategories = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  )

  const reportMap = useMemo(() => {
    const map = new Map<string, ReportCategory>()
    flattenReport(reportQuery.data ?? [], map)
    return map
  }, [reportQuery.data])

  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data])
  const existingByCategory = useMemo(
    () => new Map(budgets.map((item) => [item.categoryId, item])),
    [budgets],
  )

  const selected = flatCategories.find((item) => item.id === categoryId)
  const selectedReport = categoryId ? reportMap.get(categoryId) : undefined
  const spent = selectedReport?.amount ?? 0
  const amountValue = Number(amount || 0)
  const percentage =
    amountValue > 0 ? Math.round((spent / amountValue) * 1000) / 10 : 0
  const elapsed = daysElapsed(month)
  const remainingDays = daysRemaining(month)
  const totalDays = daysInMonth(month)
  const dailyBurn = elapsed > 0 ? spent / elapsed : 0
  const remainingPerDay =
    remainingDays > 0 ? Math.max(0, amountValue - spent) / remainingDays : 0
  const status = overviewStatus(percentage)
  const previousAmount =
    previousBudgetsQuery.data?.find((item) => item.categoryId === categoryId)
      ?.amount ?? 0

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return flatCategories
    return flatCategories.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        (item.parentName ?? "").toLowerCase().includes(keyword),
    )
  }, [flatCategories, search])

  const pending =
    createBudget.isPending || updateBudget.isPending || deleteBudget.isPending

  function pickCategory(id: string) {
    const existing = existingByCategory.get(id)
    if (existing && existing.id !== budget?.id) return
    setCategoryId(id)
    setSearch("")
    setError(null)
  }

  function submit() {
    if (!categoryId) return setError("Pilih kategori pengeluaran.")
    if (!amountValue || amountValue <= 0) {
      return setError("Batas anggaran harus lebih dari 0.")
    }

    setError(null)
    const onSuccess = () => {
      toast.success(isEdit ? "Anggaran diperbarui" : "Anggaran ditambahkan")
      onOpenChange(false)
    }
    const onError = (mutationError: Error) => setError(mutationError.message)

    if (budget) {
      updateBudget.mutate(
        { id: budget.id, amount: amountValue },
        { onSuccess, onError },
      )
    } else {
      createBudget.mutate(
        { categoryId, periodMonth: month, amount: amountValue },
        { onSuccess, onError },
      )
    }
  }

  function remove() {
    if (!budget) return
    deleteBudget.mutate(budget.id, {
      onSuccess: () => {
        toast.success("Anggaran dihapus")
        onOpenChange(false)
      },
      onError: (mutationError) => setError(mutationError.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atur Anggaran · {monthLabelFromKey(month)}</DialogTitle>
          <DialogDescription>
            Tetapkan batas pengeluaran bulanan per kategori.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-label">
                Kategori Pengeluaran <span className="text-destructive">*</span>
              </p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {flatCategories.length} kategori
              </span>
            </div>

            {selected ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-accent/50 p-2.5">
                <CategoryIcon
                  icon={selected.icon}
                  color={selected.bgColor}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selected.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {selected.parentName ?? "Kategori utama"} · terpakai{" "}
                    {formatIDR(spent)}
                  </p>
                </div>
                {!isEdit ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setCategoryId("")}
                  >
                    Ganti
                  </Button>
                ) : null}
              </div>
            ) : null}

            {!selected ? (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari kategori pengeluaran…"
                    className="h-9 rounded-xl pl-8"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-xl border border-border">
                  {filtered.map((category) => {
                    const existing = existingByCategory.get(category.id)
                    const disabled = Boolean(existing && existing.id !== budget?.id)
                    const report = reportMap.get(category.id)
                    return (
                      <button
                        key={category.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => pickCategory(category.id)}
                        className={cn(
                          "flex w-full items-center gap-2 border-b border-border px-2.5 py-2 text-left text-sm last:border-b-0",
                          disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <CategoryIcon
                          icon={category.icon}
                          color={category.bgColor}
                          size="sm"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">
                            {category.depth > 0 ? "— " : ""}
                            {category.name}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {report && report.amount > 0
                              ? `Terpakai ${formatIDR(report.amount)}`
                              : category.parentName ?? "Kategori utama"}
                          </span>
                        </span>
                        {disabled ? (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                            Sudah diatur
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                  {filtered.length === 0 ? (
                    <p className="px-3 py-4 text-center text-caption text-muted-foreground">
                      Kategori tidak ditemukan.
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-label">
              <span>
                Batas Anggaran Bulanan <span className="text-destructive">*</span>
              </span>
              {previousAmount > 0 ? (
                <span className="text-caption font-normal text-muted-foreground">
                  Bulan lalu {formatIDR(previousAmount)}
                </span>
              ) : null}
            </span>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                value={formatNumberInput(amount)}
                onChange={(event) =>
                  setAmount(event.target.value.replace(/\D/g, "").slice(0, 15))
                }
                inputMode="numeric"
                placeholder="0"
                className="h-11 rounded-xl pl-9 text-base font-semibold"
              />
            </div>
            {previousAmount > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-caption text-muted-foreground">
                  Bulan lalu {formatIDR(previousAmount)}
                </span>
                {[5, 10].map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() =>
                      setAmount(String(Math.round(previousAmount * (1 + percent / 100))))
                    }
                    className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    +{percent}%
                  </button>
                ))}
                <span className="text-caption text-muted-foreground">
                  +10% realistis: {formatIDR(Math.round(previousAmount * 1.1))}
                </span>
              </div>
            ) : null}
          </label>

          {amountValue > 0 ? (
            <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-label">Simulasi Pemakaian Real-time</p>
                <span className="text-[10px] text-muted-foreground">
                  {elapsed}/{totalDays} hari
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-caption">
                <div>
                  <p className="text-muted-foreground">Aktual terpakai</p>
                  <p className="num font-semibold">{formatIDR(spent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Rata-rata harian</p>
                  <p className="num font-semibold">+{formatIDR(dailyBurn)}/hari</p>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    status === "lebih"
                      ? "bg-destructive"
                      : status === "waspada"
                        ? "bg-warning"
                        : "bg-primary",
                  )}
                  style={{ width: `${Math.min(100, percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{percentage}% terpakai</span>
                <span className={BUDGET_STATUS_CLASS[status]}>
                  {BUDGET_STATUS_LABEL[status]}
                </span>
                <span>{remainingDays} hari lagi</span>
              </div>
              <ul className="space-y-1 text-caption text-muted-foreground">
                <li>
                  Sisa: {formatIDR(Math.max(0, amountValue - spent))}
                </li>
                <li>
                  Batas harian tersisa: {formatIDR(remainingPerDay)}/hari
                </li>
                <li>
                  Proyeksi akhir bulan:{" "}
                  {formatIDR(spent + dailyBurn * remainingDays)}
                </li>
              </ul>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className="items-center">
          {budget ? (
            <Button
              variant="link"
              className="mr-auto px-0 text-destructive"
              onClick={remove}
              disabled={pending}
            >
              Hapus anggaran
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Simpan Anggaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
