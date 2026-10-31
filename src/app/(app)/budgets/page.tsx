"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Info,
  Lock,
  Plus,
} from "lucide-react"
import { cn } from "cn"

import type { Budget, BudgetStatus } from "@/lib/api/types/budget"
import {
  BUDGET_STATUS_CLASS,
  BUDGET_STATUS_LABEL,
  currentMonthKey,
  daysElapsed,
  daysInMonth,
  daysRemaining,
  formatCompact,
  monthBoundsFromKey,
  monthLabelFromKey,
  overviewStatus,
  shiftMonthKey,
} from "@/lib/budget"
import { exportBudgetsCSV } from "@/lib/export"
import { formatIDR } from "@/lib/format"
import { useBudgetSummary, useBudgets } from "@/hooks/use-budgets"
import { useCashflow } from "@/hooks/use-reports"
import { PageHeader } from "@/components/layout/page-header"
import { CategoryIcon } from "@/components/category-icon"
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog"
import { CopyBudgetDialog } from "@/components/budgets/copy-budget-dialog"
import {
  ConsumptionChart,
  RealizationChart,
} from "@/components/budgets/budget-charts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type StatusFilter = "all" | BudgetStatus

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "aman", label: "Aman" },
  { value: "waspada", label: "Mendekati" },
  { value: "lebih", label: "Over-budget" },
]

export default function BudgetsPage() {
  const [month, setMonth] = useState(currentMonthKey)
  const [filter, setFilter] = useState<StatusFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [initialCategoryId, setInitialCategoryId] = useState("")
  const [copyOpen, setCopyOpen] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)

  const budgetsQuery = useBudgets(month)
  const summaryQuery = useBudgetSummary(month)
  const bounds = monthBoundsFromKey(month)
  const cashflowQuery = useCashflow(bounds.from, bounds.to, "day")

  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data])
  const summary = summaryQuery.data
  const totalBudget = summary?.totalBudget ?? 0
  const totalSpent = summary?.totalSpent ?? 0
  const remaining = summary?.remaining ?? 0
  const percentage = summary?.percentage ?? 0
  const status = overviewStatus(percentage)
  const totalDays = daysInMonth(month)
  const elapsed = daysElapsed(month)
  const left = daysRemaining(month)
  const dailyRemaining = left > 0 ? Math.max(0, remaining) / left : 0
  const unbudgeted = summary?.unbudgeted ?? []

  const counts = useMemo(() => {
    const result: Record<BudgetStatus, number> = {
      aman: 0,
      waspada: 0,
      lebih: 0,
    }
    for (const budget of budgets) result[budget.status] += 1
    return result
  }, [budgets])

  const filtered = useMemo(() => {
    if (filter === "all") return budgets
    return budgets.filter((budget) => budget.status === filter)
  }, [budgets, filter])

  const risky = useMemo(
    () =>
      [...budgets]
        .filter((budget) => budget.status !== "aman")
        .sort((a, b) => b.percentage - a.percentage),
    [budgets],
  )

  const loading = budgetsQuery.isLoading || summaryQuery.isLoading
  const error = budgetsQuery.error ?? summaryQuery.error

  function openCreate(categoryId = "") {
    setEditing(null)
    setInitialCategoryId(categoryId)
    setFormOpen(true)
  }

  function openEdit(budget: Budget) {
    setEditing(budget)
    setInitialCategoryId("")
    setFormOpen(true)
  }

  function closeForm(open: boolean) {
    if (open) return
    setFormOpen(false)
    setEditing(null)
    setInitialCategoryId("")
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anggaran"
        description={`Total kapasitas ${formatIDR(totalBudget)}`}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Bulan sebelumnya"
                onClick={() => setMonth(shiftMonthKey(month, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-32 text-center text-sm font-medium">
                {monthLabelFromKey(month)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Bulan berikutnya"
                onClick={() => setMonth(shiftMonthKey(month, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => exportBudgetsCSV(budgets, month)}
              disabled={budgets.length === 0}
            >
              <Download className="size-4" />
              Ekspor Laporan
            </Button>
            <Button variant="outline" onClick={() => setCopyOpen(true)}>
              Salin Anggaran
            </Button>
            <Button onClick={() => openCreate()}>
              <Plus className="size-4" />
              Atur Anggaran
            </Button>
          </>
        }
      />

      {left > 0 && left <= 7 ? (
        <div className="flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-caption text-[#8a5a00]">
          <AlertTriangle className="size-3.5" />
          {left} hari tersisa di bulan ini
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-destructive">
              Gagal memuat anggaran: {error.message}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                budgetsQuery.refetch()
                summaryQuery.refetch()
              }}
            >
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-caption text-muted-foreground">
                      Total Anggaran Pengeluaran
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          BUDGET_STATUS_CLASS[status],
                        )}
                      >
                        {BUDGET_STATUS_LABEL[status]} ({percentage}%)
                      </span>
                      <span className="text-caption text-muted-foreground">
                        Periode berjalan: hari {elapsed} dari {totalDays}
                      </span>
                    </div>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    Sisa {formatIDR(remaining)}
                  </p>
                </div>

                <p className="num text-2xl font-semibold">
                  {formatIDR(totalSpent)}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    / {formatIDR(totalBudget)}
                  </span>
                </p>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
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

                <div className="grid grid-cols-2 gap-2 text-caption sm:grid-cols-4">
                  <Metric label="Terpakai" value={`${percentage}%`} />
                  <Metric label="Sisa anggaran" value={formatIDR(remaining)} />
                  <Metric label="Hari tersisa" value={`${left} hari`} />
                  <Metric
                    label="Sisa / hari"
                    value={`${formatIDR(dailyRemaining)}/hari`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-success" />
                    Normal {counts.aman}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-warning" />
                    Waspada {counts.waspada}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-destructive" />
                    Over-budget {counts.lebih}
                  </span>
                </div>
              </CardContent>
            </Card>

            <ConsumptionChart
              points={cashflowQuery.data ?? []}
              totalBudget={totalBudget}
              month={month}
            />
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-h2">Pos Anggaran Aktif</h2>
                  <p className="text-caption text-muted-foreground">
                    {filtered.length} kategori ditampilkan
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
                  {FILTERS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFilter(item.value)}
                      aria-pressed={filter === item.value}
                      className={cn(
                        "min-h-7 rounded-lg px-2.5 text-caption transition-colors",
                        filter === item.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.label}{" "}
                      {item.value === "all"
                        ? budgets.length
                        : counts[item.value]}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                    <p className="text-sm font-medium">Belum ada anggaran</p>
                    <p className="text-caption text-muted-foreground">
                      {filter === "all"
                        ? "Atur batas pengeluaran per kategori untuk mulai memantau."
                        : "Tidak ada kategori pada status ini."}
                    </p>
                    {filter === "all" ? (
                      <Button size="sm" onClick={() => openCreate()}>
                        <Plus className="size-4" />
                        Atur Anggaran
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {filtered.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
                      left={left}
                      onClick={() => openEdit(budget)}
                    />
                  ))}
                </div>
              )}

              <RealizationChart budgets={budgets} />
            </div>

            <div className="space-y-3">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-base">Kategori Tanpa Batas</CardTitle>
                    <p className="text-caption text-muted-foreground">
                      {unbudgeted.length} kategori belum dianggarkan
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unbudgeted.length === 0 ? (
                    <p className="py-4 text-center text-caption text-muted-foreground">
                      Semua kategori berbelanja sudah punya anggaran.
                    </p>
                  ) : (
                    unbudgeted.slice(0, 6).map((category) => (
                      <div
                        key={category.categoryId}
                        className="flex items-center gap-2 rounded-xl border border-border p-2"
                      >
                        <CategoryIcon icon={category.categoryIcon} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{category.categoryName}</p>
                          <p className="num text-[10px] text-muted-foreground">
                            Terpakai {formatIDR(category.spent)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => openCreate(category.categoryId)}
                        >
                          + Atur
                        </Button>
                      </div>
                    ))
                  )}
                  <Button
                    variant="ghost"
                    className="w-full"
                    render={<Link href="/categories?form=category" />}
                    nativeButton={false}
                  >
                    <Plus className="size-4" />
                    Tambah Kategori Baru
                  </Button>
                </CardContent>
              </Card>

              {risky[0] ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Info className="size-4 text-primary" />
                      Insight &amp; Saran Anggaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-caption text-muted-foreground">
                    <p>
                      Pos <span className="font-medium text-foreground">{risky[0].categoryName}</span>{" "}
                      sudah menyentuh{" "}
                      <span className="font-medium text-foreground">
                        {risky[0].percentage}%
                      </span>{" "}
                      dari batasnya. {risky[0].status === "lebih"
                        ? "Realisasi sudah melebihi plafon bulan ini."
                        : "Pertimbangkan menahan pengeluaran hingga akhir bulan."}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowRecommendations((value) => !value)}
                    >
                      {showRecommendations ? "Sembunyikan Rekomendasi" : "Tampilkan Rekomendasi"}
                    </Button>
                    {showRecommendations ? (
                      <ul className="space-y-1">
                        {risky.slice(0, 4).map((budget) => (
                          <li key={budget.id} className="rounded-lg bg-muted/50 px-2 py-1.5">
                            <span className="font-medium text-foreground">
                              {budget.categoryName}
                            </span>{" "}
                            — {budget.status === "lebih"
                              ? `kurangi ${formatIDR(Math.abs(budget.remaining))} atau naikkan batas.`
                              : `sisa ${formatIDR(budget.remaining)} untuk ${left} hari.`}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lock className="size-3.5 text-muted-foreground" />
                    Tutup Buku Bulan Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-caption text-muted-foreground">
                    Kunci anggaran {monthLabelFromKey(month)} setelah bulan
                    berakhir agar laporan tidak berubah.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="Fitur tutup buku menunggu endpoint backend"
                  >
                    Tutup Buku
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    Belum tersedia di backend.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {budgets.length > 0 ? (
            <p className="text-center text-caption text-muted-foreground">
              Total realisasi {formatCompact(totalSpent)} dari kapasitas{" "}
              {formatCompact(totalBudget)} · sisa {formatCompact(remaining)}
            </p>
          ) : null}
        </>
      )}

      {formOpen ? (
        <BudgetFormDialog
          key={`${editing?.id ?? "new"}-${initialCategoryId}-${month}`}
          open
          onOpenChange={closeForm}
          month={month}
          budget={editing}
          initialCategoryId={initialCategoryId}
        />
      ) : null}

      {copyOpen ? (
        <CopyBudgetDialog
          open
          onOpenChange={setCopyOpen}
          month={month}
        />
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="num mt-0.5 text-xs font-medium">{value}</p>
    </div>
  )
}

function BudgetCard({
  budget,
  left,
  onClick,
}: {
  budget: Budget
  left: number
  onClick: () => void
}) {
  const remainingPerDay = left > 0 ? Math.max(0, budget.remaining) / left : 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start gap-2">
        <CategoryIcon
          icon={budget.categoryIcon}
          color={budget.categoryColor}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{budget.categoryName}</p>
          <p className="text-[10px] text-muted-foreground">
            Diperbarui bulan ini
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
            BUDGET_STATUS_CLASS[budget.status],
          )}
        >
          {BUDGET_STATUS_LABEL[budget.status]} ({budget.percentage}%)
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="num text-lg font-semibold">{formatIDR(budget.spent)}</p>
        <p className="num text-caption text-muted-foreground">
          / {formatIDR(budget.amount)}
        </p>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            budget.status === "lebih"
              ? "bg-destructive"
              : budget.status === "waspada"
                ? "bg-warning"
                : "bg-primary",
          )}
          style={{ width: `${Math.min(100, budget.percentage)}%` }}
        />
      </div>

      <p
        className={cn(
          "mt-1.5 text-[10px]",
          budget.status === "lebih"
            ? "text-destructive"
            : "text-muted-foreground",
        )}
      >
        {budget.status === "lebih"
          ? `Terlampaui ${formatIDR(Math.abs(budget.remaining))}`
          : `Sisa ${formatIDR(budget.remaining)}`}{" "}
        · Maks {formatIDR(remainingPerDay)}/hari
      </p>
    </button>
  )
}
