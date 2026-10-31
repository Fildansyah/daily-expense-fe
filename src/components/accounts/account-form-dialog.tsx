"use client"

import { useMemo, useState } from "react"
import {
  Banknote,
  Briefcase,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  PiggyBank,
  Smartphone,
  Wallet as WalletIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Wallet, WalletInput } from "@/lib/api/types/wallet"
import { flattenCategories } from "@/lib/categories"
import { formatIDR, formatNumberInput, toISODate } from "@/lib/format"
import {
  WALLET_COLORS,
  WALLET_TYPE_LABEL,
  balanceAdjustment,
  toWalletInput,
} from "@/lib/wallet"
import { useCategoryTree } from "@/hooks/use-categories"
import { useCreateTransaction } from "@/hooks/use-transactions"
import { useCreateWallet, useUpdateWallet } from "@/hooks/use-wallets"
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

type AccountKind = "cash" | "bank" | "ewallet" | "credit"

const TYPES: {
  value: AccountKind
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    value: "cash",
    label: "Tunai",
    description: "Uang fisik & dompet harian",
    icon: Banknote,
  },
  {
    value: "bank",
    label: "Bank",
    description: "Rekening tabungan & giro",
    icon: Landmark,
  },
  {
    value: "ewallet",
    label: "E-wallet",
    description: "GoPay, OVO, DANA, ShopeePay",
    icon: Smartphone,
  },
  {
    value: "credit",
    label: "Kartu Kredit / PayLater",
    description: "Fasilitas kredit & cicilan",
    icon: CreditCard,
  },
]

const ICONS: Record<string, LucideIcon> = {
  wallet: WalletIcon,
  landmark: Landmark,
  smartphone: Smartphone,
  banknote: Banknote,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  briefcase: Briefcase,
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallet?: Wallet | null
}

export function AccountFormDialog({
  open,
  onOpenChange,
  wallet,
}: AccountFormDialogProps) {
  const isEdit = Boolean(wallet)
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const createTransaction = useCreateTransaction()

  const [kind, setKind] = useState<AccountKind>(() => {
    if (!wallet) return "bank"
    return wallet.type === "credit_card" || wallet.type === "paylater"
      ? "credit"
      : (wallet.type as AccountKind)
  })
  const [creditKind, setCreditKind] = useState<"credit_card" | "paylater">(
    wallet?.type === "paylater" ? "paylater" : "credit_card",
  )
  const [name, setName] = useState(wallet?.name ?? "")
  const [accountNumber, setAccountNumber] = useState(wallet?.accountNumber ?? "")
  const [openingBalance, setOpeningBalance] = useState(
    wallet ? String(Math.round(wallet.openingBalance)) : "0",
  )
  const [balanceInput, setBalanceInput] = useState(
    wallet ? String(Math.round(wallet.balance)) : "",
  )
  const [balanceMode, setBalanceMode] = useState<"transaction" | "opening">(
    "transaction",
  )
  const [adjustmentCategoryId, setAdjustmentCategoryId] = useState("")
  const [creditLimit, setCreditLimit] = useState(
    wallet?.creditLimit != null ? String(Math.round(wallet.creditLimit)) : "",
  )
  const [statementDay, setStatementDay] = useState(
    wallet?.statementDay != null ? String(wallet.statementDay) : "",
  )
  const [dueDay, setDueDay] = useState(
    wallet?.dueDay != null ? String(wallet.dueDay) : "",
  )
  const [interestRate, setInterestRate] = useState(
    wallet?.interestRate != null ? String(wallet.interestRate) : "",
  )
  const [isExclude, setIsExclude] = useState(wallet?.isExclude ?? false)
  const [color, setColor] = useState(wallet?.color ?? WALLET_COLORS[0])
  const [icon, setIcon] = useState(wallet?.icon ?? "wallet")
  const [error, setError] = useState<string | null>(null)

  const pending =
    createWallet.isPending ||
    updateWallet.isPending ||
    createTransaction.isPending
  const PreviewIcon = ICONS[icon] ?? WalletIcon

  const balanceDelta = wallet ? Number(balanceInput || 0) - wallet.balance : 0
  const adjustment = wallet ? balanceAdjustment(wallet.type, balanceDelta) : null
  const adjustmentTree = useCategoryTree(adjustment?.type ?? "EXPENSE")
  const adjustmentCategories = useMemo(
    () =>
      flattenCategories(adjustmentTree.data ?? []).filter(
        (category) => category.depth === 0,
      ),
    [adjustmentTree.data],
  )
  const defaultAdjustmentCategoryId =
    adjustmentCategories.find((category) =>
      /penyesuaian|adjust|lainnya|other|saldo/i.test(category.name),
    )?.id ??
    adjustmentCategories[0]?.id ??
    ""
  const effectiveAdjustmentCategoryId =
    adjustmentCategoryId || defaultAdjustmentCategoryId

  async function submit() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Nama akun wajib diisi.")
      return
    }

    const opening = Number(openingBalance || 0)
    if (!isEdit && (!Number.isFinite(opening) || opening < 0)) {
      setError("Saldo awal tidak valid.")
      return
    }

    let actualBalance = 0
    if (wallet) {
      actualBalance = Number(balanceInput || 0)
      if (!Number.isFinite(actualBalance) || actualBalance < 0) {
        setError("Saldo sesuai kenyataan tidak valid.")
        return
      }
    }

    let limit: number | null = null
    if (kind === "credit") {
      limit = Number(creditLimit || 0)
      if (!Number.isFinite(limit) || limit <= 0) {
        setError("Limit kredit wajib diisi untuk kartu kredit/paylater.")
        return
      }
    }

    const statement = statementDay ? Number(statementDay) : null
    const due = dueDay ? Number(dueDay) : null
    if (statement != null && (statement < 1 || statement > 28)) {
      setError("Tanggal statement harus antara 1 dan 28.")
      return
    }
    if (due != null && (due < 1 || due > 28)) {
      setError("Tanggal jatuh tempo harus antara 1 dan 28.")
      return
    }

    const rate = interestRate ? Number(interestRate.replace(",", ".")) : null
    if (rate != null && (!Number.isFinite(rate) || rate < 0)) {
      setError("Bunga per bulan tidak valid.")
      return
    }

    const delta = wallet ? actualBalance - wallet.balance : 0
    const adjustment = wallet ? balanceAdjustment(wallet.type, delta) : null

    if (wallet && delta !== 0 && balanceMode === "transaction") {
      if (!adjustment) {
        setError("Selisih saldo tidak valid.")
        return
      }
      if (!effectiveAdjustmentCategoryId) {
        setError("Pilih kategori untuk transaksi penyesuaian saldo.")
        return
      }
    }

    const base = wallet
      ? toWalletInput(wallet)
      : {
          name: "",
          type: "bank" as WalletInput["type"],
          currency: "IDR",
          isArchived: false,
        }

    const resolvedOpening = wallet
      ? balanceMode === "opening"
        ? wallet.openingBalance + delta
        : wallet.openingBalance
      : opening

    const input: WalletInput = {
      ...base,
      name: trimmedName,
      type: kind === "credit" ? creditKind : kind,
      openingBalance: resolvedOpening,
      accountNumber: accountNumber.trim(),
      color,
      icon,
      isExclude,
      creditLimit: kind === "credit" ? limit : null,
      statementDay: kind === "credit" ? statement : null,
      dueDay: kind === "credit" ? due : null,
      interestRate: kind === "credit" ? rate : null,
    }

    setError(null)

    if (!wallet) {
      createWallet.mutate(input, {
        onSuccess: () => {
          toast.success("Akun ditambahkan")
          onOpenChange(false)
        },
        onError: (mutationError) => setError(mutationError.message),
      })
      return
    }

    try {
      await updateWallet.mutateAsync({ id: wallet.id, input })

      if (delta !== 0 && balanceMode === "transaction" && adjustment) {
        await createTransaction.mutateAsync({
          type: adjustment.type,
          amount: adjustment.amount,
          walletId: wallet.id,
          categoryId: effectiveAdjustmentCategoryId,
          memo: "Penyesuaian saldo akun",
          note: `Saldo ${formatIDR(wallet.balance)} → ${formatIDR(actualBalance)}`,
          date: toISODate(new Date()),
        })
      }

      toast.success("Akun diperbarui")
      onOpenChange(false)
    } catch (mutationError) {
      setError((mutationError as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ubah Akun" : "Tambah Akun"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data akun. Selisih saldo bisa dicatat sebagai transaksi atau disesuaikan ke saldo awal."
              : "Saldo awal tidak dihitung sebagai pemasukan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
              TIPE AKUN
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TYPES.map((type) => {
                const active = kind === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setKind(type.value)
                      setError(null)
                    }}
                    aria-pressed={active}
                    className={cn(
                      "relative flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      active
                        ? "border-primary bg-accent/60"
                        : "border-border bg-card hover:bg-muted/50",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <type.icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{type.label}</span>
                      <span className="block text-caption text-muted-foreground">
                        {type.description}
                      </span>
                    </span>
                    {active ? (
                      <Check className="absolute top-2 right-2 size-4 text-primary" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          {kind === "credit" ? (
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              {(["credit_card", "paylater"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCreditKind(option)}
                  aria-pressed={creditKind === option}
                  className={cn(
                    "min-h-8 flex-1 rounded-lg text-label transition-colors",
                    creditKind === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {WALLET_TYPE_LABEL[option]}
                </button>
              ))}
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-label">
              Nama Akun <span className="text-destructive">*</span>
            </span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="mis. BCA Tahapan Baru"
              className="h-10 rounded-xl"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-label">Nomor Rekening (opsional)</span>
            <Input
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Contoh: 882928371 atau •••• 4821"
              className="h-10 rounded-xl"
            />
            <span className="block text-caption text-muted-foreground">
              Format nomor: gunakan •••• 4821 untuk menyamarkan nomor kartu.
            </span>
          </label>

          {isEdit && wallet ? (
            <div className="space-y-3 rounded-xl border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="text-label">Saldo Tercatat</span>
                  <div className="num flex h-10 items-center rounded-xl bg-muted/60 px-3 text-sm">
                    {formatIDR(wallet.balance)}
                  </div>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-label">Saldo Sesuai Kenyataan</span>
                  <div className="relative">
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      value={formatNumberInput(balanceInput)}
                      onChange={(event) =>
                        setBalanceInput(
                          event.target.value.replace(/\D/g, "").slice(0, 15),
                        )
                      }
                      inputMode="numeric"
                      placeholder="0"
                      aria-label="Saldo sesuai kenyataan"
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                </label>
              </div>

              {balanceDelta !== 0 ? (
                <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Selisih saldo</span>
                    <span
                      className={cn(
                        "num text-sm font-semibold",
                        balanceDelta > 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      {balanceDelta > 0 ? "+" : "−"}{" "}
                      {formatIDR(Math.abs(balanceDelta))}
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <button
                      type="button"
                      aria-pressed={balanceMode === "transaction"}
                      onClick={() => setBalanceMode("transaction")}
                      className={cn(
                        "rounded-xl border p-2.5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        balanceMode === "transaction"
                          ? "border-primary bg-accent/60"
                          : "border-border bg-card hover:bg-muted/50",
                      )}
                    >
                      <span className="block text-sm font-medium">
                        Catat selisih sebagai transaksi
                      </span>
                      <span className="block text-caption text-muted-foreground">
                        {adjustment
                          ? `${adjustment.type === "INCOME" ? "Pemasukan" : "Pengeluaran"} ${formatIDR(adjustment.amount)} masuk ke laporan; saldo awal tidak berubah.`
                          : ""}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-pressed={balanceMode === "opening"}
                      onClick={() => setBalanceMode("opening")}
                      className={cn(
                        "rounded-xl border p-2.5 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        balanceMode === "opening"
                          ? "border-primary bg-accent/60"
                          : "border-border bg-card hover:bg-muted/50",
                      )}
                    >
                      <span className="block text-sm font-medium">
                        Ubah saldo awal
                      </span>
                      <span className="block text-caption text-muted-foreground">
                        Saldo awal menjadi{" "}
                        {formatIDR(wallet.openingBalance + balanceDelta)} tanpa
                        membuat transaksi.
                      </span>
                    </button>
                  </div>

                  {balanceMode === "transaction" ? (
                    <label className="block space-y-1.5">
                      <span className="text-label">Kategori penyesuaian</span>
                      <Select
                        items={adjustmentCategories.map((category) => ({
                          label: category.name,
                          value: category.id,
                        }))}
                        value={effectiveAdjustmentCategoryId}
                        onValueChange={(value) =>
                          setAdjustmentCategoryId(value ?? "")
                        }
                      >
                        <SelectTrigger className="h-10 w-full rounded-xl">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {adjustmentCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {adjustmentCategories.length === 0 ? (
                        <span className="block text-caption text-destructive">
                          Belum ada kategori. Buat kategori terlebih dahulu di
                          halaman Kategori.
                        </span>
                      ) : null}
                    </label>
                  ) : null}
                </div>
              ) : (
                <p className="text-caption text-muted-foreground">
                  Saldo sudah sesuai. Saldo awal tetap{" "}
                  {formatIDR(wallet.openingBalance)}.
                </p>
              )}
            </div>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-label">Saldo Awal</span>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  Rp
                </span>
                <Input
                  value={formatNumberInput(openingBalance)}
                  onChange={(event) =>
                    setOpeningBalance(
                      event.target.value.replace(/\D/g, "").slice(0, 15),
                    )
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <span className="block text-caption text-muted-foreground">
                Penyesuaian saldo nanti dicatat sebagai transaksi terpisah.
              </span>
            </label>
          )}

          {kind === "credit" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-label">Limit Kredit</span>
                <div className="relative">
                  <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    value={formatNumberInput(creditLimit)}
                    onChange={(event) =>
                      setCreditLimit(event.target.value.replace(/\D/g, "").slice(0, 15))
                    }
                    inputMode="numeric"
                    placeholder="0"
                    className="h-10 rounded-xl pl-9"
                  />
                </div>
              </label>
              <label className="space-y-1.5">
                <span className="text-label">Bunga per Bulan (%)</span>
                <Input
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                  inputMode="decimal"
                  placeholder="2,25"
                  className="h-10 rounded-xl"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-label">Tanggal Cetak Statement</span>
                <Input
                  value={statementDay}
                  onChange={(event) =>
                    setStatementDay(event.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  inputMode="numeric"
                  placeholder="1–28"
                  className="h-10 rounded-xl"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-label">Tanggal Jatuh Tempo</span>
                <Input
                  value={dueDay}
                  onChange={(event) =>
                    setDueDay(event.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  inputMode="numeric"
                  placeholder="1–28"
                  className="h-10 rounded-xl"
                />
              </label>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">Kecualikan dari total saldo</p>
              <p className="text-caption text-muted-foreground">
                Tetap tampil di daftar, tapi tidak dihitung ke total dan laporan.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isExclude}
              onClick={() => setIsExclude((value) => !value)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isExclude ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                  isExclude ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-label">Ikon &amp; Warna Akun</p>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                <PreviewIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name || "Nama akun"}</p>
                <p className="text-caption text-muted-foreground">
                  {WALLET_TYPE_LABEL[kind === "credit" ? creditKind : kind]}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {WALLET_COLORS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`Warna ${value}`}
                  onClick={() => setColor(value)}
                  className={cn(
                    "size-7 rounded-full border-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    color === value ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: value }}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ICONS).map(([key, Icon]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Ikon ${key}`}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    icon === key
                      ? "border-primary bg-accent text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : null}
            Simpan Akun
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
