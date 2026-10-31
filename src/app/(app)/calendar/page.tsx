"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { cn } from "cn"

import type { Bill } from "@/lib/api/types/bill"
import type { CalendarDay } from "@/lib/api/types/report"
import {
  formatIDR,
  formatTanggal,
  fromISODate,
  monthLabel,
  monthRange,
  toISODate,
} from "@/lib/format"
import { useCalendar } from "@/hooks/use-reports"
import { PageHeader } from "@/components/layout/page-header"
import { BillPaymentDialog } from "@/components/bills/bill-payment-dialog"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { DayPanel } from "@/components/calendar/day-panel"
import { TransactionFormSheet } from "@/components/transactions/transaction-form-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type CalendarMode = "month" | "week"

function weekStart(date: Date): Date {
  const offset = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
}

function weekRange(selected: string): { from: string; to: string } {
  const start = weekStart(fromISODate(selected))
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return { from: toISODate(start), to: toISODate(end) }
}

export default function CalendarPage() {
  const [mode, setMode] = useState<CalendarMode>("month")
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => toISODate(new Date()))
  const [formOpen, setFormOpen] = useState(false)
  const [payBill, setPayBill] = useState<Bill | null>(null)

  const range = useMemo(() => {
    if (mode === "week") return weekRange(selected)
    return monthRange(cursor.getFullYear(), cursor.getMonth())
  }, [mode, cursor, selected])

  const calendarQuery = useCalendar(range.from, range.to)
  const data = calendarQuery.data

  const days = useMemo(() => {
    const map = new Map<string, CalendarDay>()
    for (const day of data?.days ?? []) {
      map.set(day.date, day)
    }
    return map
  }, [data?.days])

  const selectedDay = days.get(selected)
  const allBills = useMemo(
    () => (data?.days ?? []).flatMap((day) => day.bills),
    [data?.days],
  )
  const overdueCount = allBills.filter((bill) => bill.isOverdue).length
  const billsDue = data?.billsDue ?? 0
  const summary = data?.summary
  const net = summary?.net ?? 0

  const label =
    mode === "month"
      ? monthLabel(cursor.getFullYear(), cursor.getMonth())
      : `${formatTanggal(range.from)} – ${formatTanggal(range.to)}`

  function shift(delta: number) {
    if (mode === "month") {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1)
      setCursor(next)
      setSelected(toISODate(next))
      return
    }

    const current = fromISODate(selected)
    const next = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate() + delta * 7,
    )
    setSelected(toISODate(next))
  }

  function goToday() {
    const now = new Date()
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(toISODate(now))
  }

  function changeMode(next: CalendarMode) {
    setMode(next)
    if (next === "month") {
      const date = fromISODate(selected)
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  function selectDate(date: string) {
    if (mode === "month") {
      const parsed = fromISODate(date)
      if (
        parsed.getMonth() !== cursor.getMonth() ||
        parsed.getFullYear() !== cursor.getFullYear()
      ) {
        setCursor(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
      }
    }
    setSelected(date)
  }

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="hidden md:block">
        <PageHeader
          title="Kalender Finansial"
          description="Jadwal uang masuk, komitmen cicilan, dan jatuh tempo tagihan."
          actions={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Catat Transaksi
            </Button>
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-8 shrink-0 gap-1.5 rounded-full bg-card px-3"
          onClick={goToday}
        >
          <CalendarDays className="size-3.5" />
          <span className="text-[11px] font-medium">Hari Ini</span>
        </Button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-border bg-card px-3 py-1.5">
          <span className="text-[11px] text-muted-foreground">Net</span>
          <span
            className={cn(
              "num truncate text-[11px] font-semibold",
              net >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {net < 0 ? "−" : "+"}
            {formatIDR(Math.abs(net))}
          </span>
        </div>

        <div className="flex shrink-0 items-center rounded-xl bg-muted p-1">
          {(["month", "week"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeMode(option)}
              aria-pressed={mode === option}
              className={cn(
                "min-h-7 rounded-lg px-2.5 text-[11px] font-medium transition-colors",
                mode === option
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {option === "month" ? "Kalender" : "Daftar"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {calendarQuery.isLoading ? (
            <Skeleton className="h-[420px] w-full rounded-2xl md:h-[560px]" />
          ) : calendarQuery.isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-destructive">
                  Gagal memuat kalender: {calendarQuery.error.message}
                </p>
                <Button variant="outline" onClick={() => calendarQuery.refetch()}>
                  Coba lagi
                </Button>
              </CardContent>
            </Card>
          ) : (
            <CalendarGrid
              mode={mode}
              cursor={cursor}
              selected={selected}
              label={label}
              days={days}
              onSelect={selectDate}
              onPrev={() => shift(-1)}
              onNext={() => shift(1)}
            />
          )}
        </div>

        <DayPanel
          date={selected}
          day={selectedDay}
          loading={calendarQuery.isLoading}
          onAddTransaction={() => setFormOpen(true)}
          onPay={setPayBill}
        />
      </div>

      <div className="hidden grid-cols-2 gap-3 md:grid xl:grid-cols-4">
        <SummaryCard
          label="Total pemasukan"
          value={summary?.income ?? 0}
          icon={<TrendingUp className="size-4" />}
          tone="success"
          caption={`${summary?.count ?? 0} transaksi tercatat`}
        />
        <SummaryCard
          label="Total pengeluaran"
          value={summary?.expense ?? 0}
          icon={<TrendingDown className="size-4" />}
          tone="danger"
          caption="Pengeluaran tercatat pada periode ini"
        />
        <SummaryCard
          label="Surplus arus kas"
          value={summary?.net ?? 0}
          icon={<Wallet className="size-4" />}
          tone="primary"
          caption="Pemasukan dikurangi pengeluaran"
        />
        <SummaryCard
          label="Total tagihan"
          value={billsDue}
          icon={<ReceiptText className="size-4" />}
          tone="warning"
          caption={`${overdueCount} tagihan terlambat`}
        />
      </div>

      {formOpen ? (
        <TransactionFormSheet
          open
          initialDate={selected}
          onOpenChange={(open) => {
            if (!open) setFormOpen(false)
          }}
        />
      ) : null}

      {payBill ? (
        <BillPaymentDialog
          key={payBill.id}
          open
          bill={payBill}
          onOpenChange={(open) => {
            if (!open) setPayBill(null)
          }}
        />
      ) : null}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
  caption,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: "success" | "danger" | "primary" | "warning"
  caption: string
}) {
  const toneClass = {
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
  }[tone]

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-caption text-muted-foreground">{label}</p>
          <p className="num mt-1 text-lg font-semibold">{formatIDR(value)}</p>
          <p className="truncate text-caption text-muted-foreground">{caption}</p>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            toneClass,
          )}
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  )
}
