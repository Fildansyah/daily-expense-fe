"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

import type { CalendarDay } from "@/lib/api/types/report"
import { formatIDR, fromISODate, toISODate } from "@/lib/format"
import { Button } from "@/components/ui/button"

const WEEKDAYS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"]

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(".", ",").replace(",0", "")
}

function formatCompact(value: number): string {
  const absolute = Math.abs(value)

  if (absolute >= 1_000_000_000) {
    return `Rp ${trimDecimal(absolute / 1_000_000_000)}M`
  }
  if (absolute >= 1_000_000) {
    return `Rp ${trimDecimal(absolute / 1_000_000)}jt`
  }
  if (absolute >= 1_000) {
    return `Rp ${Math.round(absolute / 1_000)}rb`
  }
  return `Rp ${absolute}`
}

type CalendarMode = "month" | "week"

interface CalendarGridProps {
  mode: CalendarMode
  cursor: Date
  selected: string
  label: string
  days: Map<string, CalendarDay>
  onSelect: (date: string) => void
  onPrev: () => void
  onNext: () => void
}

function weekStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
}

function buildMonthCells(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  })
}

function buildWeekCells(selected: string): Date[] {
  const start = weekStart(fromISODate(selected))
  return Array.from({ length: 7 }, (_, index) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  })
}

export function CalendarGrid({
  mode,
  cursor,
  selected,
  label,
  days,
  onSelect,
  onPrev,
  onNext,
}: CalendarGridProps) {
  const today = toISODate(new Date())
  const cells = useMemo(
    () => (mode === "month" ? buildMonthCells(cursor) : buildWeekCells(selected)),
    [mode, cursor, selected],
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="truncate text-lg font-semibold capitalize">{label}</p>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Periode sebelumnya"
            onClick={onPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Periode berikutnya"
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {mode === "week" ? (
        <div className="md:hidden">
          <WeekAgenda cells={cells} selected={selected} days={days} onSelect={onSelect} />
        </div>
      ) : null}

      <div className={mode === "week" ? "hidden md:block" : undefined}>
        <div className="grid grid-cols-7 border-y border-border bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-1.5 text-center text-[9px] font-semibold tracking-wide text-muted-foreground md:text-[10px]"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((date) => {
            const key = toISODate(date)
            const day = days.get(key)
            const inMonth =
              mode === "week" || date.getMonth() === cursor.getMonth()
            const isToday = key === today
            const isSelected = key === selected
            const bills = day?.bills ?? []
            const transactions = day?.transactions ?? []

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-pressed={isSelected}
                aria-label={`${key}, ${day?.transactionCount ?? 0} transaksi, ${bills.length} tagihan`}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 border-r border-b border-border px-0.5 py-1.5 text-center transition-colors last:border-r-0 hover:bg-muted/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  mode === "month"
                    ? "min-h-[62px] md:min-h-[100px] md:py-2"
                    : "min-h-[110px] md:min-h-[190px] md:py-2",
                  !inMonth && "bg-muted/20 text-muted-foreground/60",
                  isSelected && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg text-[11px] font-semibold md:size-8 md:text-xs",
                    isSelected && "bg-primary text-primary-foreground",
                    !isSelected && isToday && "text-primary ring-1 ring-primary",
                  )}
                >
                  {date.getDate()}
                </span>

                {day && day.income > 0 ? (
                  <span className="max-w-full truncate text-[9px] font-medium text-success md:text-[10px]">
                    +{formatCompact(day.income)}
                  </span>
                ) : null}
                {day && day.expense > 0 ? (
                  <span className="max-w-full truncate text-[9px] font-medium text-destructive md:text-[10px]">
                    −{formatCompact(day.expense)}
                  </span>
                ) : null}

                {mode === "week" ? (
                  <div className="mt-1 w-full space-y-0.5">
                    {transactions.slice(0, 3).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="truncate rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px]"
                      >
                        {transaction.memo || transaction.category?.name || "Transaksi"}
                      </div>
                    ))}
                    {transactions.length > 3 ? (
                      <p className="text-[10px] text-muted-foreground">
                        +{transactions.length - 3} transaksi
                      </p>
                    ) : null}
                    {bills.slice(0, 3).map((bill) => (
                      <span
                        key={bill.id}
                        className={cn(
                          "block truncate rounded-md px-1 py-0.5 text-[9px] font-medium",
                          bill.isOverdue
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/15 text-[#8a5a00]",
                        )}
                      >
                        {bill.lender.name} · {formatCompact(bill.remainingAmount)}
                      </span>
                    ))}
                    {bills.length > 3 ? (
                      <span className="block text-[9px] text-muted-foreground">
                        +{bills.length - 3} tagihan
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {bills.length > 0 || transactions.length > 0 ? (
                  <div className="mt-auto flex items-center gap-1 pt-0.5">
                    {bills.length > 0 ? (
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          bills.some((bill) => bill.isOverdue)
                            ? "bg-destructive"
                            : "bg-warning",
                        )}
                      />
                    ) : null}
                    <div className="hidden items-center gap-1 md:flex">
                      {transactions.slice(0, 4).map((transaction) => (
                        <span
                          key={transaction.id}
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              transaction.category?.bgColor ??
                              "var(--muted-foreground)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-border py-2 text-[10px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-destructive" />
          Pengeluaran
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-success" />
          Pemasukan
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-warning" />
          Tagihan
        </span>
      </div>
    </div>
  )
}

function WeekAgenda({
  cells,
  selected,
  days,
  onSelect,
}: {
  cells: Date[]
  selected: string
  days: Map<string, CalendarDay>
  onSelect: (date: string) => void
}) {
  return (
    <ul className="divide-y divide-border border-t border-border">
      {cells.map((date) => {
        const key = toISODate(date)
        const day = days.get(key)
        const transactions = day?.transactions ?? []
        const bills = day?.bills ?? []
        const isSelected = key === selected

        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-full items-start gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/40",
                isSelected && "bg-primary/5",
              )}
            >
              <div className="flex w-9 shrink-0 flex-col items-center gap-0.5">
                <span className="text-[9px] font-semibold tracking-wide text-muted-foreground">
                  {WEEKDAYS[date.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-xs font-semibold",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-1 pt-0.5">
                {transactions.length === 0 && bills.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Tidak ada transaksi
                  </p>
                ) : null}
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="truncate">
                      {transaction.memo || transaction.category?.name || "Transaksi"}
                    </span>
                    <span
                      className={cn(
                        "num shrink-0 font-medium",
                        transaction.type === "INCOME" && "text-success",
                        transaction.type === "EXPENSE" && "text-destructive",
                        transaction.type === "TRANSFER" && "text-muted-foreground",
                      )}
                    >
                      {transaction.type === "INCOME"
                        ? "+"
                        : transaction.type === "EXPENSE"
                          ? "−"
                          : ""}
                      {formatIDR(transaction.amount)}
                    </span>
                  </div>
                ))}
                {bills.length > 0 ? (
                  <p className="text-[11px] font-medium text-[#8a5a00]">
                    {bills.length} tagihan jatuh tempo
                  </p>
                ) : null}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
