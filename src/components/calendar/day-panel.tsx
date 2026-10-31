"use client"

import Link from "next/link"
import { Plus, ReceiptText } from "lucide-react"
import { cn } from "cn"

import type { CalendarDay } from "@/lib/api/types/report"
import { BILL_STATUS_LABELS, type BillStatus } from "@/lib/types"
import { formatIDR, formatTanggal, fromISODate } from "@/lib/format"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DayPanelProps {
  date: string
  day?: CalendarDay
  loading?: boolean
  onAddTransaction: () => void
}

function longDate(iso: string): string {
  return fromISODate(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function statusClass(status: BillStatus, overdue: boolean): string {
  if (overdue) return "bg-destructive/10 text-destructive"
  if (status === "lunas") return "bg-success/10 text-success"
  if (status === "sebagian") return "bg-warning/15 text-[#8a5a00]"
  return "bg-muted text-muted-foreground"
}

export function DayPanel({ date, day, loading, onAddTransaction }: DayPanelProps) {
  const transactions = day?.transactions ?? []
  const bills = day?.bills ?? []
  const net = (day?.income ?? 0) - (day?.expense ?? 0)

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="gap-1 pb-2">
          <p className="text-caption text-muted-foreground">Hari terpilih</p>
          <CardTitle className="text-h2 capitalize">{longDate(date)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-success/10 p-2">
              <p className="text-[10px] text-success">Pemasukan</p>
              <p className="num mt-0.5 text-xs font-semibold text-success">
                {formatIDR(day?.income ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-destructive/10 p-2">
              <p className="text-[10px] text-destructive">Pengeluaran</p>
              <p className="num mt-0.5 text-xs font-semibold text-destructive">
                {formatIDR(day?.expense ?? 0)}
              </p>
            </div>
            <div className="rounded-xl bg-muted p-2">
              <p className="text-[10px] text-muted-foreground">Net</p>
              <p
                className={cn(
                  "num mt-0.5 text-xs font-semibold",
                  net >= 0 ? "text-foreground" : "text-destructive",
                )}
              >
                {formatIDR(net)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-label">Daftar transaksi</p>
              <span className="text-caption text-muted-foreground">
                {transactions.length} transaksi
              </span>
            </div>

            {loading ? (
              <div className="mt-2 space-y-2">
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-center text-caption text-muted-foreground">
                Belum ada transaksi pada hari ini.
              </p>
            ) : (
              <ul className="mt-2 space-y-1">
                {transactions.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/60"
                  >
                    <CategoryIcon
                      icon={transaction.category?.icon}
                      color={transaction.category?.bgColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {transaction.memo || transaction.category?.name || "Transaksi"}
                      </p>
                      <p className="truncate text-caption text-muted-foreground">
                        {transaction.category?.name ?? "Tanpa kategori"} ·{" "}
                        {transaction.wallet?.name ?? "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "num shrink-0 text-xs font-medium",
                        transaction.type === "INCOME" && "text-success",
                        transaction.type === "EXPENSE" && "text-foreground",
                        transaction.type === "TRANSFER" && "text-muted-foreground",
                      )}
                    >
                      {transaction.type === "INCOME"
                        ? "+"
                        : transaction.type === "EXPENSE"
                          ? "−"
                          : ""}{" "}
                      {formatIDR(transaction.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={onAddTransaction}
            >
              <Plus className="size-4" />
              Catat transaksi di tanggal ini
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-1 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ReceiptText className="size-4 text-warning" />
            Tagihan terkait
            <span className="text-caption font-normal text-muted-foreground">
              {bills.length} tagihan
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {bills.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-3 text-center text-caption text-muted-foreground">
              Tidak ada tagihan jatuh tempo pada hari ini.
            </p>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="rounded-xl border border-border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{bill.lender.name}</p>
                    <p className="truncate text-caption text-muted-foreground">
                      {bill.deskripsi || "Tagihan"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      statusClass(bill.status, bill.isOverdue),
                    )}
                  >
                    {bill.isOverdue
                      ? `Terlambat ${Math.abs(bill.daysUntilDue)} hari`
                      : BILL_STATUS_LABELS[bill.status]}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="num text-sm font-semibold">
                      {formatIDR(bill.remainingAmount)}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      Jatuh tempo {formatTanggal(bill.dueDate)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={bill.isOverdue ? "default" : "outline"}
                    render={<Link href={`/bills/${bill.id}`} />}
                    nativeButton={false}
                  >
                    Bayar
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
