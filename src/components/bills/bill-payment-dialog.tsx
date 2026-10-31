"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Loader2, Wallet as WalletIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Bill } from "@/lib/api/types/bill"
import { flattenCategories } from "@/lib/categories"
import { formatIDR, toISODate } from "@/lib/format"
import { useAddPayment } from "@/hooks/use-bills"
import { useCategoryTree } from "@/hooks/use-categories"
import { useWallets } from "@/hooks/use-wallets"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BillPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: Bill
  preset?: "full" | "minimum"
}

export function BillPaymentDialog({
  open,
  onOpenChange,
  bill,
  preset = "full",
}: BillPaymentDialogProps) {
  const addPayment = useAddPayment()
  const walletsQuery = useWallets()
  const categoriesQuery = useCategoryTree("EXPENSE")

  const wallets = walletsQuery.data ?? []
  const categories = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  )

  const minimumAmount = Math.min(
    bill.remainingAmount,
    Math.max(50_000, Math.round(bill.remainingAmount * 0.05)),
  )

  const [amount, setAmount] = useState(() => {
    const initial = preset === "minimum" ? minimumAmount : bill.remainingAmount
    return initial > 0 ? String(Math.round(initial)) : ""
  })
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState(bill.categoryId ?? "")
  const [paidAt, setPaidAt] = useState(() => toISODate(new Date()))
  const [note, setNote] = useState("")
  const [createTransaction, setCreateTransaction] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const amountValue = Number(amount || 0)
  const effectiveWalletId = walletId || wallets[0]?.id || ""
  const walletItems = wallets.map((wallet) => ({
    label: `${wallet.name} · ${formatIDR(wallet.balance)}`,
    value: wallet.id,
  }))
  const categoryItems = [
    { label: "Pilih kategori…", value: "none" },
    ...categories.map((category) => ({
      label: category.depth > 0 ? `— ${category.name}` : category.name,
      value: category.id,
    })),
  ]
  const remainingAfter = Math.max(0, bill.amount - bill.paidAmount - amountValue)
  const quickAmounts = Array.from(
    new Set([
      Math.round(bill.remainingAmount),
      Math.round(bill.remainingAmount / 2),
      minimumAmount,
    ]),
  ).filter((value) => value > 0 && value <= bill.remainingAmount)

  function submit() {
    if (!amountValue || amountValue <= 0) {
      return setError("Nominal pembayaran wajib diisi.")
    }
    if (amountValue > bill.remainingAmount) {
      return setError("Pembayaran melebihi sisa tagihan.")
    }
    if (createTransaction && !effectiveWalletId) {
      return setError("Pilih akun sumber dana.")
    }
    if (createTransaction && !categoryId) {
      return setError("Pilih kategori pengeluaran untuk transaksi otomatis.")
    }
    if (!paidAt) return setError("Tanggal pembayaran wajib diisi.")

    setError(null)
    addPayment.mutate(
      {
        billId: bill.id,
        input: {
          amount: amountValue,
          paidAt,
          walletId: effectiveWalletId || null,
          note: note.trim(),
          createTransaction,
          categoryId: createTransaction ? categoryId : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Pembayaran tercatat")
          onOpenChange(false)
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptTitleIcon />
            Bayar Tagihan {bill.lender.name}
          </DialogTitle>
          <DialogDescription>
            {bill.deskripsi || "Tagihan"}
            {bill.installmentTotal ? ` · Angsuran ke-${bill.installmentIndex ?? 1}` : ""}
            {" · "}Sisa {formatIDR(bill.remainingAmount)}
          </DialogDescription>
        </DialogHeader>

        {bill.remainingAmount <= 0 ? (
          <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-6 text-center">
            <CheckCircle2 className="mx-auto size-8 text-success" />
            <p className="mt-2 text-sm font-medium text-success">
              Tagihan ini sudah lunas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-caption text-muted-foreground">Nominal Pembayaran</p>
              <div className="relative mt-1">
                <span className="absolute top-1/2 left-0 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                  Rp
                </span>
                <input
                  value={
                    amount ? new Intl.NumberFormat("id-ID").format(amountValue) : ""
                  }
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/\D/g, "").slice(0, 15))
                  }
                  inputMode="numeric"
                  aria-label="Nominal pembayaran"
                  className="num h-12 w-full bg-transparent pl-10 text-2xl font-bold outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors",
                      amountValue === value
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {value === Math.round(bill.remainingAmount)
                      ? "Bayar penuh"
                      : value === minimumAmount
                        ? "Minimum"
                        : "50%"}{" "}
                    {formatIDR(value)}
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-label">Sumber Dana / Rekening</span>
              <Select
                items={walletItems}
                value={effectiveWalletId}
                onValueChange={(value) => setWalletId(value ?? "")}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
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
            </label>

            <label className="block space-y-1.5">
              <span className="text-label">Tanggal Pembayaran</span>
              <Input
                type="date"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
                className="h-10 rounded-xl"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-label">Catatan (opsional)</span>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="mis. Pelunasan sisa angsuran"
                className="h-10 rounded-xl"
              />
            </label>

            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Buat transaksi pengeluaran</p>
                  <p className="text-caption text-muted-foreground">
                    Saldo akun akan otomatis berkurang.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={createTransaction}
                  onClick={() => setCreateTransaction((value) => !value)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    createTransaction ? "bg-primary" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                      createTransaction ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </div>

              {createTransaction ? (
                <label className="mt-3 block space-y-1.5">
                  <span className="text-label">Kategori pengeluaran</span>
                  <Select
                    items={categoryItems}
                    value={categoryId || "none"}
                    onValueChange={(value) =>
                      setCategoryId(!value || value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Pilih kategori…</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.depth > 0 ? `— ${category.name}` : category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}
            </div>

            <div className="rounded-xl border border-success/30 bg-success/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" />
                  <div>
                    <p className="text-sm font-medium text-success">
                      {remainingAfter === 0 ? "Lunas setelah transaksi ini" : "Pembayaran sebagian"}
                    </p>
                    <p className="text-caption text-success/80">
                      Sisa tagihan setelah pembayaran
                    </p>
                  </div>
                </div>
                <p className="num text-lg font-semibold text-success">
                  {formatIDR(remainingAfter)}
                </p>
              </div>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={submit}
            disabled={addPayment.isPending || bill.remainingAmount <= 0}
          >
            {addPayment.isPending ? <Loader2 className="animate-spin" /> : <WalletIcon className="size-4" />}
            Konfirmasi Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReceiptTitleIcon() {
  return (
    <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <WalletIcon className="size-3.5" />
    </span>
  )
}
