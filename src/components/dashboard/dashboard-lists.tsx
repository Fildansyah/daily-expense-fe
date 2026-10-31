"use client"

import Link from "next/link"
import { cn } from "cn"

import type { Bill } from "@/lib/api/types/bill"
import type { Budget } from "@/lib/api/types/budget"
import type { Transaction } from "@/lib/api/types/transaction"
import type { WalletCredit } from "@/lib/api/types/report"
import { BILL_STATUS_LABELS } from "@/lib/types"
import { formatIDR, formatTanggal } from "@/lib/format"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function billStatusClass(bill: Bill): string {
  if (bill.isOverdue) return "bg-destructive/10 text-destructive"
  if (bill.status === "lunas") return "bg-success/10 text-success"
  if (bill.status === "sebagian") return "bg-warning/15 text-[#8a5a00]"
  return "bg-muted text-muted-foreground"
}

export function UpcomingBills({ bills }: { bills: Bill[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">Tagihan Mendatang</CardTitle>
          <p className="text-caption text-muted-foreground">
            {bills.length} tagihan dalam 7 hari
          </p>
        </div>
        <Link href="/bills" className="text-caption font-medium text-primary hover:underline">
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {bills.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tidak ada tagihan jatuh tempo 7 hari ke depan.
          </p>
        ) : (
          bills.slice(0, 3).map((bill, index) => {
            const progress =
              bill.amount > 0 ? Math.min(100, (bill.paidAmount / bill.amount) * 100) : 0

            return (
              <div key={bill.id} className="rounded-xl border border-border p-2.5">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold",
                      index % 2 === 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {bill.lender.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{bill.lender.name}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                          billStatusClass(bill),
                        )}
                      >
                        {bill.isOverdue
                          ? `Terlambat ${Math.abs(bill.daysUntilDue)}h`
                          : BILL_STATUS_LABELS[bill.status]}
                      </span>
                    </div>
                    <p className="truncate text-caption text-muted-foreground">
                      {bill.deskripsi || "Tagihan"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-semibold">
                      {formatIDR(bill.remainingAmount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      dari {formatIDR(bill.amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(progress)}%
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground">
                    Jatuh tempo {formatTanggal(bill.dueDate)}
                  </p>
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
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
        <Link
          href="/transactions"
          className="text-caption font-medium text-primary hover:underline"
        >
          Semua transaksi
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada transaksi.
          </p>
        ) : (
          <ul className="space-y-1">
            {transactions.slice(0, 5).map((transaction) => (
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
      </CardContent>
    </Card>
  )
}

function budgetBarClass(status: Budget["status"]): string {
  if (status === "lebih") return "bg-destructive"
  if (status === "waspada") return "bg-warning"
  return "bg-primary"
}

export function BudgetProgress({ budgets }: { budgets: Budget[] }) {
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">Anggaran Bulanan</CardTitle>
          <p className="text-caption text-muted-foreground">
            {budgets.length} anggaran teratas
          </p>
        </div>
        <Link
          href="/budgets"
          className="text-caption font-medium text-primary hover:underline"
        >
          Kelola budget
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {budgets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada anggaran. Atur batas pengeluaran bulananmu.
          </p>
        ) : (
          budgets.map((budget) => (
            <div key={budget.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <CategoryIcon
                    icon={budget.categoryIcon}
                    color={budget.categoryColor}
                    size="sm"
                  />
                  <span className="truncate font-medium">{budget.categoryName}</span>
                </span>
                <span className="num shrink-0 text-muted-foreground">
                  {formatIDR(budget.spent)} / {formatIDR(budget.amount)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", budgetBarClass(budget.status))}
                  style={{ width: `${Math.min(100, budget.percentage)}%` }}
                />
              </div>
            </div>
          ))
        )}

        {budgets.length > 0 ? (
          <div className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-caption">
            <span className="text-muted-foreground">Sisa anggaran</span>
            <span className="num font-medium">
              {formatIDR(Math.max(0, totalBudget - totalSpent))}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function utilizationTone(value: number): string {
  if (value >= 85) return "bg-destructive"
  if (value >= 60) return "bg-warning"
  return "bg-primary"
}

export function CreditUtilization({ accounts }: { accounts: WalletCredit[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">Penggunaan Limit</CardTitle>
          <p className="text-caption text-muted-foreground">
            {accounts.length} akun kredit/paylater
          </p>
        </div>
        <Link
          href="/accounts"
          className="text-caption font-medium text-primary hover:underline"
        >
          Kelola akun
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {accounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada kartu kredit atau paylater.
          </p>
        ) : (
          accounts.map((account) => (
            <div key={account.walletId} className="rounded-xl border border-border p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{account.name}</p>
                  <p className="text-caption text-muted-foreground">
                    Limit {formatIDR(account.limit)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    account.utilization >= 85
                      ? "bg-destructive/10 text-destructive"
                      : account.utilization >= 60
                        ? "bg-warning/15 text-[#8a5a00]"
                        : "bg-success/10 text-success",
                  )}
                >
                  {account.utilization.toFixed(1)}% terpakai
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", utilizationTone(account.utilization))}
                  style={{ width: `${Math.min(100, account.utilization)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="num">Terpakai {formatIDR(account.used)}</span>
                <span className="num">Sisa {formatIDR(account.available)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
