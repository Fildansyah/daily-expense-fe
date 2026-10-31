"use client"

import { useState } from "react"
import { ArrowLeftRight, Loader2, Repeat } from "lucide-react"
import { toast } from "sonner"

import type { Wallet } from "@/lib/api/types/wallet"
import { formatIDR, toISODate } from "@/lib/format"
import { useTransfer } from "@/hooks/use-wallets"
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

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallets: Wallet[]
}

export function TransferDialog({ open, onOpenChange, wallets }: TransferDialogProps) {
  const transfer = useTransfer()
  const [fromId, setFromId] = useState("")
  const [toId, setToId] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const value = Number(amount || 0)
  const walletItems = wallets.map((wallet) => ({
    label: `${wallet.name} · ${formatIDR(wallet.balance)}`,
    value: wallet.id,
  }))

  function submit() {
    if (!fromId) return setError("Pilih akun asal.")
    if (!toId) return setError("Pilih akun tujuan.")
    if (fromId === toId) return setError("Akun asal dan tujuan tidak boleh sama.")
    if (!value || value <= 0) return setError("Nominal transfer wajib diisi.")
    if (!date) return setError("Tanggal transfer wajib diisi.")

    setError(null)
    transfer.mutate(
      {
        walletId: fromId,
        transferWalletId: toId,
        amount: value,
        date,
        memo: note.trim() || "Transfer antar akun",
        note: "",
      },
      {
        onSuccess: () => {
          toast.success("Transfer berhasil dicatat")
          onOpenChange(false)
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-primary" />
            Transfer Antar Akun
          </DialogTitle>
          <DialogDescription>
            Pindahkan saldo antar akun tanpa mengubah total kekayaan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-label">Dari akun</span>
            <Select
              items={walletItems}
              value={fromId}
              onValueChange={(next) => setFromId(next ?? "")}
            >
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue placeholder="Pilih akun asal" />
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

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFromId(toId)
                setToId(fromId)
              }}
            >
              <Repeat className="size-4" />
              Tukar arah
            </Button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-label">Ke akun</span>
            <Select
              items={walletItems}
              value={toId}
              onValueChange={(next) => setToId(next ?? "")}
            >
              <SelectTrigger className="h-10 w-full rounded-xl">
                <SelectValue placeholder="Pilih akun tujuan" />
              </SelectTrigger>
              <SelectContent>
                {wallets
                  .filter((wallet) => wallet.id !== fromId)
                  .map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name} · {formatIDR(wallet.balance)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-label">Nominal</span>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                value={amount ? new Intl.NumberFormat("id-ID").format(value) : ""}
                onChange={(event) =>
                  setAmount(event.target.value.replace(/\D/g, "").slice(0, 15))
                }
                inputMode="numeric"
                placeholder="0"
                className="h-10 rounded-xl pl-9"
              />
            </div>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-label">Tanggal</span>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 rounded-xl"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-label">Catatan</span>
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="opsional"
                className="h-10 rounded-xl"
              />
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={transfer.isPending}>
            {transfer.isPending ? <Loader2 className="animate-spin" /> : null}
            Transfer Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
