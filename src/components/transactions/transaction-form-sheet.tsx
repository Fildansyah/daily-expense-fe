"use client"

import { useState } from "react"
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Loader2, Repeat } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Category } from "@/lib/api/types/category"
import type { Transaction, TransactionType } from "@/lib/api/types/transaction"
import { formatIDR, formatNumberInput, toISODate } from "@/lib/format"
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions"
import { useCategoryTree } from "@/hooks/use-categories"
import { useWallets } from "@/hooks/use-wallets"
import { CategoryPicker } from "@/components/transactions/category-picker"
import { WALLET_TYPE_LABELS, WalletIcon } from "@/components/wallet-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const TYPES: {
  value: TransactionType
  label: string
  icon: typeof ArrowUpRight
}[] = [
  { value: "EXPENSE", label: "Pengeluaran", icon: ArrowUpRight },
  { value: "INCOME", label: "Pemasukan", icon: ArrowDownLeft },
  { value: "TRANSFER", label: "Transfer", icon: ArrowLeftRight },
]

const QUICK_MEMOS = [
  "Makan siang",
  "Bensin / parkir",
  "Belanja bulanan",
  "Tagihan listrik",
]

interface TransactionFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  initialDate?: string
}

export function TransactionFormSheet({
  open,
  onOpenChange,
  transaction,
  initialDate,
}: TransactionFormSheetProps) {
  const isEdit = Boolean(transaction)
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const walletsQuery = useWallets()
  const expenseTree = useCategoryTree("EXPENSE")
  const incomeTree = useCategoryTree("INCOME")

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "EXPENSE")
  const [amount, setAmount] = useState(
    transaction ? String(Math.round(transaction.amount)) : "",
  )
  const [categoryId, setCategoryId] = useState(transaction?.category?.id ?? "")
  const [walletId, setWalletId] = useState(transaction?.wallet?.id ?? "")
  const [transferWalletId, setTransferWalletId] = useState(
    transaction?.transferWallet?.id ?? "",
  )
  const [date, setDate] = useState(
    transaction?.date ?? initialDate ?? toISODate(new Date()),
  )
  const [memo, setMemo] = useState(transaction?.memo ?? "")
  const [error, setError] = useState<string | null>(null)

  const wallets = walletsQuery.data ?? []
  const walletItems = wallets.map((wallet) => ({
    label: `${wallet.name} · ${formatIDR(wallet.balance)}`,
    value: wallet.id,
  }))
  const categories: Category[] =
    (type === "INCOME" ? incomeTree.data : expenseTree.data) ?? []

  const pending = createTransaction.isPending || updateTransaction.isPending
  const amountValue = Number(amount || 0)
  const displayAmount = formatNumberInput(amount)

  function changeType(next: TransactionType) {
    if (next !== type) {
      setCategoryId("")
    }
    setType(next)
    setError(null)
    if (next === "TRANSFER") {
      setCategoryId("")
    } else {
      setTransferWalletId("")
    }
  }

  function validate(): string | null {
    if (!amount || amountValue <= 0) return "Nominal transaksi wajib diisi."
    if (!walletId) return "Pilih akun sumber dana."
    if (type !== "TRANSFER" && !categoryId) return "Pilih kategori transaksi."
    if (type === "TRANSFER") {
      if (!transferWalletId) return "Pilih akun tujuan transfer."
      if (transferWalletId === walletId) return "Akun asal dan tujuan tidak boleh sama."
    }
    if (!date) return "Tanggal transaksi wajib diisi."
    return null
  }

  function submit(keepOpen = false) {
    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setError(null)
    const input = {
      type,
      amount: amountValue,
      walletId,
      transferWalletId: type === "TRANSFER" ? transferWalletId : null,
      categoryId: type === "TRANSFER" ? null : categoryId,
      date,
      memo: memo.trim(),
      note: "",
    }

    const onSuccess = () => {
      toast.success(isEdit ? "Transaksi diperbarui" : "Transaksi disimpan")
      if (keepOpen) {
        setAmount("")
        setMemo("")
        setCategoryId("")
        setError(null)
        return
      }
      onOpenChange(false)
    }

    const onError = (mutationError: Error) => {
      setError(mutationError.message)
    }

    if (transaction) {
      updateTransaction.mutate(
        { id: transaction.id, input },
        { onSuccess, onError },
      )
    } else {
      createTransaction.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-[500px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Ubah Transaksi" : "Tambah Transaksi"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Perubahan akan menyesuaikan saldo akun secara otomatis."
              : "Saldo akun akan otomatis disesuaikan setelah disimpan."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => changeType(item.value)}
                aria-pressed={type === item.value}
                className={cn(
                  "flex min-h-9 items-center justify-center gap-1.5 rounded-lg text-label transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  type === item.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-label text-muted-foreground">Nominal transaksi</p>
              <span className="text-caption text-muted-foreground">IDR (Rupiah)</span>
            </div>
            <div className="relative mt-2">
              <span className="absolute top-1/2 left-0 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                Rp
              </span>
              <input
                value={displayAmount}
                onChange={(event) =>
                  setAmount(
                    event.target.value.replace(/\D/g, "").slice(0, 12),
                  )
                }
                inputMode="numeric"
                placeholder="0"
                aria-label="Nominal transaksi"
                className="num h-14 w-full bg-transparent pl-12 text-3xl font-bold outline-none placeholder:text-muted-foreground/40"
              />
            </div>
            <p className="text-caption text-muted-foreground">
              {amountValue > 0
                ? formatIDR(amountValue)
                : "Masukkan nominal tanpa titik atau koma."}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          {type !== "TRANSFER" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-label">Kategori transaksi</label>
                <span className="text-caption text-muted-foreground">
                  {categories.length} kategori
                </span>
              </div>
              <CategoryPicker
                categories={categories}
                value={categoryId}
                onChange={(id) => setCategoryId(id)}
                placeholder={
                  expenseTree.isLoading || incomeTree.isLoading
                    ? "Memuat kategori…"
                    : "Pilih kategori"
                }
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-label">
              {type === "TRANSFER" ? "Dari akun" : "Akun / sumber dana"}
            </label>
            <Select
              items={walletItems}
              value={walletId}
              onValueChange={(value) => setWalletId(value ?? "")}
            >
              <SelectTrigger className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name} · {formatIDR(wallet.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "TRANSFER" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-label">Ke akun</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setWalletId(transferWalletId)
                    setTransferWalletId(walletId)
                  }}
                >
                  <Repeat className="size-3.5" />
                  Tukar
                </Button>
              </div>
              <Select
                items={walletItems}
                value={transferWalletId}
                onValueChange={(value) => setTransferWalletId(value ?? "")}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Pilih akun tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter((wallet) => wallet.id !== walletId)
                    .map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} · {formatIDR(wallet.balance)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3">
            <label className="space-y-1.5">
              <span className="text-label">Tanggal transaksi</span>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-11 rounded-xl bg-card"
              />
            </label>
          </div>

          {walletId ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-caption text-muted-foreground">
              <WalletIcon
                type={wallets.find((wallet) => wallet.id === walletId)?.type}
              />
              <span>
                {wallets.find((wallet) => wallet.id === walletId)?.name} ·{" "}
                {WALLET_TYPE_LABELS[
                  wallets.find((wallet) => wallet.id === walletId)?.type ?? ""
                ] ?? "Akun"}
              </span>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-label" htmlFor="transaction-memo">
              Catatan / deskripsi
            </label>
            <Input
              id="transaction-memo"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              placeholder="mis. Kopi Kenangan – kopi susu"
              className="h-11 rounded-xl bg-card"
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MEMOS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMemo(item)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-caption text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="space-y-2">
          <Button className="h-11 w-full rounded-xl" onClick={() => submit(false)} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            {isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
          </Button>
          {!isEdit ? (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => submit(true)}
              disabled={pending}
            >
              Simpan &amp; Tambah Lagi
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
