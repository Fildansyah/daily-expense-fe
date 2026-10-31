import { ReceiptText } from "lucide-react"

import type { Bill } from "@/lib/api/types/bill"
import { formatIDR, formatTanggal } from "@/lib/format"
import { Button } from "@/components/ui/button"

interface InstallmentProgressProps {
  bill: Bill
  onPay: (bill: Bill) => void
}

export function InstallmentProgress({ bill, onPay }: InstallmentProgressProps) {
  const total = bill.installmentTotal ?? 0
  const index = bill.installmentIndex ?? 1
  const progress = total > 0 ? Math.min(100, (index / total) * 100) : 0
  const monthly = total > 0 ? bill.amount / total : bill.amount

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {bill.lender.name}
            <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
              Cicilan {index}/{total}
            </span>
          </p>
          <p className="truncate text-caption text-muted-foreground">
            {bill.deskripsi || "Cicilan"} · jatuh tempo {formatTanggal(bill.dueDate)}
          </p>
        </div>
        <p className="num text-sm font-semibold">{formatIDR(monthly)}/bulan</p>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-caption text-muted-foreground">
        <span className="num">
          Sisa {formatIDR(bill.remainingAmount)} dari {formatIDR(bill.amount)}
        </span>
        <Button size="sm" variant="outline" onClick={() => onPay(bill)}>
          <ReceiptText className="size-3.5" />
          Bayar
        </Button>
      </div>
    </div>
  )
}
