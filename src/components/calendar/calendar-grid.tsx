"use client"

import { useMemo } from "react"
import { cn } from "cn"

import type { CalendarDay } from "@/lib/api/types/report"
import { fromISODate, toISODate } from "@/lib/format"

const WEEKDAYS = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"]

function formatCompact(value: number): string {
  const absolute = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  if (absolute >= 1_000_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000_000).toFixed(1).replace(".", ",")} M`
  }
  if (absolute >= 1_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000).toFixed(1).replace(".", ",")} jt`
  }
  if (absolute >= 1_000) {
    return `${sign}Rp ${Math.round(absolute / 1_000)} rb`
  }
  return `${sign}Rp ${absolute}`
}

type CalendarMode = "month" | "week"

interface CalendarGridProps {
  mode: CalendarMode
  cursor: Date
  selected: string
  days: Map<string, CalendarDay>
  onSelect: (date: string) => void
}

function weekStart(date: Date): Date {
  const offset = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
}

function buildMonthCells(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset)

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
  days,
  onSelect,
}: CalendarGridProps) {
  const today = toISODate(new Date())
  const cells = useMemo(
    () => (mode === "month" ? buildMonthCells(cursor) : buildWeekCells(selected)),
    [mode, cursor, selected],
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <div className={mode === "month" ? "min-w-[620px]" : "min-w-[720px]"}>
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-[10px] font-semibold tracking-wide text-muted-foreground"
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
                    "relative flex flex-col gap-1 border-r border-b border-border p-1.5 text-left align-top transition-colors last:border-r-0 hover:bg-muted/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    mode === "month" ? "min-h-[96px] md:min-h-[112px]" : "min-h-[220px]",
                    !inMonth && "bg-muted/20 text-muted-foreground/60",
                    isSelected && "z-10 ring-2 ring-primary ring-inset",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-caption font-medium",
                        isToday && "bg-primary text-primary-foreground",
                        !isToday && isSelected && "ring-1 ring-primary",
                      )}
                    >
                      {date.getDate()}
                    </span>
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
                  </div>

                  {day && day.income > 0 ? (
                    <span className="truncate text-[10px] font-medium text-success">
                      + {formatCompact(day.income)}
                    </span>
                  ) : null}
                  {day && day.expense > 0 ? (
                    <span className="truncate text-[10px] font-medium text-destructive">
                      − {formatCompact(day.expense)}
                    </span>
                  ) : null}

                  {mode === "week" ? (
                    <div className="mt-1 space-y-1">
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
                    </div>
                  ) : null}

                  {bills.slice(0, mode === "week" ? 3 : 1).map((bill) => (
                    <span
                      key={bill.id}
                      className={cn(
                        "truncate rounded-md px-1 py-0.5 text-[9px] font-medium",
                        bill.isOverdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-warning/15 text-[#8a5a00]",
                      )}
                    >
                      {bill.lender.name} · {formatCompact(bill.remainingAmount)}
                    </span>
                  ))}
                  {bills.length > (mode === "week" ? 3 : 1) ? (
                    <span className="text-[9px] text-muted-foreground">
                      +{bills.length - (mode === "week" ? 3 : 1)} tagihan
                    </span>
                  ) : null}

                  {transactions.length > 0 ? (
                    <div className="mt-auto flex items-center gap-1 pt-1">
                      {transactions.slice(0, 4).map((transaction) => (
                        <span
                          key={transaction.id}
                          className="size-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              transaction.category?.bgColor ?? "var(--muted-foreground)",
                          }}
                        />
                      ))}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
