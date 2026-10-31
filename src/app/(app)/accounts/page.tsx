"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeftRight, Plus } from "lucide-react"
import { toast } from "sonner"

import type { Wallet } from "@/lib/api/types/wallet"
import { formatIDR, formatTanggal } from "@/lib/format"
import { isLiability, toWalletInput } from "@/lib/wallet"
import { useTransactions } from "@/hooks/use-transactions"
import { useUpdateWallet, useWalletSummary, useWallets } from "@/hooks/use-wallets"
import { PageHeader } from "@/components/layout/page-header"
import {
  ArchivedAccountRow,
  CreditAccountCard,
  DebitAccountCard,
} from "@/components/accounts/account-card"
import { AccountFormDialog } from "@/components/accounts/account-form-dialog"
import { TransferDialog } from "@/components/accounts/transfer-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AccountsPage() {
  const walletsQuery = useWallets(true)
  const summaryQuery = useWalletSummary()
  const transfersQuery = useTransactions({ type: "TRANSFER", limit: 5, sort: "-date" })
  const updateWallet = useUpdateWallet()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  const wallets = walletsQuery.data ?? []
  const active = wallets.filter((wallet) => !wallet.isArchived)
  const debit = active.filter((wallet) => !isLiability(wallet.type))
  const credit = active.filter((wallet) => isLiability(wallet.type))
  const archived = wallets.filter((wallet) => wallet.isArchived)
  const transfers = transfersQuery.data?.items ?? []

  function archive(wallet: Wallet) {
    updateWallet.mutate(
      { id: wallet.id, input: toWalletInput(wallet, { isArchived: true }) },
      {
        onSuccess: () => toast.success("Akun diarsipkan"),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  function restore(wallet: Wallet) {
    updateWallet.mutate(
      { id: wallet.id, input: toWalletInput(wallet, { isArchived: false }) },
      {
        onSuccess: () => toast.success("Akun dipulihkan"),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(wallet: Wallet) {
    setEditing(wallet)
    setFormOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="text-[10px] font-medium tracking-wide text-muted-foreground">
        KEUANGAN INTERNAL / MANAJEMEN SALDO
      </div>

      <PageHeader
        title="Akun & Kartu"
        description={`${active.length} akun aktif · Total saldo ${formatIDR(summaryQuery.data?.totalBalance ?? 0)} · Data akun tersinkron`}
        actions={
          <>
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <ArrowLeftRight className="size-4" />
              Transfer Antar Akun
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Tambah Akun
            </Button>
          </>
        }
      />

      {walletsQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Akun Debit</h2>
              <span className="text-caption text-muted-foreground">
                {debit.length} akun
              </span>
            </div>
            {debit.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada akun debit. Tambahkan rekening, e-wallet, atau dompet tunai.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {debit.map((wallet) => (
                  <DebitAccountCard
                    key={wallet.id}
                    wallet={wallet}
                    onEdit={openEdit}
                    onArchive={archive}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-h2">Akun Kredit</h2>
              <span className="text-caption text-muted-foreground">
                {credit.length} akun
              </span>
            </div>
            {credit.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada kartu kredit atau paylater.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {credit.map((wallet) => (
                  <CreditAccountCard
                    key={wallet.id}
                    wallet={wallet}
                    onEdit={openEdit}
                    onArchive={archive}
                  />
                ))}
              </div>
            )}
          </section>

          {archived.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-h2">Akun Diarsipkan ({archived.length})</h2>
                <span className="text-caption text-muted-foreground">
                  Tidak dihitung dalam total keuangan
                </span>
              </div>
              <div className="space-y-2">
                {archived.map((wallet) => (
                  <ArchivedAccountRow
                    key={wallet.id}
                    wallet={wallet}
                    onRestore={restore}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base">Riwayat Transfer Antar Akun</CardTitle>
                <p className="text-caption text-muted-foreground">
                  Mutasi perpindahan dana antar akun internal
                </p>
              </div>
              <Link
                href="/transactions?type=TRANSFER"
                className="text-caption font-medium text-primary hover:underline"
              >
                Lihat semua mutasi
              </Link>
            </CardHeader>
            <CardContent>
              {transfersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : transfers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada transfer antar akun.
                </p>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Dari Akun</TableHead>
                          <TableHead>Ke Akun</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead className="text-right">Biaya Admin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transfers.map((transfer) => (
                          <TableRow key={transfer.id}>
                            <TableCell className="text-caption text-muted-foreground">
                              {formatTanggal(transfer.date)}
                            </TableCell>
                            <TableCell>{transfer.wallet?.name ?? "—"}</TableCell>
                            <TableCell>{transfer.transferWallet?.name ?? "—"}</TableCell>
                            <TableCell className="num text-right font-medium">
                              {formatIDR(transfer.amount)}
                            </TableCell>
                            <TableCell
                              className="text-right text-caption text-muted-foreground"
                              title="Biaya admin belum dicatat oleh backend"
                            >
                              —
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="space-y-2 md:hidden">
                    {transfers.map((transfer) => (
                      <div key={transfer.id} className="rounded-xl border border-border p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {transfer.wallet?.name ?? "—"}{" "}
                            <span className="text-muted-foreground">→</span>{" "}
                            {transfer.transferWallet?.name ?? "—"}
                          </p>
                          <p className="num text-sm font-semibold">
                            {formatIDR(transfer.amount)}
                          </p>
                        </div>
                        <p className="text-caption text-muted-foreground">
                          {formatTanggal(transfer.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {formOpen ? (
        <AccountFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setFormOpen(false)
              setEditing(null)
            }
          }}
          wallet={editing}
        />
      ) : null}

      {transferOpen ? (
        <TransferDialog
          open
          onOpenChange={setTransferOpen}
          wallets={active}
        />
      ) : null}
    </div>
  )
}
