"use client"

import type { Budget } from "@/lib/api/types/budget"
import type { CashflowPoint } from "@/lib/api/types/report"
import { cn } from "cn"

import { daysInMonth, formatCompact } from "@/lib/budget"
import { fromISODate, toISODate } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ConsumptionChart({
  points,
  totalBudget,
  month,
}: {
  points: CashflowPoint[]
  totalBudget: number
  month: string
}) {
  const days = daysInMonth(month)
  const expenseByDate = new Map(
    points.map((point) => [point.period, point.expense]),
  )

  const [year, monthNumber] = month.split("-").map(Number)
  const values: number[] = []
  let running = 0
  for (let day = 1; day <= days; day += 1) {
    const key = toISODate(new Date(year, (monthNumber ?? 1) - 1, day))
    running += expenseByDate.get(key) ?? 0
    values.push(running)
  }

  const max = Math.max(1, totalBudget, ...values)
  const width = 340
  const height = 150
  const padding = { top: 12, right: 8, bottom: 22, left: 34 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom

  const x = (index: number) =>
    padding.left + (index / Math.max(1, days - 1)) * plotWidth
  const y = (value: number) =>
    padding.top + plotHeight - (value / max) * plotHeight

  const actual = values
    .map((value, index) => `${x(index)},${y(value)}`)
    .join(" ")
  const lastValue = values[values.length - 1] ?? 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Laju Pengeluaran Akumulatif</CardTitle>
        <p className="text-caption text-muted-foreground">
          Aktual vs plafon anggaran bulan ini
        </p>
      </CardHeader>
      <CardContent>
        {totalBudget <= 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Belum ada anggaran untuk digambarkan.
          </p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full"
              role="img"
              aria-label="Grafik laju pengeluaran akumulatif"
            >
              <line
                x1={padding.left}
                y1={y(totalBudget)}
                x2={width - padding.right}
                y2={y(totalBudget)}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <polyline
                points={actual}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx={x(values.length - 1)}
                cy={y(lastValue)}
                r="3.5"
                fill="var(--primary)"
              />
              <text
                x={padding.left - 4}
                y={padding.top + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[7px]"
              >
                {formatCompact(max)}
              </text>
              <text
                x={padding.left - 4}
                y={height - padding.bottom}
                textAnchor="end"
                className="fill-muted-foreground text-[7px]"
              >
                Rp 0
              </text>
              <text
                x={padding.left}
                y={height - 6}
                className="fill-muted-foreground text-[7px]"
              >
                1 {fromISODate(`${month}-01`).toLocaleDateString("id-ID", { month: "short" })}
              </text>
              <text
                x={width - padding.right}
                y={height - 6}
                textAnchor="end"
                className="fill-muted-foreground text-[7px]"
              >
                {days} {fromISODate(`${month}-01`).toLocaleDateString("id-ID", { month: "short" })}
              </text>
            </svg>
            <div className="flex items-center gap-3 text-caption text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary" />
                Realisasi
              </span>
              <span className="flex items-center gap-1">
                <span className="h-0.5 w-4 border-t border-dashed border-muted-foreground" />
                Plafon
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function RealizationChart({ budgets }: { budgets: Budget[] }) {
  const max = Math.max(
    1,
    ...budgets.flatMap((budget) => [budget.amount, budget.spent]),
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Realisasi vs Plafon per Kategori</CardTitle>
        <p className="text-caption text-muted-foreground">
          Perbandingan proporsi realisasi terhadap batas anggaran
        </p>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Belum ada data anggaran.
          </p>
        ) : (
          <>
            <div className="flex items-end gap-4 overflow-x-auto border-b border-border pb-1">
              {budgets.map((budget) => {
                const over = budget.status === "lebih"
                return (
                  <div
                    key={budget.id}
                    className="flex min-w-16 flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex h-40 w-full items-end justify-center gap-1.5">
                      <div
                        className={cn(
                          "w-5 rounded-t-sm",
                          over ? "bg-destructive" : "bg-primary",
                        )}
                        style={{
                          height: `${Math.max(2, (budget.spent / max) * 100)}%`,
                        }}
                        title={`Realisasi ${formatCompact(budget.spent)}`}
                      />
                      <div
                        className="w-5 rounded-t-sm bg-primary/15"
                        style={{
                          height: `${Math.max(2, (budget.amount / max) * 100)}%`,
                        }}
                        title={`Plafon ${formatCompact(budget.amount)}`}
                      />
                    </div>
                    <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                      {budget.categoryName}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {budget.percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary" />
                Realisasi Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-destructive" />
                Realisasi Melebihi
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary/15" />
                Plafon Anggaran
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
