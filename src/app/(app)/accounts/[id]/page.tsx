"use client"

import { use, useDeferredValue, useMemo, useState } from "react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { useQueries } from "@tanstack/react-query"
import {
  ArrowLeftRight,
  CreditCard,
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { ApiError } from "@/lib/api/client"
import { billsApi } from "@/lib/api/bills"
import type { Bill, BillPayment } from "@/lib/api/types/bill"
import type { Transaction, TransactionType } from "@/lib/api/types/transaction"
import { flattenCategories } from "@/lib/categories"
import { formatIDR, formatTanggal, monthRange, toISODate } from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { BILL_STATUS_LABELS } from "@/lib/types"
import {
  WALLET_TYPE_LABEL,
  daysUntil,
  installmentPortion,
  isLiability,
  maskedAccount,
  minimumPayment,
  nextDueDate,
  punctualityRate,
  statementPeriod,
  toWalletInput,
} from "@/lib/wallet"
import { useBills } from "@/hooks/use-bills"
import { useCategoryTree } from "@/hooks/use-categories"
import { useProfile } from "@/hooks/use-profile"
import {
  useDeleteTransaction,
  useTransactions,
} from "@/hooks/use-transactions"
import { useDownloadStatement } from "@/hooks/use-wallet-statement"
import {
  useDeleteWallet,
  useUpdateWallet,
  useWallet,
  useWallets,
} from "@/hooks/use-wallets"
import { CategoryIcon } from "@/components/category-icon"
import { AccountFormDialog } from "@/components/accounts/account-form-dialog"
import { CreditCardFace } from "@/components/accounts/credit-card-face"
import { InstallmentProgress } from "@/components/accounts/installment-progress"
import {
  PaymentHistoryTable,
  type PaymentHistoryRow,
} from "@/components/accounts/payment-history-table"
import { TransferDialog } from "@/components/accounts/transfer-dialog"
import { UtilizationDonut } from "@/components/accounts/utilization-donut"
import { BillPaymentDialog } from "@/components/bills/bill-payment-dialog"
import { DateRangeFilter } from "@/components/transactions/date-range-filter"
import { TransactionFormSheet } from "@/components/transactions/transaction-form-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const TYPE_CHIPS: { value: TransactionType | ""; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "EXPENSE", label: "Pengeluaran" },
  { value: "INCOME", label: "Pemasukan" },
]

const PAYMENT_HISTORY_MONTHS = 3

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <AccountDetailView id={id} />
}

function AccountDetailView({ id }: { id: string }) {
  const router = useRouter()
  const walletQuery = useWallet(id)
  const walletsQuery = useWallets(true)
  const billsQuery = useBills({ walletId: id, limit: 100 })
  const profileQuery = useProfile()
  const expenseTree = useCategoryTree("EXPENSE")
  const incomeTree = useCategoryTree("INCOME")

  const [tab, setTab] = useState<"transactions" | "bills" | "info">("transactions")
  const [type, setType] = useState<TransactionType | "">("")
  const [categoryId, setCategoryId] = useState("")
  const [installmentOnly, setInstallmentOnly] = useState(false)
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [limit, setLimit] = useState(25)
  const [range, setRange] = useState<{ from?: string; to?: string }>(() => {
    const now = new Date()
    return monthRange(now.getFullYear(), now.getMonth())
  })
  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<{
    bill: Bill
    preset: "full" | "minimum"
  } | null>(null)

  const updateWallet = useUpdateWallet()
  const deleteWallet = useDeleteWallet()
  const deleteTransaction = useDeleteTransaction()
  const downloadStatement = useDownloadStatement(walletQuery.data)

  const categories = useMemo(
    () => [
      ...flattenCategories(expenseTree.data ?? []),
      ...flattenCategories(incomeTree.data ?? []),
    ],
    [expenseTree.data, incomeTree.data],
  )

  const transactionsQuery = useTransactions({
    walletId: id,
    from: range.from,
    to: range.to,
    type,
    categoryId: categoryId || undefined,
    q: deferredSearch.trim() || undefined,
    limit,
    page: 1,
    sort: "-date",
  })

  const bills = useMemo(() => billsQuery.data?.items ?? [], [billsQuery.data])

  const paymentBillIds = useMemo(() => {
    const ids = new Set<string>()
    for (const bill of bills.slice(0, 10)) ids.add(bill.id)
    for (const bill of bills) {
      if (bill.installmentTotal) ids.add(bill.id)
    }
    return [...ids]
  }, [bills])

  const paymentQueries = useQueries({
    queries: paymentBillIds.map((billId) => ({
      queryKey: queryKeys.bills.payments(billId),
      queryFn: () => billsApi.payments(billId),
    })),
  })

  const wallet = walletQuery.data
  const transactions = useMemo(
    () => transactionsQuery.data?.items ?? [],
    [transactionsQuery.data],
  )

  if (walletQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (walletQuery.isError && walletQuery.error instanceof ApiError) {
    if (walletQuery.error.status === 404) notFound()
  }

  if (walletQuery.isError || !wallet) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">
            {walletQuery.error?.message ?? "Akun tidak ditemukan."}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => walletQuery.refetch()}>
              Coba lagi
            </Button>
            <Button
              variant="outline"
              render={<Link href="/accounts" />}
              nativeButton={false}
            >
              Kembali ke Akun
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const liability = isLiability(wallet.type)
  const creditLimit = wallet.creditLimit ?? 0
  const due = nextDueDate(wallet.dueDay)
  const period = statementPeriod(wallet.statementDay)
  const unpaid = bills.filter((bill) => bill.status !== "lunas")
  const totalDue = unpaid.length
    ? unpaid.reduce((sum, bill) => sum + bill.remainingAmount, 0)
    : wallet.balance
  const installmentRunning = installmentPortion(bills)
  const holderName = profileQuery.data
    ? `${profileQuery.data.firstName} ${profileQuery.data.lastName}`.trim()
    : undefined

  const walletsById = new Map<string, string>()
  for (const item of walletsQuery.data ?? []) walletsById.set(item.id, item.name)

  const paymentsByBillId = new Map<string, BillPayment[]>()
  paymentBillIds.forEach((billId, index) => {
    paymentsByBillId.set(billId, paymentQueries[index]?.data ?? [])
  })

  const installmentBills = bills.filter((bill) => bill.installmentTotal)
  const inlineBills = bills.filter((bill) => !bill.installmentTotal)

  const installmentByTransactionId = new Map<string, Bill>()
  for (const bill of installmentBills) {
    for (const payment of paymentsByBillId.get(bill.id) ?? []) {
      if (payment.transactionId) installmentByTransactionId.set(payment.transactionId, bill)
    }
  }

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - PAYMENT_HISTORY_MONTHS)
  const cutoffISO = toISODate(cutoff)

  const historyRows: PaymentHistoryRow[] = []
  for (const bill of bills) {
    for (const payment of paymentsByBillId.get(bill.id) ?? []) {
      if (payment.paidAt < cutoffISO) continue
      historyRows.push({
        id: payment.id,
        bill,
        description: bill.deskripsi || `Pembayaran ${bill.lender.name}`,
        paidAt: payment.paidAt,
        amount: payment.amount,
        note: payment.note,
        walletName: payment.walletId
          ? (walletsById.get(payment.walletId) ?? "—")
          : "—",
        status: payment.transactionId ? "Berhasil" : "Tercatat",
        onTime: payment.paidAt <= bill.dueDate,
      })
    }
  }
  historyRows.sort((a, b) => b.paidAt.localeCompare(a.paidAt))

  const punctuality = punctualityRate(
    historyRows.map((row) => ({ paidAt: row.paidAt, dueDate: row.bill.dueDate })),
  )
  const lastSettled = historyRows[0]

  const visibleTransactions = installmentOnly
    ? transactions.filter((transaction) =>
        installmentByTransactionId.has(transaction.id),
      )
    : transactions

  const groups = new Map<string, Transaction[]>()
  for (const transaction of visibleTransactions) {
    const items = groups.get(transaction.date) ?? []
    items.push(transaction)
    groups.set(transaction.date, items)
  }
  const transactionGroups = Array.from(groups.entries()).sort((a, b) =>
    b[0].localeCompare(a[0]),
  )

  function openPayment(bill: Bill, preset: "full" | "minimum") {
    setPaymentTarget({ bill, preset })
  }

  function handleDownloadStatement() {
    const now = new Date()
    const statementRange =
      liability && period
        ? { from: toISODate(period.start), to: toISODate(period.end) }
        : monthRange(now.getFullYear(), now.getMonth())

    downloadStatement.mutate(statementRange, {
      onSuccess: ({ count, truncated }) => {
        toast.success(`Statement ${count} transaksi diunduh`)
        if (truncated) {
          toast.warning("Statement dipotong. Persempit periode untuk hasil lengkap.")
        }
      },
      onError: (error) => toast.error(error.message),
    })
  }

  const handleToggleArchive = () => {
    const nextArchived = !wallet.isArchived
    updateWallet.mutate(
      { id: wallet.id, input: toWalletInput(wallet, { isArchived: nextArchived }) },
      {
        onSuccess: () =>
          toast.success(nextArchived ? "Akun diarsipkan" : "Akun dipulihkan"),
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const handleDeleteAccount = () => {
    deleteWallet.mutate(
      { id: wallet.id },
      {
        onSuccess: () => {
          toast.success("Akun dihapus")
          router.push("/accounts")
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            toast.error(
              "Akun ini punya transaksi. Arsipkan saja agar riwayat tetap aman.",
            )
            setDeleteOpen(false)
            return
          }
          toast.error(error.message)
        },
      },
    )
  }

  function handleDeleteTransaction() {
    if (!deleteTarget) return
    deleteTransaction.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Transaksi dihapus")
        setDeleteTarget(null)
      },
      onError: (error) => toast.error(error.message),
    })
  }

  const totalTransactions = transactionsQuery.data?.meta.total ?? 0
  const hasMore = transactionsQuery.data
    ? transactionsQuery.data.meta.total > transactions.length
    : false

  return (
    <div className="space-y-4">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-[10px] font-medium tracking-wide text-muted-foreground"
      >
        <Link href="/dashboard" className="hover:text-foreground">
          KEUANGAN
        </Link>
        <span>/</span>
        <Link href="/accounts" className="hover:text-foreground">
          AKUN &amp; KARTU
        </Link>
        <span>/</span>
        <span className="text-foreground">{wallet.name}</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-h1">{wallet.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
            <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">
              {WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
            </span>
            <span>{maskedAccount(wallet.accountNumber)}</span>
            <span>{wallet.currency}</span>
            {wallet.isExclude ? (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[#8a5a00]">
                Dikecualikan dari total
              </span>
            ) : null}
            {wallet.isArchived ? (
              <span className="rounded-full bg-muted px-2 py-0.5">Diarsipkan</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadStatement}
            disabled={downloadStatement.isPending}
            title="Unduh transaksi periode statement sebagai CSV (PDF belum tersedia)"
          >
            {downloadStatement.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Unduh statement
          </Button>
          <Button
            onClick={() => unpaid[0] && openPayment(unpaid[0], "full")}
            disabled={unpaid.length === 0}
          >
            <CreditCard className="size-4" />
            Bayar tagihan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Aksi akun" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                Ubah akun
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleArchive}>
                {wallet.isArchived ? "Pulihkan akun" : "Arsipkan akun"}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                Hapus akun
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {liability ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="space-y-2 p-4">
                <p className="text-caption text-muted-foreground">Kartu Utama</p>
                <CreditCardFace wallet={wallet} holderName={holderName} />
              </CardContent>
            </Card>

            <Metric
              label="Limit Platform"
              value={formatIDR(creditLimit)}
              caption="Limit kredit terdaftar"
            />
            <Metric
              label="Terpakai Saat Ini"
              value={formatIDR(wallet.used)}
              caption={`Statement aktif + cicilan ${formatIDR(installmentRunning)}`}
              tone="text-destructive"
            />
            <Metric
              label="Sisa Limit Tersedia"
              value={formatIDR(wallet.available)}
              caption={
                creditLimit > 0
                  ? `${Math.max(0, 100 - wallet.utilization).toFixed(1)}% kuota tersedia`
                  : "Limit belum diatur"
              }
              tone="text-success"
            />
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status Utilisasi Kredit</CardTitle>
              </CardHeader>
              <CardContent>
                <UtilizationDonut utilization={wallet.utilization} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Jatuh Tempo Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-caption">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
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
                <DueRow
                  label="Periode cetak tagihan"
                  value={
                    period
                      ? `${formatTanggal(toISODate(period.start))} – ${formatTanggal(toISODate(period.end))}`
                      : "—"
                  }
                />
                <DueRow
                  label="Total tagihan"
                  value={formatIDR(totalDue)}
                  valueClassName="text-destructive font-semibold"
                />
                <DueRow
                  label="Pembayaran minimum"
                  value={formatIDR(minimumPayment(totalDue))}
                />
                <DueRow
                  label="Suku bunga berjalan"
                  value={
                    wallet.interestRate != null
                      ? `${wallet.interestRate}% / bulan`
                      : "—"
                  }
                />
                <DueRow
                  label="Metode pembayaran"
                  value="Belum diatur · Segera hadir"
                />
                <DueRow
                  label="Tagihan terakhir lunas"
                  value={
                    lastSettled
                      ? `Dibayar ${formatTanggal(lastSettled.paidAt)}`
                      : "Belum ada pembayaran"
                  }
                />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Saldo Tersedia"
            value={formatIDR(wallet.balance)}
            caption={`${wallet.currency} · saldo tercatat`}
          />
          <Metric
            label="Saldo Awal"
            value={formatIDR(wallet.openingBalance)}
            caption="Saldo pembukaan akun"
          />
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-caption text-muted-foreground">Jenis Akun</p>
              <p className="text-lg font-semibold">
                {WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferOpen(true)}
              >
                <ArrowLeftRight className="size-3.5" />
                Transfer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Detail akun"
        className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1"
      >
        {(
          [
            ["transactions", `Transaksi (${totalTransactions})`],
            ["bills", `Tagihan & Cicilan (${bills.length})`],
            ["info", "Informasi"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
                {TYPE_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    aria-pressed={type === chip.value}
                    onClick={() => setType(chip.value)}
                    className={cn(
                      "min-h-7 rounded-lg px-2.5 text-caption font-medium transition-colors",
                      type === chip.value
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <Select
                items={[
                  { label: "Semua kategori", value: "" },
                  ...categories.map((category) => ({
                    label:
                      category.depth > 0 ? `— ${category.name}` : category.name,
                    value: category.id,
                  })),
                ]}
                value={categoryId}
                onValueChange={(value) => setCategoryId(value ?? "")}
              >
                <SelectTrigger className="h-9 w-full rounded-xl bg-card sm:w-44">
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

              <button
                type="button"
                aria-pressed={installmentOnly}
                disabled={installmentBills.length === 0}
                onClick={() => setInstallmentOnly((value) => !value)}
                title={
                  installmentBills.length === 0
                    ? "Belum ada tagihan dengan skema cicilan"
                    : undefined
                }
                className={cn(
                  "min-h-9 rounded-xl border px-3 text-caption font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  installmentOnly
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                Hanya cicilan
              </button>

              <DateRangeFilter
                from={range.from}
                to={range.to}
                onChange={setRange}
                className="w-full sm:w-auto"
              />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari transaksi…"
                aria-label="Cari transaksi"
                className="h-9 w-full rounded-xl sm:ml-auto sm:w-52"
              />
            </div>

            {transactionsQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : transactionsQuery.isError ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <p className="text-sm text-destructive">
                  {transactionsQuery.error.message}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => transactionsQuery.refetch()}
                >
                  Coba lagi
                </Button>
              </div>
            ) : transactionGroups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {installmentOnly
                  ? "Belum ada transaksi cicilan pada periode ini."
                  : "Belum ada transaksi pada akun ini untuk periode tersebut."}
              </p>
            ) : (
              <div className="space-y-3">
                {transactionGroups.map(([date, items]) => {
                  const dailyTotal = items.reduce(
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
                    <div
                      key={date}
                      className="overflow-hidden rounded-xl border border-border"
                    >
                      <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-1.5">
                        <span className="text-caption font-medium text-muted-foreground">
                          {formatTanggal(date)}{" "}
                          <span className="font-normal">· {items.length} transaksi</span>
                        </span>
                        <span
                          className={cn(
                            "num text-caption font-medium",
                            dailyTotal >= 0 ? "text-success" : "text-destructive",
                          )}
                        >
                          Total harian {formatIDR(dailyTotal)}
                        </span>
                      </div>

                      <ul>
                        {items.map((transaction) => {
                          const installmentBill = installmentByTransactionId.get(
                            transaction.id,
                          )

                          return (
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
                                  {installmentBill
                                    ? ` · Cicilan ${installmentBill.installmentIndex ?? 1}/${installmentBill.installmentTotal}`
                                    : ""}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  Sekarang tersedia:{" "}
                                  {formatIDR(
                                    liability ? wallet.available : wallet.balance,
                                  )}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "num shrink-0 text-sm font-medium",
                                  transaction.type === "INCOME" && "text-success",
                                  transaction.type === "EXPENSE" && "text-destructive",
                                  transaction.type === "TRANSFER" &&
                                    "text-muted-foreground",
                                )}
                              >
                                {transaction.type === "INCOME"
                                  ? "+"
                                  : transaction.type === "EXPENSE"
                                    ? "−"
                                    : ""}{" "}
                                {formatIDR(transaction.amount)}
                              </span>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label="Ubah transaksi"
                                  onClick={() => setEditTarget(transaction)}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  aria-label="Hapus transaksi"
                                  onClick={() => setDeleteTarget(transaction)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}

                {hasMore ? (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLimit((value) => value + 25)}
                      disabled={transactionsQuery.isFetching}
                    >
                      {transactionsQuery.isFetching ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : null}
                      Muat lebih banyak
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "bills" ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tagihan &amp; Cicilan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billsQuery.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : bills.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada tagihan yang dikaitkan ke akun ini.
              </p>
            ) : (
              <>
                {installmentBills.length > 0 ? (
                  <div className="space-y-2">
                    {installmentBills.map((bill) => (
                      <InstallmentProgress
                        key={bill.id}
                        bill={bill}
                        onPay={(target) => openPayment(target, "full")}
                      />
                    ))}
                  </div>
                ) : null}

                {inlineBills.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-caption text-muted-foreground">
                      Tagihan tanpa skema cicilan
                    </p>
                    {inlineBills.map((bill) => (
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
                            disabled={bill.remainingAmount <= 0}
                            onClick={() => openPayment(bill, "full")}
                          >
                            Bayar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
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
              <InfoRow
                label="Jenis"
                value={WALLET_TYPE_LABEL[wallet.type] ?? wallet.type}
              />
              <InfoRow
                label="Nomor rekening"
                value={maskedAccount(wallet.accountNumber)}
              />
              <InfoRow label="Mata uang" value={wallet.currency} />
              <InfoRow label="Saldo awal" value={formatIDR(wallet.openingBalance)} />
              <InfoRow label="Saldo saat ini" value={formatIDR(wallet.balance)} />
              {liability ? (
                <>
                  <InfoRow label="Limit kredit" value={formatIDR(creditLimit)} />
                  <InfoRow
                    label="Tanggal statement"
                    value={
                      wallet.statementDay ? `Tanggal ${wallet.statementDay}` : "—"
                    }
                  />
                  <InfoRow
                    label="Tanggal jatuh tempo"
                    value={wallet.dueDay ? `Tanggal ${wallet.dueDay}` : "—"}
                  />
                  <InfoRow
                    label="Bunga per bulan"
                    value={
                      wallet.interestRate != null ? `${wallet.interestRate}%` : "—"
                    }
                  />
                  <InfoRow label="Metode pembayaran" value="Belum diatur" />
                </>
              ) : null}
              <InfoRow
                label="Dikecualikan dari total"
                value={wallet.isExclude ? "Ya" : "Tidak"}
              />
              <InfoRow
                label="Status"
                value={wallet.isArchived ? "Diarsipkan" : "Aktif"}
              />
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {liability ? (
        <PaymentHistoryTable
          rows={historyRows}
          punctuality={punctuality}
          months={PAYMENT_HISTORY_MONTHS}
          onPay={openPayment}
        />
      ) : null}

      {editOpen ? (
        <AccountFormDialog open onOpenChange={setEditOpen} wallet={wallet} />
      ) : null}

      {transferOpen ? (
        <TransferDialog
          open
          onOpenChange={setTransferOpen}
          wallets={(walletsQuery.data ?? []).filter((item) => !item.isArchived)}
        />
      ) : null}

      {paymentTarget ? (
        <BillPaymentDialog
          key={`${paymentTarget.bill.id}-${paymentTarget.preset}`}
          open
          onOpenChange={(open) => {
            if (!open) setPaymentTarget(null)
          }}
          bill={paymentTarget.bill}
          preset={paymentTarget.preset}
        />
      ) : null}

      {editTarget ? (
        <TransactionFormSheet
          key={editTarget.id}
          open
          onOpenChange={(open) => {
            if (!open) setEditTarget(null)
          }}
          transaction={editTarget}
        />
      ) : null}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus transaksi?</DialogTitle>
            <DialogDescription>
              Transaksi akan dihapus dan saldo akun disesuaikan kembali. Tindakan
              ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTransaction}
              disabled={deleteTransaction.isPending}
            >
              {deleteTransaction.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus akun?</DialogTitle>
            <DialogDescription>
              Akun {wallet.name} akan dihapus permanen. Jika akun ini punya
              transaksi, gunakan arsip agar riwayat dan saldo tetap aman.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteWallet.isPending}
            >
              {deleteWallet.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Hapus akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({
  label,
  value,
  caption,
  tone,
}: {
  label: string
  value: string
  caption: string
  tone?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-caption text-muted-foreground">{label}</p>
        <p className={cn("num mt-1 text-xl font-semibold", tone)}>{value}</p>
        <p className="truncate text-caption text-muted-foreground">{caption}</p>
      </CardContent>
    </Card>
  )
}

function DueRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("num text-right", valueClassName)}>{value}</span>
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
