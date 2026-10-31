"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Loader2, ReceiptText } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Bill, BillInput } from "@/lib/api/types/bill"
import { flattenCategories } from "@/lib/categories"
import { formatIDR, formatNumberInput, toISODate } from "@/lib/format"
import { useCategoryTree } from "@/hooks/use-categories"
import {
  useCreateBill,
  useLenders,
  useUpdateBill,
} from "@/hooks/use-bills"
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

interface BillFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill?: Bill | null
}

export function BillFormDialog({ open, onOpenChange, bill }: BillFormDialogProps) {
  const isEdit = Boolean(bill)
  const createBill = useCreateBill()
  const updateBill = useUpdateBill()
  const lendersQuery = useLenders()
  const walletsQuery = useWallets()
  const categoriesQuery = useCategoryTree("EXPENSE")

  const [lenderId, setLenderId] = useState(bill?.lenderId ?? "")
  const [deskripsi, setDeskripsi] = useState(bill?.deskripsi ?? "")
  const [amount, setAmount] = useState(
    bill ? String(Math.round(bill.amount)) : "",
  )
  const [paidAmount, setPaidAmount] = useState(
    bill ? String(Math.round(bill.paidAmount)) : "0",
  )
  const [dueDate, setDueDate] = useState(bill?.dueDate ?? toISODate(new Date()))
  const [walletId, setWalletId] = useState(bill?.walletId ?? "")
  const [categoryId, setCategoryId] = useState(bill?.categoryId ?? "")
  const [installment, setInstallment] = useState(Boolean(bill?.installmentTotal))
  const [installmentTotal, setInstallmentTotal] = useState(
    bill?.installmentTotal ? String(bill.installmentTotal) : "12",
  )
  const [interestRate, setInterestRate] = useState(
    bill?.interestRate != null ? String(bill.interestRate) : "",
  )
  const [remindH3, setRemindH3] = useState(bill?.remindH3 ?? true)
  const [remindH1, setRemindH1] = useState(bill?.remindH1 ?? true)
  const [remindDue, setRemindDue] = useState(bill?.remindDue ?? true)
  const [error, setError] = useState<string | null>(null)

  const categories = useMemo(
    () => flattenCategories(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  )
  const wallets = walletsQuery.data ?? []
  const lenderItems = (lendersQuery.data ?? []).map((lender) => ({
    label: lender.name,
    value: lender.id,
  }))
  const walletItems = [
    { label: "Tanpa akun", value: "" },
    ...wallets.map((wallet) => ({
      label: `${wallet.name} · ${formatIDR(wallet.balance)}`,
      value: wallet.id,
    })),
  ]
  const categoryItems = [
    { label: "Tanpa kategori", value: "none" },
    ...categories.map((category) => ({
      label: category.depth > 0 ? `— ${category.name}` : category.name,
      value: category.id,
    })),
  ]
  const tenorItems = [3, 6, 9, 12, 18, 24, 36].map((option) => ({
    label: `${option} bulan`,
    value: String(option),
  }))

  const amountValue = Number(amount || 0)
  const paidValue = Number(paidAmount || 0)
  const tenor = Number(installmentTotal || 0)
  const monthly = installment && tenor > 0 ? amountValue / tenor : 0
  const remaining = Math.max(0, amountValue - paidValue)
  const pending = createBill.isPending || updateBill.isPending

  function submit() {
    if (!lenderId) return setError("Pilih pemberi pinjaman.")
    if (!deskripsi.trim()) return setError("Deskripsi tagihan wajib diisi.")
    if (!amountValue || amountValue <= 0) {
      return setError("Nominal tagihan wajib diisi minimal Rp 1.")
    }
    if (paidValue < 0) return setError("Sudah dibayar tidak boleh negatif.")
    if (paidValue > amountValue) {
      return setError("Sudah dibayar tidak boleh melebihi jumlah tagihan.")
    }
    if (!dueDate) return setError("Tanggal jatuh tempo wajib diisi.")
    if (installment) {
      if (!tenor || tenor <= 0) return setError("Tenor cicilan harus lebih dari 0.")
      if (bill?.installmentIndex && bill.installmentIndex > tenor) {
        return setError("Angsuran ke- tidak boleh melebihi tenor.")
      }
    }

    const input: BillInput = {
      lenderId,
      amount: amountValue,
      paidAmount: paidValue,
      dueDate,
      deskripsi: deskripsi.trim(),
      walletId: walletId || null,
      categoryId: categoryId || null,
      installmentTotal: installment ? tenor : null,
      installmentIndex: installment ? (bill?.installmentIndex ?? 1) : null,
      interestRate:
        installment && interestRate ? Number(interestRate.replace(",", ".")) : null,
      remindH3,
      remindH1,
      remindDue,
      currency: "IDR",
    }

    setError(null)
    const onSuccess = () => {
      toast.success(isEdit ? "Tagihan diperbarui" : "Tagihan dicatat")
      onOpenChange(false)
    }
    const onError = (mutationError: Error) => setError(mutationError.message)

    if (bill) {
      updateBill.mutate({ id: bill.id, data: input }, { onSuccess, onError })
    } else {
      createBill.mutate(input, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="size-4 text-primary" />
            {isEdit ? "Ubah Tagihan" : "Catat Tagihan Baru"}
          </DialogTitle>
          <DialogDescription>
            Catat tagihan kredit, pinjaman, atau cicilan bulanan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-label">
                Pemberi Pinjaman / Vendor <span className="text-destructive">*</span>
              </span>
              <Select
                items={lenderItems}
                value={lenderId}
                onValueChange={(value) => setLenderId(value ?? "")}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue placeholder="Pilih lender" />
                </SelectTrigger>
                <SelectContent>
                  {(lendersQuery.data ?? []).map((lender) => (
                    <SelectItem key={lender.id} value={lender.id}>
                      {lender.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-label">
                Deskripsi Tagihan <span className="text-destructive">*</span>
              </span>
              <Input
                value={deskripsi}
                onChange={(event) => setDeskripsi(event.target.value)}
                placeholder="mis. iPhone 15 Pro Max 256GB"
                className="h-10 rounded-xl"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-label">
                Jumlah Tagihan Pokok <span className="text-destructive">*</span>
              </span>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  value={formatNumberInput(amount)}
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/\D/g, "").slice(0, 15))
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-label">Sudah Dibayar (DP / Awal)</span>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  value={formatNumberInput(paidAmount)}
                  onChange={(event) =>
                    setPaidAmount(
                      event.target.value.replace(/\D/g, "").slice(0, 15),
                    )
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-label">
                Jatuh Tempo <span className="text-destructive">*</span>
              </span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </label>

            <label className="space-y-1.5">
              <span className="text-label">Kaitkan ke Akun / Kartu</span>
              <Select
                items={walletItems}
                value={walletId}
                onValueChange={(value) => setWalletId(value ?? "")}
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue placeholder="Opsional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tanpa akun</SelectItem>
                  {(walletsQuery.data ?? []).map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name} · {formatIDR(wallet.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-label">Kategori Tagihan (opsional)</span>
              <Select
                items={categoryItems}
                value={categoryId || "none"}
                onValueChange={(value) =>
                  setCategoryId(!value || value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl">
                  <SelectValue placeholder="Tanpa kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.depth > 0 ? `— ${category.name}` : category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="block text-caption text-muted-foreground">
                Dipakai otomatis saat pembayaran dicatat sebagai transaksi.
              </span>
            </label>
          </div>

          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Aktifkan Skema Cicilan/Angsuran</p>
                <p className="text-caption text-muted-foreground">
                  Membagi total tagihan menjadi angsuran bulanan.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={installment}
                onClick={() => setInstallment((value) => !value)}
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  installment ? "bg-primary" : "bg-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                    installment ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </div>

            {installment ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="text-label">Tenor</span>
                    <Select
                      items={tenorItems}
                      value={installmentTotal}
                      onValueChange={(value) => setInstallmentTotal(value ?? "12")}
                    >
                      <SelectTrigger className="h-10 w-full rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 6, 9, 12, 18, 24, 36].map((tenorOption) => (
                          <SelectItem key={tenorOption} value={String(tenorOption)}>
                            {tenorOption} bulan
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-label">Bunga / tahun (%)</span>
                    <Input
                      value={interestRate}
                      onChange={(event) => setInterestRate(event.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                      className="h-10 rounded-xl"
                    />
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-label">Cicilan / bulan</span>
                    <div className="flex h-10 items-center rounded-xl border border-border bg-muted/50 px-3">
                      <span className="num text-sm font-semibold">
                        {formatIDR(monthly)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-accent/60 px-3 py-2 text-caption">
                  Simulasi: {tenor || 0} × {formatIDR(monthly)} = total komitmen{" "}
                  <span className="num font-medium">
                    {formatIDR(monthly * (tenor || 0))}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-caption">
              <input
                type="checkbox"
                checked={remindH3}
                onChange={(event) => setRemindH3(event.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Ingatkan H-3 sebelum jatuh tempo
            </label>
            <label className="flex items-center gap-2 text-caption">
              <input
                type="checkbox"
                checked={remindH1}
                onChange={(event) => setRemindH1(event.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Ingatkan H-1 sebelum jatuh tempo
            </label>
            <label className="flex items-center gap-2 text-caption">
              <input
                type="checkbox"
                checked={remindDue}
                onChange={(event) => setRemindDue(event.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Ingatkan pada hari jatuh tempo
            </label>
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

        <DialogFooter className="items-center">
          <div className="mr-auto">
            <p className="text-caption text-muted-foreground">Sisa Komitmen</p>
            <p className="num text-sm font-semibold">{formatIDR(remaining)}</p>
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Simpan Tagihan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
