import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"

import { cn } from "cn"
import { formatIDR, formatTanggal } from "@/lib/format"
import {
  BILL_STATUS_LABELS,
  type Bill,
  type BillStatus,
} from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_VARIANT: Record<BillStatus, "destructive" | "secondary" | "outline"> = {
  belum_bayar: "destructive",
  sebagian: "secondary",
  lunas: "outline",
}

export function StatusBadge({ status }: { status: BillStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{BILL_STATUS_LABELS[status]}</Badge>
}

interface BillTableProps {
  bills: Bill[]
  onDelete?: (bill: Bill) => void
  showActions?: boolean
}

export function BillTable({ bills, onDelete, showActions = true }: BillTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-lg border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Lender</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead className="w-32">Jatuh Tempo</TableHead>
            <TableHead className="w-32 text-right">Tagihan</TableHead>
            <TableHead className="w-32 text-right">Terbayar</TableHead>
            <TableHead className="w-32 text-right">Sisa</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-20 text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id} className="group">
              <TableCell className="font-medium capitalize">{bill.lender}</TableCell>
              <TableCell className="max-w-52 truncate">{bill.deskripsi}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatTanggal(bill.dueDate)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatIDR(bill.amount)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatIDR(bill.paidAmount)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums font-medium",
                  bill.remainingAmount > 0 && "text-destructive",
                )}
              >
                {formatIDR(bill.remainingAmount)}
              </TableCell>
              <TableCell>
                <StatusBadge status={bill.status} />
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={
                        <Link href={`/bills/${bill.id}/edit`} aria-label="Ubah" />
                      }
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
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
