"use client"

import { useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { cn } from "cn"

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
    <div className="space-y-4">
      <PageHeader
        title="Kalender Finansial"
        description="Jadwal uang masuk, komitmen cicilan, dan jatuh tempo tagihan."
        actions={
          <>
            <div className="hidden items-center gap-3 text-caption text-muted-foreground md:flex">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-success" />
                Pemasukan
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-destructive" />
                Pengeluaran
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-warning" />
                Tagihan tempo
              </span>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Catat Transaksi
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2 p-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Periode sebelumnya"
              onClick={() => shift(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-44 text-center text-sm font-semibold">{label}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Periode berikutnya"
              onClick={() => shift(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Hari ini
            </Button>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              {(["month", "week"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeMode(option)}
                  aria-pressed={mode === option}
                  className={cn(
                    "min-h-7 rounded-lg px-3 text-label transition-colors",
                    mode === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {option === "month" ? "Bulan" : "Minggu"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {calendarQuery.isLoading ? (
            <Skeleton className="h-[560px] w-full rounded-2xl" />
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
              days={days}
              onSelect={selectDate}
            />
          )}
        </div>

        <DayPanel
          date={selected}
          day={selectedDay}
          loading={calendarQuery.isLoading}
          onAddTransaction={() => setFormOpen(true)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
