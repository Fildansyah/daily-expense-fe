"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import {
  CreditCard,
  Download,
  ReceiptText,
} from "lucide-react"
import { cn } from "cn"

import type { Bill } from "@/lib/api/types/bill"
import { BILL_STATUS_LABELS } from "@/lib/types"
import { flattenCategories } from "@/lib/categories"
import {
  formatIDR,
  formatTanggal,
  monthRange,
  toISODate,
} from "@/lib/format"
import {
  WALLET_TYPE_LABEL,
  daysUntil,
  isLiability,
  maskedAccount,
  minimumPayment,
  nextDueDate,
  statementPeriod,
  utilizationBand,
} from "@/lib/wallet"
import { useBills, usePayments } from "@/hooks/use-bills"
import { useCategoryTree } from "@/hooks/use-categories"
import { useTransactions } from "@/hooks/use-transactions"
import { useWallet, useWallets } from "@/hooks/use-wallets"
import { CategoryIcon } from "@/components/category-icon"
import { AccountFormDialog } from "@/components/accounts/account-form-dialog"
import { DateRangeFilter } from "@/components/transactions/date-range-filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <AccountDetailView id={id} />
}

function AccountDetailView({ id }: { id: string }) {
  const walletQuery = useWallet(id)
  const walletsQuery = useWallets(true)
  const billsQuery = useBills({ walletId: id, limit: 50 })
  const expenseTree = useCategoryTree("EXPENSE")
  const incomeTree = useCategoryTree("INCOME")

  const [tab, setTab] = useState<"transactions" | "bills" | "info">("transactions")
  const [editOpen, setEditOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => {
    const now = new Date()
    return monthRange(now.getFullYear(), now.getMonth())
  })

  const categories = useMemo(
    () => [
      ...flattenCategories(expenseTree.data ?? []),
      ...flattenCategories(incomeTree.data ?? []),
    ],
    [expenseTree.data, incomeTree.data],
  )
  const categoryItems = [
    { label: "Semua kategori", value: "" },
    ...categories.map((category) => ({
      label: category.depth > 0 ? `— ${category.name}` : category.name,
      value: category.id,
    })),
  ]

  const transactionsQuery = useTransactions({
    walletId: id,
    from: range.from,
    to: range.to,
    categoryId: categoryId || undefined,
    q: search.trim() || undefined,
    limit: 50,
    sort: "-date",
  })

  const wallet = walletQuery.data
  const bills = billsQuery.data?.items ?? []
  const transactions = useMemo(
    () => transactionsQuery.data?.items ?? [],
    [transactionsQuery.data?.items],
  )
  const transactionTotal = transactionsQuery.data?.meta.total ?? transactions.length
  const paidBills = bills.filter((bill) => bill.paidAmount > 0).slice(0, 10)
  const walletsById = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of walletsQuery.data ?? []) map.set(item.id, item.name)
    return map
  }, [walletsQuery.data])

  const groups = useMemo(() => {
    const map = new Map<string, typeof transactions>()
    for (const transaction of transactions) {
      const items = map.get(transaction.date) ?? []
      items.push(transaction)
      map.set(transaction.date, items)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions])

  if (walletQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (walletQuery.isError || !wallet) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">
            {walletQuery.error?.message ?? "Akun tidak ditemukan."}
          </p>
          <Button variant="outline" render={<Link href="/accounts" />} nativeButton={false}>
            Kembali ke Akun
          </Button>
        </CardContent>
      </Card>
    )
  }

  const liability = isLiability(wallet.type)
  const limit = wallet.creditLimit ?? 0
  const due = nextDueDate(wallet.dueDay)
  const period = statementPeriod(wallet.statementDay)
  const unpaid = bills.filter((bill) => bill.status !== "lunas")
  const totalDue = unpaid.length
    ? unpaid.reduce((sum, bill) => sum + bill.remainingAmount, 0)
    : wallet.balance
  const band = utilizationBand(wallet.utilization)
  const bandColor =
    band === "kritis"
      ? "var(--destructive)"
      : band === "waspada"
        ? "var(--warning)"
        : "var(--primary)"

  const gradient = liability
    ? `conic-gradient(${bandColor} 0% ${Math.min(100, wallet.utilization)}%, var(--muted) ${Math.min(100, wallet.utilization)}% 100%)`
    : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium tracking-wide text-muted-foreground">
        <Link href="/accounts" className="hover:text-foreground">
          KEUANGAN INTERNAL
        </Link>
        <span>/</span>
        <Link href="/accounts" className="hover:text-foreground">
          AKUN &amp; KARTU
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1">{wallet.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
              {WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
            </span>
            <span>{maskedAccount(wallet.accountNumber)}</span>
            {wallet.isExclude ? (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[#8a5a00]">
                Dikecualikan dari total
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Ubah Akun
          </Button>
          <Button
            variant="outline"
            disabled
            title="Endpoint statement belum tersedia"
          >
            <Download className="size-4" />
            Unduh Statement
          </Button>
          <Button
            render={
              <Link href={unpaid[0] ? `/bills/${unpaid[0].id}` : "/bills"} />
            }
            nativeButton={false}
          >
            <CreditCard className="size-4" />
            Bayar Tagihan
          </Button>
        </div>
      </div>

      {liability ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground">Kartu Utama</p>
                <div
                  className="mt-2 rounded-xl bg-primary p-3 text-primary-foreground"
                  style={{ backgroundColor: wallet.color || undefined }}
                >
                  <p className="text-[10px] tracking-widest opacity-80">
                    {WALLET_TYPE_LABEL[wallet.type]?.toUpperCase()}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">{wallet.name}</p>
                  <p className="num mt-3 text-sm tracking-[0.18em]">
                    •••• {wallet.accountNumber?.replace(/\D/g, "").slice(-4) || "••••"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground">Limit Piutang</p>
                <p className="num mt-1 text-xl font-semibold">{formatIDR(limit)}</p>
                <p className="text-caption text-muted-foreground">Limit kredit terdaftar</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground">Terpakai Saat Ini</p>
                <p className="num mt-1 text-xl font-semibold text-destructive">
                  {formatIDR(wallet.used)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {limit > 0 ? ((wallet.used / limit) * 100).toFixed(1) : "0"}% dari limit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-caption text-muted-foreground">Sisa Limit Tersedia</p>
                <p className="num mt-1 text-xl font-semibold text-success">
                  {formatIDR(wallet.available)}
                </p>
                <p className="text-caption text-muted-foreground">
                  {limit > 0 ? (100 - wallet.utilization).toFixed(1) : "0"}% tersedia
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status Utilisasi Kredit</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 sm:flex-row">
                <div
                  className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
                  style={{ background: gradient }}
                  role="img"
                  aria-label={`Utilisasi ${wallet.utilization}%`}
                >
                  <div className="flex size-20 flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-[10px] text-muted-foreground">TERPAKAI</span>
                    <span className="num text-sm font-semibold">
                      {wallet.utilization.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5 text-caption">
                  <p className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-success" />
                    Sehat (&lt;40%) · {band === "sehat" ? "kondisi saat ini" : ""}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-warning" />
                    Waspada (40–70%)
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-destructive" />
                    Kritis (≥70%)
                  </p>
                  <p className="pt-1 text-muted-foreground">
                    {band === "sehat"
                      ? "Rekomendasi: kondisi aman. Jaga pemakaian di bawah 40%."
                      : band === "waspada"
                        ? "Rekomendasi: kurangi pemakaian sebelum mendekati limit."
                        : "Rekomendasi: segera bayar sebagian untuk menurunkan utilisasi."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Jatuh Tempo Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-caption">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {due ? formatTanggal(toISODate(due)) : "—"}
                  </span>
                  {due ? (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[#8a5a00]">
                      {daysUntil(due) >= 0
                        ? `${daysUntil(due)} hari lagi`
                        : `Terlambat ${Math.abs(daysUntil(due))} hari`}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Periode cetak</span>
                  <span>
                    {period
                      ? `${formatTanggal(toISODate(period.start))} – ${formatTanggal(toISODate(period.end))}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total tagihan</span>
                  <span className="num font-semibold text-destructive">
                    {formatIDR(totalDue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pembayaran minimum</span>
                  <span className="num">{formatIDR(minimumPayment(totalDue))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bunga / bulan</span>
                  <span>{wallet.interestRate != null ? `${wallet.interestRate}%` : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Autodebit</span>
                  <span className="text-muted-foreground">Belum diatur</span>
                </div>
                <p className="pt-1 text-muted-foreground">
                  Pengaturan autodebit dan bukti pembayaran tersedia setelah endpoint
                  backend terkait siap.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-caption text-muted-foreground">Saldo Tersedia</p>
              <p className="num mt-1 text-xl font-semibold">{formatIDR(wallet.balance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-caption text-muted-foreground">Saldo Awal</p>
              <p className="num mt-1 text-xl font-semibold">
                {formatIDR(wallet.openingBalance)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-caption text-muted-foreground">Jenis Akun</p>
              <p className="mt-1 text-lg font-semibold">
                {WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
        {(
          [
            ["transactions", `Transaksi (${transactionTotal})`],
            ["bills", `Tagihan & Cicilan (${bills.length})`],
            ["info", "Informasi & Pengaturan"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={cn(
              "min-h-8 rounded-lg px-3 text-label transition-colors",
              tab === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "transactions" ? (
        <Card>
          <CardContent className="space-y-3 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <DateRangeFilter
                from={range.from}
                to={range.to}
                onChange={setRange}
              />
              <Select
                items={categoryItems}
                value={categoryId}
                onValueChange={(value) => setCategoryId(value ?? "")}
              >
                <SelectTrigger className="h-9 w-full rounded-xl bg-card">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.depth > 0 ? `— ${category.name}` : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari transaksi…"
                className="h-9 rounded-xl"
              />
            </div>

            {transactionsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : transactionsQuery.isError ? (
              <p className="py-6 text-center text-sm text-destructive">
                {transactionsQuery.error.message}
              </p>
            ) : transactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada transaksi pada akun ini untuk periode tersebut.
              </p>
            ) : (
              <div className="space-y-3">
                {groups.map(([date, items]) => {
                  const total = items.reduce(
                    (sum, item) =>
                      sum +
                      (item.type === "INCOME"
                        ? item.amount
                        : item.type === "EXPENSE"
                          ? -item.amount
                          : 0),
                    0,
                  )
                  return (
                    <div key={date} className="overflow-hidden rounded-xl border border-border">
                      <div className="flex items-center justify-between bg-muted/40 px-3 py-1.5">
                        <span className="text-caption font-medium text-muted-foreground">
                          {formatTanggal(date)}{" "}
                          <span className="font-normal">· {items.length} transaksi</span>
                        </span>
                        <span
                          className={cn(
                            "num text-caption font-medium",
                            total >= 0 ? "text-success" : "text-destructive",
                          )}
                        >
                          {formatIDR(total)}
                        </span>
                      </div>
                      <ul>
                        {items.map((transaction) => (
                          <li
                            key={transaction.id}
                            className="flex items-center gap-2 border-t border-border/60 px-3 py-2"
                          >
                            <CategoryIcon
                              icon={transaction.category?.icon}
                              color={transaction.category?.bgColor}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">
                                {transaction.memo ||
                                  transaction.category?.name ||
                                  "Transaksi"}
                              </p>
                              <p className="truncate text-caption text-muted-foreground">
                                {transaction.category?.name ?? "Tanpa kategori"} ·{" "}
                                {transaction.wallet?.name ?? "—"}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "num text-sm font-medium",
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
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "bills" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-warning" />
              Tagihan Terkait Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bills.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada tagihan yang dikaitkan ke akun ini.
              </p>
            ) : (
              bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {bill.lender.name}
                      <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                        {BILL_STATUS_LABELS[bill.status]}
                      </span>
                    </p>
                    <p className="truncate text-caption text-muted-foreground">
                      {bill.deskripsi || "Tagihan"} · jatuh tempo{" "}
                      {formatTanggal(bill.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-sm font-semibold">
                      {formatIDR(bill.remainingAmount)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
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
      ) : null}

      {tab === "info" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <InfoRow label="Nama akun" value={wallet.name} />
              <InfoRow label="Jenis" value={WALLET_TYPE_LABEL[wallet.type] ?? wallet.type} />
              <InfoRow label="Nomor rekening" value={maskedAccount(wallet.accountNumber)} />
              <InfoRow label="Mata uang" value={wallet.currency} />
              <InfoRow label="Saldo awal" value={formatIDR(wallet.openingBalance)} />
              <InfoRow
                label="Saldo saat ini"
                value={formatIDR(wallet.balance)}
              />
              {liability ? (
                <>
                  <InfoRow label="Limit kredit" value={formatIDR(limit)} />
                  <InfoRow
                    label="Tanggal statement"
                    value={wallet.statementDay ? `Tanggal ${wallet.statementDay}` : "—"}
                  />
                  <InfoRow
                    label="Tanggal jatuh tempo"
                    value={wallet.dueDay ? `Tanggal ${wallet.dueDay}` : "—"}
                  />
                  <InfoRow
                    label="Bunga per bulan"
                    value={wallet.interestRate != null ? `${wallet.interestRate}%` : "—"}
                  />
                </>
              ) : null}
              <InfoRow label="Dikecualikan dari total" value={wallet.isExclude ? "Ya" : "Tidak"} />
              <InfoRow label="Status" value={wallet.isArchived ? "Diarsipkan" : "Aktif"} />
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {liability ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Riwayat Pembayaran Tagihan</CardTitle>
            <p className="text-caption text-muted-foreground">
              Pembayaran yang tercatat melalui endpoint pembayaran tagihan.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Pembayaran</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Sumber Dana</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Belum ada tagihan pada akun ini.
                    </TableCell>
                  </TableRow>
                ) : paidBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                      Belum ada pembayaran tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  paidBills.map((bill) => (
                    <PaymentRows
                      key={bill.id}
                      bill={bill}
                      walletsById={walletsById}
                    />
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {editOpen ? (
        <AccountFormDialog
          open
          onOpenChange={setEditOpen}
          wallet={wallet}
        />
      ) : null}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function PaymentRows({
  bill,
  walletsById,
}: {
  bill: Bill
  walletsById: Map<string, string>
}) {
  const paymentsQuery = usePayments(bill.id)
  const payments = paymentsQuery.data ?? []

  if (payments.length === 0) return null

  return (
    <>
      {payments.map((payment) => (
        <TableRow key={payment.id}>
          <TableCell className="text-caption text-muted-foreground">
            {formatTanggal(payment.paidAt)}
          </TableCell>
          <TableCell>
            {payment.note || `Pembayaran ${bill.lender.name}`}
          </TableCell>
          <TableCell className="text-caption text-muted-foreground">
            {payment.walletId ? walletsById.get(payment.walletId) ?? "—" : "—"}
          </TableCell>
          <TableCell className="num text-right font-medium">
            {formatIDR(payment.amount)}
          </TableCell>
          <TableCell>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              {payment.transactionId ? "Berhasil" : "Tercatat"}
            </span>
          </TableCell>
          <TableCell>
            <Button
              size="xs"
              variant="outline"
              render={<Link href={`/bills/${bill.id}`} />}
              nativeButton={false}
            >
              Bayar
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
