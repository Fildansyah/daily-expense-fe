"use client"

import { useMemo, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { formatIDR } from "@/lib/format"
import { monthLabelFromKey, shiftMonthKey } from "@/lib/budget"
import { useBudgets, useCopyBudgets } from "@/hooks/use-budgets"
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

interface CopyBudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
}

export function CopyBudgetDialog({
  open,
  onOpenChange,
  month,
}: CopyBudgetDialogProps) {
  const copyBudgets = useCopyBudgets()
  const [fromMonth, setFromMonth] = useState(() => shiftMonthKey(month, -1))
  const [toMonth, setToMonth] = useState(month)
  const [skipExisting, setSkipExisting] = useState(true)

  const sourceQuery = useBudgets(fromMonth)
  const targetQuery = useBudgets(toMonth)

  const source = useMemo(() => sourceQuery.data ?? [], [sourceQuery.data])
  const targetCategories = useMemo(
    () => new Set((targetQuery.data ?? []).map((budget) => budget.categoryId)),
    [targetQuery.data],
  )

  const items = useMemo(
    () =>
      source.filter(
        (budget) => !skipExisting || !targetCategories.has(budget.categoryId),
      ),
    [source, skipExisting, targetCategories],
  )

  const total = items.reduce((sum, budget) => sum + budget.amount, 0)

  function submit() {
    if (items.length === 0) {
      toast.error("Tidak ada anggaran yang perlu disalin.")
      return
    }

    copyBudgets.mutate(
      { fromMonth, toMonth, skipExisting },
      {
        onSuccess: (result) => {
          toast.success(`${result.created} anggaran berhasil disalin`)
          onOpenChange(false)
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Salin anggaran</DialogTitle>
          <DialogDescription>
            Duplikasi batas anggaran dari satu bulan ke bulan lain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-caption text-muted-foreground">Dari bulan</span>
              <Input
                type="month"
                value={fromMonth}
                onChange={(event) => setFromMonth(event.target.value)}
                className="h-9 rounded-xl"
              />
              <span className="block text-[10px] text-muted-foreground">
                {source.length} kategori sumber
              </span>
            </label>
            <label className="space-y-1">
              <span className="text-caption text-muted-foreground">Ke bulan</span>
              <Input
                type="month"
                value={toMonth}
                onChange={(event) => setToMonth(event.target.value)}
                className="h-9 rounded-xl"
              />
              <span className="block text-[10px] text-muted-foreground">
                {targetCategories.size} sudah diatur
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-caption">
            <span className="font-medium">
              {items.length} kategori · total {formatIDR(total)}
            </span>
            <span className="text-muted-foreground">
              {monthLabelFromKey(fromMonth)} → {monthLabelFromKey(toMonth)}
            </span>
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
            {sourceQuery.isLoading ? (
              <p className="py-6 text-center text-caption text-muted-foreground">
                Memuat anggaran…
              </p>
            ) : source.length === 0 ? (
              <p className="py-6 text-center text-caption text-muted-foreground">
                Belum ada anggaran pada bulan sumber.
              </p>
            ) : (
              source.map((budget) => {
                const exists = targetCategories.has(budget.categoryId)
                const skipped = skipExisting && exists
                return (
                  <div
                    key={budget.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                  >
                    <CategoryIcon
                      icon={budget.categoryIcon}
                      color={budget.categoryColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{budget.categoryName}</p>
                      {exists ? (
                        <p className="text-[10px] text-muted-foreground">
                          {skipped
                            ? "Sudah diatur di bulan tujuan"
                            : "Akan ditimpa dengan nilai bulan sumber"}
                        </p>
                      ) : null}
                    </div>
                    <span className="num text-caption">{formatIDR(budget.amount)}</span>
                  </div>
                )
              })
            )}
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={skipExisting}
            onClick={() => setSkipExisting((value) => !value)}
            className="flex w-full items-start gap-2 rounded-xl border border-border p-2.5 text-left"
          >
            <span
              className={
                skipExisting
                  ? "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-primary bg-primary text-primary-foreground"
                  : "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-border"
              }
            >
              {skipExisting ? <Check className="size-3" /> : null}
            </span>
            <span>
              <span className="block text-sm font-medium">
                Lewati kategori yang sudah diatur di bulan tujuan
              </span>
              <span className="block text-caption text-muted-foreground">
                Anggaran yang sudah ada tidak akan ditimpa.
              </span>
            </span>
          </button>

          <div className="rounded-xl bg-accent/60 px-3 py-2 text-caption">
            {items.length} dari {source.length} kategori akan disalin. Total nilai:{" "}
            <span className="font-medium">{formatIDR(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={copyBudgets.isPending || items.length === 0}
          >
            {copyBudgets.isPending ? <Loader2 className="animate-spin" /> : null}
            Salin {items.length} anggaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
