"use client"

import Link from "next/link"
import { CreditCard, MoreHorizontal } from "lucide-react"
import { cn } from "cn"

import type { Wallet } from "@/lib/api/types/wallet"
import { formatIDR, formatTanggal, toISODate } from "@/lib/format"
import {
  WALLET_TYPE_LABEL,
  daysUntil,
  maskedAccount,
  minimumPayment,
  nextDueDate,
  utilizationBand,
} from "@/lib/wallet"
import { useBills } from "@/hooks/use-bills"
import { WalletIcon } from "@/components/wallet-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AccountCardProps {
  wallet: Wallet
  onEdit: (wallet: Wallet) => void
  onArchive: (wallet: Wallet) => void
}

function AccountMenu({ wallet, onEdit, onArchive }: AccountCardProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Aksi akun" />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(wallet)}>Ubah akun</DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onArchive(wallet)}
        >
          Arsipkan akun
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DebitAccountCard(props: AccountCardProps) {
  const { wallet } = props

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <WalletIcon type={wallet.type} className="size-9 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{wallet.name}</p>
              <p className="text-caption text-muted-foreground">
                {maskedAccount(wallet.accountNumber)}
              </p>
            </div>
          </div>
          <AccountMenu {...props} />
        </div>

        <div>
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
            SALDO TERSEDIA
          </p>
          <p className="num mt-0.5 text-xl font-semibold">
            {formatIDR(wallet.balance)}
          </p>
          <p className="text-caption text-muted-foreground">
            {wallet.currency} · saldo tercatat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
          </span>
          {wallet.isExclude ? (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-[#8a5a00]">
              Dikecualikan
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function CreditAccountCard(props: AccountCardProps) {
  const { wallet } = props
  const billsQuery = useBills({ walletId: wallet.id, limit: 10 })
  const unpaid = (billsQuery.data?.items ?? []).find(
    (bill) => bill.status !== "lunas",
  )
  const due = nextDueDate(wallet.dueDay)
  const dueLabel = due ? formatTanggal(toISODate(due)) : "—"
  const dueIn = due ? daysUntil(due) : null
  const band = utilizationBand(wallet.utilization)
  const limit = wallet.creditLimit ?? 0

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{wallet.name}</p>
              <p className="text-caption text-muted-foreground">
                {maskedAccount(wallet.accountNumber)}
              </p>
            </div>
          </div>
          <AccountMenu {...props} />
        </div>

        <div
          className="relative overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground"
          style={{ backgroundColor: wallet.color || undefined }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-widest opacity-80">
                {WALLET_TYPE_LABEL[wallet.type]?.toUpperCase()}
              </p>
              <p className="mt-1 text-sm font-semibold">{wallet.name}</p>
            </div>
            <span className="flex size-6 items-center justify-center rounded-md bg-white/20">
              <span className="size-3 rounded-sm bg-white/70" />
            </span>
          </div>
          <p className="num mt-6 text-lg tracking-[0.18em]">
            •••• {wallet.accountNumber?.replace(/\D/g, "").slice(-4) || "••••"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground">LIMIT</p>
            <p className="num text-xs font-semibold">{formatIDR(limit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">TERPAKAI</p>
            <p className="num text-xs font-semibold text-destructive">
              {formatIDR(wallet.used)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">SISA LIMIT</p>
            <p className="num text-xs font-semibold text-success">
              {formatIDR(wallet.available)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                band === "kritis"
                  ? "bg-destructive"
                  : band === "waspada"
                    ? "bg-warning"
                    : "bg-primary",
              )}
              style={{ width: `${Math.min(100, wallet.utilization)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>
              {wallet.utilization.toFixed(1)}% terpakai ·{" "}
              {band === "sehat"
                ? "Sehat (<40%)"
                : band === "waspada"
                  ? "Waspada (40–70%)"
                  : "Kritis (≥70%)"}
            </span>
            <span>{limit > 0 ? ((wallet.used / limit) * 100).toFixed(1) : "0"}%</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-2.5 py-2 text-caption">
          <span className="text-muted-foreground">Jatuh tempo {dueLabel}</span>
          {dueIn != null ? (
            <span className="font-medium">{dueIn >= 0 ? `${dueIn} hari lagi` : "Terlambat"}</span>
          ) : null}
          <span className="text-muted-foreground">
            Minimum {formatIDR(minimumPayment(wallet.balance))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled
            title="Endpoint statement belum tersedia"
          >
            Statement
          </Button>
          <Button
            size="sm"
            className="flex-1"
            render={
              <Link
                href={unpaid ? `/bills/${unpaid.id}` : "/bills"}
              />
            }
            nativeButton={false}
          >
            Bayar Tagihan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function ArchivedAccountRow({
  wallet,
  onRestore,
}: {
  wallet: Wallet
  onRestore: (wallet: Wallet) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border p-2.5">
      <WalletIcon type={wallet.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {wallet.name}{" "}
          <span className="text-caption font-normal text-muted-foreground">
            {maskedAccount(wallet.accountNumber)}
          </span>
        </p>
        <p className="text-caption text-muted-foreground">
          {WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
          {wallet.isExclude ? " · Dikecualikan" : ""}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={() => onRestore(wallet)}>
        Pulihkan Akun
      </Button>
    </div>
  )
}

export function accountKindLabel(wallet: Wallet): string {
  return wallet.type === "credit_card" || wallet.type === "paylater"
    ? "Kredit"
    : "Debit"
}
