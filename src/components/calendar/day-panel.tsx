"use client"

import Link from "next/link"
import { Clock, Plus, Zap } from "lucide-react"
import { cn } from "cn"

import type { Bill } from "@/lib/api/types/bill"
import type { CalendarDay } from "@/lib/api/types/report"
import { formatIDR, formatTanggal, fromISODate, toISODate } from "@/lib/format"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"

interface DayPanelProps {
  date: string
  day?: CalendarDay
  loading?: boolean
  onAddTransaction: () => void
  onPay: (bill: Bill) => void
}

function longDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function transactionTime(iso: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function amountClass(type: string): string {
  if (type === "INCOME") return "text-success"
  if (type === "EXPENSE") return "text-destructive"
  return "text-muted-foreground"
}

export function DayPanel({
  date,
  day,
  loading,
  onAddTransaction,
  onPay,
}: DayPanelProps) {
  const transactions = day?.transactions ?? []
  const bills = day?.bills ?? []
  const expense = day?.expense ?? 0
  const income = day?.income ?? 0
  const isToday = date === toISODate(new Date())

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-h2 capitalize">{longDate(date)}</h2>
            {isToday ? (
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Hari Ini
              </span>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Catat transaksi di tanggal ini"
            onClick={onAddTransaction}
            className="shrink-0 rounded-full border-primary/30 bg-card text-primary md:hidden"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
            <p className="num mt-0.5 truncate text-xs font-semibold text-destructive md:text-sm">
              {expense > 0 ? `−${formatIDR(expense)}` : formatIDR(0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Pemasukan</p>
            <p
              className={cn(
                "num mt-0.5 truncate text-xs font-semibold md:text-sm",
                income > 0 ? "text-success" : "text-foreground",
              )}
            >
              {income > 0 ? `+${formatIDR(income)}` : formatIDR(0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Jatuh Tempo</p>
            <p
              className={cn(
                "num mt-0.5 truncate text-xs font-semibold md:text-sm",
                bills.length > 0 ? "text-warning" : "text-foreground",
              )}
            >
              {bills.length}
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">
                Tagihan
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Tagihan Tempo
          <span className="ml-1 font-medium">({bills.length})</span>
        </h3>

        {bills.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-caption text-muted-foreground">
            Tidak ada tagihan jatuh tempo pada hari ini.
          </p>
        ) : (
          bills.map((bill) => {
            const overdue = bill.isOverdue
            return (
              <article
                key={bill.id}
                className={cn(
                  "rounded-2xl border p-3",
                  overdue
                    ? "border-destructive/25 bg-destructive/5"
                    : "border-warning/25 bg-warning/10",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl",
                      overdue
                        ? "bg-destructive/15 text-destructive"
                        : "bg-warning/20 text-[#8a5a00]",
                    )}
                  >
                    <Zap className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{bill.lender.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {bill.deskripsi || "Tagihan"}
                      {bill.wallet ? ` • ${bill.wallet.name}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      Batas {formatTanggal(bill.dueDate)}
                    </p>
                  </div>
                  <p className="num shrink-0 text-sm font-semibold whitespace-nowrap">
                    {formatIDR(bill.remainingAmount)}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="lg"
                    className="h-9 flex-1"
                    disabled={bill.status === "lunas"}
                    onClick={() => onPay(bill)}
                  >
                    Bayar
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-9 flex-1 bg-card"
                    render={<Link href={`/bills/${bill.id}`} />}
                    nativeButton={false}
                  >
                    Detail Tagihan
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Transaksi Tercatat
            <span className="ml-1 font-medium">({transactions.length})</span>
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Total:{" "}
            <span className="num font-semibold text-destructive">
              {expense > 0 ? `−${formatIDR(expense)}` : formatIDR(0)}
            </span>
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-14 animate-pulse rounded-xl bg-muted" />
            <div className="h-14 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-center text-caption text-muted-foreground">
            Belum ada transaksi pada hari ini.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {transactions.map((transaction) => {
              const time = transactionTime(transaction.createdAt)
              return (
                <li
                  key={transaction.id}
                  className="flex items-center gap-2.5 rounded-xl bg-card p-2.5 md:p-3"
                >
                  <CategoryIcon
                    icon={transaction.category?.icon}
                    color={transaction.category?.bgColor}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {transaction.memo || transaction.category?.name || "Transaksi"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {[
                        transaction.category?.name ?? "Tanpa kategori",
                        transaction.wallet?.name,
                        time,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "num shrink-0 text-sm font-semibold",
                      amountClass(transaction.type),
                    )}
                  >
                    {transaction.type === "INCOME"
                      ? "+"
                      : transaction.type === "EXPENSE"
                        ? "−"
                        : ""}
                    {formatIDR(transaction.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <Button
          variant="outline"
          className="hidden w-full md:flex"
          onClick={onAddTransaction}
        >
          <Plus className="size-4" />
          Catat transaksi di tanggal ini
        </Button>
      </section>
    </div>
  )
}
