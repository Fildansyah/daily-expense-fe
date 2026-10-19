"use client"

import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { formatIDR, formatTanggal } from "@/lib/format"
import type { Bill } from "@/lib/types"
import { useDeleteBill } from "@/hooks/use-bills"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteBillDialogProps {
  bill: Bill | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteBillDialog({ bill, open, onOpenChange }: DeleteBillDialogProps) {
  const deleteBill = useDeleteBill()

  function confirm() {
    if (!bill) return
    deleteBill.mutate(bill.id, {
      onSuccess: () => {
        toast.success("Tagihan dihapus")
        onOpenChange(false)
      },
      onError: (err: Error) => toast.error(err.message),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!deleteBill.isPending}>
        <DialogHeader>
          <DialogTitle>Hapus tagihan?</DialogTitle>
          <DialogDescription>
            {bill && (
              <>
                <span className="font-medium capitalize">{bill.lender}</span> —{" "}
                {bill.deskripsi} ({formatIDR(bill.amount)}, jatuh tempo{" "}
                {formatTanggal(bill.dueDate)}). Tindakan ini tidak dapat dibatalkan.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteBill.isPending}
          >
            Batal
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={deleteBill.isPending}>
            {deleteBill.isPending && <Loader2 className="animate-spin" />}
            <Trash2 />
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
