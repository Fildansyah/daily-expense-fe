import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

import { formatIDR, formatTanggal } from "@/lib/format"
import type { Bill } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/bill-table"

interface BillCardProps {
  bill: Bill
  onDelete?: (bill: Bill) => void
  showActions?: boolean
}

export function BillCard({ bill, onDelete, showActions = true }: BillCardProps) {
  return (
    <Card className="md:hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium capitalize">{bill.lender}</p>
            <p className="text-sm text-muted-foreground">{bill.deskripsi}</p>
          </div>
          <StatusBadge status={bill.status} />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Tagihan</p>
            <p className="text-sm font-medium tabular-nums">{formatIDR(bill.amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Terbayar</p>
            <p className="text-sm font-medium tabular-nums">
              {formatIDR(bill.paidAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Sisa</p>
            <p
              className={`text-sm font-medium tabular-nums ${
                bill.remainingAmount > 0 ? "text-destructive" : ""
              }`}
            >
              {formatIDR(bill.remainingAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Jatuh tempo: {formatTanggal(bill.dueDate)}
          </p>
          {showActions && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                nativeButton={false}
                render={<Link href={`/bills/${bill.id}/edit`} aria-label="Ubah" />}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Hapus"
                onClick={() => onDelete?.(bill)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
