"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CalendarClock } from "lucide-react"

import {
  useBillSummary,
  usePastBills,
  useUpcomingBills,
} from "@/hooks/use-bills"
import { formatIDR, formatTanggal, monthRange } from "@/lib/format"
import {
  currentPeriod,
  PeriodFilter,
  type PeriodValue,
} from "@/components/period-filter"
import { SummaryCards } from "@/components/summary-cards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodValue>(currentPeriod)

  const filters = useMemo(() => {
    if (period.year == null || period.month == null) return {}
    const { from, to } = monthRange(period.year, period.month)
    return { from, to }
  }, [period])

  const summary = useBillSummary(filters)

  const upcoming = useUpcomingBills()
  const past = usePastBills()
  const overdue = (past.data ?? []).filter((b) => b.remainingAmount > 0)
  const overdueTotal = overdue.reduce((a, b) => a + b.remainingAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan tagihan kredit &amp; paylater
          </p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <SummaryCards data={summary.data} loading={summary.isLoading} />

      {overdue.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="text-sm">
            <p className="font-medium text-destructive">
              {overdue.length} tagihan lewat tempo — sisa total{" "}
              {formatIDR(overdueTotal)}
            </p>
            <p className="text-muted-foreground">
              Segera lunasi untuk menghindari denda.
            </p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rincian per Lender</CardTitle>
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
                        <TableHead className="w-16 text-right">Jumlah</TableHead>
                        <TableHead className="w-32 text-right">Tagihan</TableHead>
                        <TableHead className="w-32 text-right">Terbayar</TableHead>
                        <TableHead className="w-32 text-right">Sisa</TableHead>
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
                  </Table>
                </div>
                <div className="space-y-2 md:hidden">
                  {summary.data.perLender.map((row) => (
                    <div
                      key={row.lender}
                      className="flex items-center justify-between gap-2 rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium capitalize">{row.lender}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.count} tagihan
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">
                          {formatIDR(row.remaining)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          dari {formatIDR(row.total)}
                        </p>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-muted-foreground" />
              Jatuh Tempo Terdekat (7 hari)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : upcoming.isError ? (
              <p className="text-sm text-destructive">
                Gagal memuat data: {upcoming.error.message}
              </p>
            ) : !upcoming.data || upcoming.data.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Tidak ada tagihan jatuh tempo 7 hari ke depan.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.data.slice(0, 5).map((bill) => (
                  <li
                    key={bill.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium capitalize">
                          {bill.lender}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {bill.deskripsi}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatTanggal(bill.dueDate)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">
                      {formatIDR(bill.remainingAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
