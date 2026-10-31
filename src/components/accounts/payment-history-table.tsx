import type { Bill } from "@/lib/api/types/bill"
import { formatIDR, formatTanggal } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface PaymentHistoryRow {
  id: string
  bill: Bill
  description: string
  paidAt: string
  amount: number
  note: string
  walletName: string
  status: "Berhasil" | "Tercatat"
  onTime: boolean
}

interface PaymentHistoryTableProps {
  rows: PaymentHistoryRow[]
  punctuality: number | null
  months: number
  onPay: (bill: Bill, preset: "full" | "minimum") => void
}

export function PaymentHistoryTable({
  rows,
  punctuality,
  months,
  onPay,
}: PaymentHistoryTableProps) {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">Riwayat Pembayaran Tagihan</CardTitle>
          <p className="text-caption text-muted-foreground">
            Cuplikan pembayaran kartu {months} bulan terakhir
          </p>
        </div>
        {punctuality != null ? (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            {punctuality}% Tepat Waktu
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Belum ada pembayaran tercatat pada akun ini.
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <caption className="sr-only">
                    Riwayat pembayaran tagihan pada akun ini
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal Pembayaran</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Sumber Dana</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-caption text-muted-foreground">
                          {formatTanggal(row.paidAt)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{row.note || row.description}</p>
                          <p className="text-caption text-muted-foreground">
                            {row.bill.lender.name}
                            {row.onTime ? "" : " · terlambat"}
                          </p>
                        </TableCell>
                        <TableCell className="text-caption text-muted-foreground">
                          {row.walletName}
                        </TableCell>
                        <TableCell className="num text-right font-medium">
                          {formatIDR(row.amount)}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={row.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <PaymentActions bill={row.bill} onPay={onPay} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <ul className="space-y-2 md:hidden">
              {rows.map((row) => (
                <li key={row.id} className="rounded-xl border border-border p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {row.note || row.description}
                      </p>
                      <p className="truncate text-caption text-muted-foreground">
                        {formatTanggal(row.paidAt)} · {row.walletName}
                      </p>
                    </div>
                    <p className="num text-sm font-semibold">{formatIDR(row.amount)}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <StatusChip status={row.status} />
                    <PaymentActions bill={row.bill} onPay={onPay} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StatusChip({ status }: { status: PaymentHistoryRow["status"] }) {
  return (
    <span
      className={
        status === "Berhasil"
          ? "rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success"
          : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
      }
    >
      {status}
    </span>
  )
}

function PaymentActions({
  bill,
  onPay,
}: {
  bill: Bill
  onPay: PaymentHistoryTableProps["onPay"]
}) {
  const paid = bill.remainingAmount <= 0

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="xs"
        variant="outline"
        disabled={paid}
        onClick={() => onPay(bill, "minimum")}
      >
        Bayar
      </Button>
      <Button size="xs" disabled={paid} onClick={() => onPay(bill, "full")}>
        Lunasi
      </Button>
    </div>
  )
}
