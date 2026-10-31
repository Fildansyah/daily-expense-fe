"use client"

import { Suspense, useMemo } from "react"
import { ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { formatTanggal, monthRange } from "@/lib/format"
import { useDashboard } from "@/hooks/use-reports"
import { usePeriodRange } from "@/hooks/use-period"
import { useAuth } from "@/hooks/use-auth"
import {
  CashflowChart,
  CategoryDonut,
  KpiCard,
} from "@/components/dashboard/dashboard-charts"
import {
  BudgetProgress,
  CreditUtilization,
  RecentTransactions,
  UpcomingBills,
} from "@/components/dashboard/dashboard-lists"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  )
}

function greetingFor(hour: number): string {
  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 19) return "Selamat sore"
  return "Selamat malam"
}

function DashboardView() {
  const { user } = useAuth()
  const { from, to } = usePeriodRange()

  const defaultRange = useMemo(() => {
    const now = new Date()
    return monthRange(now.getFullYear(), now.getMonth())
  }, [])

  const activeFrom = from ?? defaultRange.from
  const activeTo = to ?? defaultRange.to

  const dashboardQuery = useDashboard(activeFrom, activeTo)
  const data = dashboardQuery.data

  const firstName = user?.firstName ?? "kamu"
  const greeting = greetingFor(new Date().getHours())
  const periodLabel = `${formatTanggal(activeFrom)} – ${formatTanggal(activeTo)}`

  const balanceSpark = useMemo(() => {
    const points = data?.cashflow ?? []
    return points.map((_, index) =>
      points
        .slice(0, index + 1)
        .reduce((total, point) => total + point.net, 0),
    )
  }, [data?.cashflow])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-display" suppressHydrationWarning>
            {greeting}, {firstName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan keuangan {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-border bg-card px-3 py-1.5 text-caption text-muted-foreground">
          <span className="size-2 rounded-full bg-success" />
          Terhubung ke API · data terbaru
        </div>
      </div>

      {dashboardQuery.isLoading ? (
        <DashboardSkeleton />
      ) : dashboardQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-destructive">
              Gagal memuat dashboard: {dashboardQuery.error.message}
            </p>
            <Button variant="outline" onClick={() => dashboardQuery.refetch()}>
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Saldo"
              value={data.kpi.totalBalance}
              icon={Wallet}
              tone="primary"
              caption="Gabungan akun aktif"
              spark={balanceSpark}
            />
            <KpiCard
              label="Pemasukan Periode Ini"
              value={data.kpi.income}
              icon={TrendingUp}
              tone="success"
              delta={data.kpi.incomeDelta}
              spark={data.cashflow.map((point) => point.income)}
            />
            <KpiCard
              label="Pengeluaran Periode Ini"
              value={data.kpi.expense}
              icon={TrendingDown}
              tone="danger"
              delta={data.kpi.expenseDelta}
              spark={data.cashflow.map((point) => point.expense)}
            />
            <KpiCard
              label="Sisa Tagihan"
              value={data.kpi.debt}
              icon={ReceiptText}
              tone="warning"
              caption={`${data.upcomingBills.length} tagihan jatuh tempo dekat`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <CashflowChart points={data.cashflow} />
            <CategoryDonut categories={data.categoryBreakdown} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <UpcomingBills bills={data.upcomingBills} />
            <RecentTransactions transactions={data.recentTransactions} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <BudgetProgress budgets={data.budgetProgress} />
            <CreditUtilization accounts={data.creditUtilization} />
          </div>
        </>
      ) : null}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  )
}
