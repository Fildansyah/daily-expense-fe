"use client"

import { Fragment, useMemo } from "react"
import { ArrowLeftRight, MoreHorizontal } from "lucide-react"
import { cn } from "cn"

import type { Transaction } from "@/lib/api/types/transaction"
import type { FlatCategory } from "@/lib/categories"
import { formatIDR, fromISODate } from "@/lib/format"
import { CategoryIcon } from "@/components/category-icon"
import { WALLET_TYPE_LABELS, WalletIcon } from "@/components/wallet-icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TransactionListProps {
  transactions: Transaction[]
  categories: FlatCategory[]
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[], selected: boolean) => void
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

function groupDateLabel(iso: string): string {
  return fromISODate(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function groupRelativeDateLabel(iso: string): string {
  const date = fromISODate(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((today.getTime() - date.getTime()) / 86_400_000)

  if (diff === 0) return `Hari Ini — ${groupDateLabel(iso)}`
  if (diff === 1) return `Kemarin — ${groupDateLabel(iso)}`
  return groupDateLabel(iso)
}

function transactionTime(iso: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

function transactionTitle(transaction: Transaction): string {
  if (transaction.type === "TRANSFER") return "Transfer"
  return transaction.memo || transaction.category?.name || "Transaksi"
}

function transactionMeta(transaction: Transaction): string {
  if (transaction.type === "TRANSFER") {
    return `Transfer • ${transaction.wallet?.name ?? "—"} → ${transaction.transferWallet?.name ?? "—"}`
  }

  return [
    transaction.category?.name ?? "Tanpa kategori",
    transaction.wallet?.name,
    transactionTime(transaction.createdAt),
  ]
    .filter(Boolean)
    .join(" • ")
}

function amountLabel(transaction: Transaction): string {
  const prefix =
    transaction.type === "INCOME" ? "+" : transaction.type === "EXPENSE" ? "−" : ""
  return `${prefix} ${formatIDR(transaction.amount)}`
}

function amountClass(transaction: Transaction): string {
  if (transaction.type === "INCOME") return "text-success"
  if (transaction.type === "TRANSFER") return "text-muted-foreground"
  return "text-foreground"
}

function CategoryCell({
  transaction,
  categories,
}: {
  transaction: Transaction
  categories: FlatCategory[]
}) {
  if (transaction.type === "TRANSFER") {
    return (
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-info/10 text-info">
          <ArrowLeftRight className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">Transfer</p>
          <p className="truncate text-caption text-muted-foreground">
            Antar akun
          </p>
        </div>
      </div>
    )
  }

  const category = transaction.category
  const parentName = category
    ? categories.find((item) => item.id === category.id)?.parentName
    : undefined

  return (
    <div className="flex items-center gap-2.5">
      <CategoryIcon
        icon={category?.icon}
        color={category?.bgColor}
        size="md"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {category?.name ?? "Tanpa kategori"}
        </p>
        {parentName ? (
          <p className="truncate text-caption text-muted-foreground">
            {parentName}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function WalletCell({ transaction }: { transaction: Transaction }) {
  if (transaction.type === "TRANSFER") {
    return (
      <div className="flex items-center gap-2">
        <WalletIcon type={transaction.wallet?.type} />
        <div className="min-w-0 text-sm">
          <p className="truncate">
            {transaction.wallet?.name ?? "—"}{" "}
            <span className="text-muted-foreground">→</span>{" "}
            {transaction.transferWallet?.name ?? "—"}
          </p>
          <p className="text-caption text-muted-foreground">Transfer</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <WalletIcon type={transaction.wallet?.type} />
      <div className="min-w-0 text-sm">
        <p className="truncate">{transaction.wallet?.name ?? "—"}</p>
        <p className="text-caption text-muted-foreground">
          {WALLET_TYPE_LABELS[transaction.wallet?.type ?? ""] ?? "Akun"}
        </p>
      </div>
    </div>
  )
}

function RowActions({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Aksi transaksi"
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(transaction)}>
          Ubah transaksi
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(transaction)}
        >
          Hapus transaksi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TransactionList({
  transactions,
  categories,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const transaction of transactions) {
      const items = map.get(transaction.date) ?? []
      items.push(transaction)
      map.set(transaction.date, items)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions])

  const allSelected =
    transactions.length > 0 &&
    transactions.every((transaction) => selected.has(transaction.id))

  return (
    <div>
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Pilih semua transaksi"
                  checked={allSelected}
                  onChange={() =>
                    onToggleAll(
                      transactions.map((transaction) => transaction.id),
                      !allSelected,
                    )
                  }
                  className="size-4 accent-[var(--primary)]"
                />
              </TableHead>
              <TableHead>Kategori &amp; sub-kategori</TableHead>
              <TableHead>Catatan / keterangan</TableHead>
              <TableHead>Akun &amp; metode</TableHead>
              <TableHead className="text-right">Jumlah (IDR)</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(([date, items]) => {
              const income = items
                .filter((item) => item.type === "INCOME")
                .reduce((total, item) => total + item.amount, 0)
              const expense = items
                .filter((item) => item.type === "EXPENSE")
                .reduce((total, item) => total + item.amount, 0)
              const net = income - expense

              return (
                <Fragment key={date}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell colSpan={6} className="py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-caption font-medium text-muted-foreground">
                          {groupDateLabel(date)}
                          <span className="ml-2 font-normal">
                            {items.length} transaksi
                          </span>
                        </span>
                        <span
                          className={cn(
                            "num text-caption font-medium",
                            net > 0
                              ? "text-success"
                              : net < 0
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {net > 0 ? "+" : net < 0 ? "−" : ""} {formatIDR(Math.abs(net))}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>

                  {items.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="cursor-pointer"
                      onClick={() => onEdit(transaction)}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${transaction.memo || "transaksi"}`}
                          checked={selected.has(transaction.id)}
                          onChange={() => onToggle(transaction.id)}
                          className="size-4 accent-[var(--primary)]"
                        />
                      </TableCell>
                      <TableCell>
                        <CategoryCell
                          transaction={transaction}
                          categories={categories}
                        />
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[260px] truncate text-sm">
                          {transaction.memo || "Tanpa catatan"}
                        </p>
                        {transaction.note ? (
                          <p className="max-w-[260px] truncate text-caption text-muted-foreground">
                            {transaction.note}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <WalletCell transaction={transaction} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "num whitespace-nowrap text-sm font-medium",
                            amountClass(transaction),
                          )}
                        >
                          {amountLabel(transaction)}
                        </span>
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <RowActions
                          transaction={transaction}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {groups.map(([date, items]) => {
          const expense = items
            .filter((item) => item.type === "EXPENSE")
            .reduce((total, item) => total + item.amount, 0)
          const income = items
            .filter((item) => item.type === "INCOME")
            .reduce((total, item) => total + item.amount, 0)
          const total = expense > 0 ? expense : income

          return (
            <section key={date} className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="min-w-0 truncate text-[11px] font-semibold text-muted-foreground">
                  {groupRelativeDateLabel(date)}
                </p>
                <p className="num shrink-0 text-[11px] font-semibold">
                  {formatIDR(total)}
                </p>
              </div>

              <ul className="space-y-2">
                {items.map((transaction) => {
                  const time = transactionTime(transaction.createdAt)
                  const prefix =
                    transaction.type === "INCOME"
                      ? "+"
                      : transaction.type === "EXPENSE"
                        ? "−"
                        : ""

                  return (
                    <li
                      key={transaction.id}
                      className="flex items-center gap-1 rounded-xl border border-border bg-card p-3"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onEdit(transaction)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            onEdit(transaction)
                          }
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {transaction.type === "TRANSFER" ? (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info">
                            <ArrowLeftRight className="size-4" />
                          </span>
                        ) : (
                          <CategoryIcon
                            icon={transaction.category?.icon}
                            color={transaction.category?.bgColor}
                            size="md"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {transactionTitle(transaction)}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {transactionMeta(transaction)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={cn(
                              "num text-sm font-semibold whitespace-nowrap",
                              transaction.type === "EXPENSE"
                                ? "text-destructive"
                                : amountClass(transaction),
                            )}
                          >
                            {prefix}
                            {formatIDR(transaction.amount)}
                          </p>
                          {time ? (
                            <p className="text-[10px] text-muted-foreground">
                              {time}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <RowActions
                        transaction={transaction}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
