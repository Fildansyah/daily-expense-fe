"use client"

import { useMemo, useState } from "react"
import { Download, ListFilter } from "lucide-react"

import { useBillSummary, useBills } from "@/hooks/use-bills"
import { exportBillsCSV } from "@/lib/export"
import { formatIDR, monthRange } from "@/lib/format"
import {
  currentPeriod,
  PeriodFilter,
  type PeriodValue,
} from "@/components/period-filter"
import { SummaryCards } from "@/components/summary-cards"
import { BillTable } from "@/components/bill-table"
import { BillCard } from "@/components/bill-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ReportingPage() {
  const [period, setPeriod] = useState<PeriodValue>(currentPeriod)

  const filters = useMemo(() => {
    if (period.year == null || period.month == null) return {}
    const { from, to } = monthRange(period.year, period.month)
    return { from, to }
  }, [period])

  const summary = useBillSummary(filters)
  const bills = useBills(filters)

  const periodLabel =
    period.year != null && period.month != null
      ? `${period.year}-${String(period.month + 1).padStart(2, "0")}`
      : "semua-periode"

  const totalRow = summary.data?.perLender.reduce(
    (acc, row) => ({
      count: acc.count + row.count,
      total: acc.total + row.total,
      paid: acc.paid + row.paid,
      remaining: acc.remaining + row.remaining,
    }),
    { count: 0, total: 0, paid: 0, remaining: 0 },
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reporting</h1>
          <p className="text-sm text-muted-foreground">
            Laporan tagihan kredit &amp; paylater
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <SummaryCards data={summary.data} loading={summary.isLoading} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListFilter className="size-4 text-muted-foreground" />
            Ringkasan per Lender
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : summary.isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat data: {summary.error.message}
            </p>
          ) : !summary.data || summary.data.perLender.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada tagihan pada periode ini.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lender</TableHead>
                      <TableHead className="w-20 text-right">Transaksi</TableHead>
                      <TableHead className="w-36 text-right">Total</TableHead>
                      <TableHead className="w-36 text-right">Terbayar</TableHead>
                      <TableHead className="w-36 text-right">Sisa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.data.perLender.map((row) => (
                      <TableRow key={row.lender}>
                        <TableCell className="font-medium capitalize">
                          {row.lender}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatIDR(row.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {formatIDR(row.paid)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatIDR(row.remaining)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {totalRow && (
                    <TableFooter>
                      <TableRow>
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totalRow.count}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatIDR(totalRow.total)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatIDR(totalRow.paid)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatIDR(totalRow.remaining)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              </div>
              <div className="space-y-2 md:hidden">
                {summary.data.perLender.map((row) => (
                  <div
                    key={row.lender}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{row.lender}</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatIDR(row.remaining)}
                      </p>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{row.count} transaksi</span>
                      <span>
                        {formatIDR(row.paid)} / {formatIDR(row.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">Detail Transaksi</CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled={!bills.data || bills.data.length === 0}
              onClick={() => bills.data && exportBillsCSV(bills.data, periodLabel)}
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bills.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : bills.isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat data: {bills.error.message}
            </p>
          ) : !bills.data || bills.data.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Tidak ada transaksi pada periode ini.
            </p>
          ) : (
            <>
              <BillTable bills={bills.data} showActions={false} />
              <div className="space-y-3 md:hidden">
                {bills.data.map((bill) => (
                  <BillCard key={bill.id} bill={bill} showActions={false} />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
