"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { useBills, useLenders } from "@/hooks/use-bills"
import type { Bill, BillFilters, BillStatus } from "@/lib/types"
import { BILL_STATUS_LABELS } from "@/lib/types"
import {
  currentPeriod,
  PeriodFilter,
  type PeriodValue,
} from "@/components/period-filter"
import { BillTable } from "@/components/bill-table"
import { BillCard } from "@/components/bill-card"
import { DeleteBillDialog } from "@/components/delete-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { monthRange } from "@/lib/format"

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function BillsPage() {
  const [period, setPeriod] = useState<PeriodValue>(currentPeriod)
  const [q, setQ] = useState("")
  const [lender, setLender] = useState("")
  const [status, setStatus] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null)

  const debouncedQ = useDebounced(q)

  const filters: BillFilters = useMemo(() => {
    const f: BillFilters = {}
    if (period.year != null && period.month != null) {
      const { from, to } = monthRange(period.year, period.month)
      f.from = from
      f.to = to
    }
    if (debouncedQ) f.q = debouncedQ
    if (lender) f.lender = lender
    if (status) f.status = status as BillStatus
    return f
  }, [period, debouncedQ, lender, status])

  const { data, isLoading, isError, error } = useBills(filters)
  const { data: lenders } = useLenders()

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tagihan</h1>
          <p className="text-sm text-muted-foreground">
            Daftar tagihan kredit &amp; paylater
          </p>
        </div>
        <Button render={<Link href="/bills/new" />} nativeButton={false}>
          <Plus />
          Catat Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <PeriodFilter value={period} onChange={setPeriod} />
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari deskripsi / lender..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={lender} onValueChange={(v) => setLender(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Lender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Lender</SelectItem>
            {lenders?.map((l) => (
              <SelectItem key={l.id} value={l.id} className="capitalize">
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Status</SelectItem>
            {(Object.keys(BILL_STATUS_LABELS) as BillStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {BILL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Gagal memuat data: {error.message}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-medium">Belum ada tagihan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {q || lender || status
              ? "Coba ubah filter atau periode."
              : "Mulai dengan mencatat tagihan baru."}
          </p>
        </div>
      ) : (
        <>
          <BillTable bills={data} onDelete={setDeleteTarget} />
          <div className="space-y-3 md:hidden">
            {data.map((bill) => (
              <BillCard key={bill.id} bill={bill} onDelete={setDeleteTarget} />
            ))}
          </div>
        </>
      )}

      <DeleteBillDialog
        bill={deleteTarget}
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      />
    </div>
  )
}
