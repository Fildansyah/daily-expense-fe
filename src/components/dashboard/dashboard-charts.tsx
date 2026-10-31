"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "cn"

import type { CashflowPoint, ReportCategory } from "@/lib/api/types/report"
import { formatIDR, fromISODate } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Tone = "primary" | "success" | "danger" | "warning"

const TONE = {
  primary: {
    icon: "bg-primary/10 text-primary",
    stroke: "var(--chart-1)",
  },
  success: {
    icon: "bg-success/10 text-success",
    stroke: "var(--success)",
  },
  danger: {
    icon: "bg-destructive/10 text-destructive",
    stroke: "var(--destructive)",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    stroke: "var(--warning)",
  },
} satisfies Record<Tone, { icon: string; stroke: string }>

function Sparkline({ values, tone }: { values: number[]; tone: Tone }) {
  if (values.length < 2) return null

  const width = 88
  const height = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / span) * height
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={TONE[tone].stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}

interface KpiCardProps {
  label: string
  value: number
  icon: LucideIcon
  tone: Tone
  delta?: number
  caption?: string
  spark?: number[]
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  caption,
  spark,
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-caption text-muted-foreground">{label}</p>
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              TONE[tone].icon,
            )}
          >
            <Icon className="size-3.5" />
          </span>
        </div>
        <p className="num text-xl font-semibold">{formatIDR(value)}</p>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            {typeof delta === "number" ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  delta >= 0
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {delta >= 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {Math.abs(delta).toFixed(1)}% vs lalu
              </span>
            ) : null}
            {caption ? (
              <p className="mt-1 truncate text-caption text-muted-foreground">
                {caption}
              </p>
            ) : null}
          </div>
          {spark ? <Sparkline values={spark} tone={tone} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

function monthShort(period: string): string {
  const date = fromISODate(period)
  return date.toLocaleDateString("id-ID", { month: "short" })
}

export function CashflowChart({ points }: { points: CashflowPoint[] }) {
  const max = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]))
  const last = points[points.length - 1]

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">Arus Kas</CardTitle>
          <p className="text-caption text-muted-foreground">
            Perbandingan {points.length || 6} bulan terakhir
          </p>
        </div>
        <div className="flex items-center gap-3 text-caption text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" />
            Pemasukan
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-destructive" />
            Pengeluaran
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {points.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Belum ada data arus kas.
          </p>
        ) : (
          <>
            <div className="flex h-44 items-end gap-3 border-b border-border pb-1">
              {points.map((point) => (
                <div key={point.period} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-36 w-full items-end justify-center gap-1">
                    <div
                      className="w-2.5 rounded-t-sm bg-primary/80"
                      style={{ height: `${Math.max(3, (point.income / max) * 100)}%` }}
                      title={`Masuk ${formatIDR(point.income)}`}
                    />
                    <div
                      className="w-2.5 rounded-t-sm bg-destructive/70"
                      style={{ height: `${Math.max(3, (point.expense / max) * 100)}%` }}
                      title={`Keluar ${formatIDR(point.expense)}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {monthShort(point.period)}
                  </span>
                </div>
              ))}
            </div>

            {last ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-caption">
                <span className="font-medium">
                  Bulan aktif: {monthShort(last.period)}
                </span>
                <span className="text-success">
                  Masuk {formatIDR(last.income)}
                </span>
                <span className="text-destructive">
                  Keluar {formatIDR(last.expense)}
                </span>
                <span className={last.net >= 0 ? "text-success" : "text-destructive"}>
                  {last.net >= 0 ? "Surplus" : "Defisit"} {formatIDR(Math.abs(last.net))}
                </span>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  )
}

const FALLBACK_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
]

export function CategoryDonut({ categories }: { categories: ReportCategory[] }) {
  const total = categories.reduce((sum, category) => sum + category.amount, 0)

  const segments = categories.map((category, index) => {
    const percentage = total > 0 ? (category.amount / total) * 100 : 0
    const start = categories
      .slice(0, index)
      .reduce(
        (sum, item) => sum + (total > 0 ? (item.amount / total) * 100 : 0),
        0,
      )
    return {
      color: category.bgColor || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      start,
      end: start + percentage,
    }
  })

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
          .join(", ")})`
      : "conic-gradient(var(--muted) 0% 100%)"

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Kategori</CardTitle>
        <p className="text-caption text-muted-foreground">Total belanja periode ini</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <div
            className="relative flex size-36 items-center justify-center rounded-full"
            style={{ background: gradient }}
            role="img"
            aria-label="Distribusi pengeluaran per kategori"
          >
            <div className="flex size-24 flex-col items-center justify-center rounded-full bg-card text-center">
              <span className="text-[10px] text-muted-foreground">TOTAL KELUAR</span>
              <span className="num text-sm font-semibold">{formatIDR(total)}</span>
              <span className="text-[10px] text-muted-foreground">100% alokasi</span>
            </div>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Belum ada pengeluaran pada periode ini.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {categories.slice(0, 6).map((category, index) => (
              <li
                key={category.categoryId}
                className="flex items-center justify-between gap-2 text-caption"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        category.bgColor ||
                        FALLBACK_COLORS[index % FALLBACK_COLORS.length],
                    }}
                  />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="num shrink-0 text-muted-foreground">
                  {formatIDR(category.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
