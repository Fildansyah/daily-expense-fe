import { CalendarClock, CircleDollarSign, CheckCircle2, Hourglass } from "lucide-react"

import { cn } from "cn"
import { formatIDR } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface SummaryData {
  total: number
  paid: number
  remaining: number
  remainingAll: number
}

const CARDS: {
  key: keyof SummaryData
  label: string
  icon: typeof CalendarClock
  accent: string
}[] = [
  {
    key: "remaining",
    label: "Incoming Due (periode)",
    icon: CalendarClock,
    accent: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60",
  },
  {
    key: "total",
    label: "Total Tagihan",
    icon: CircleDollarSign,
    accent: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/60",
  },
  {
    key: "paid",
    label: "Sudah Dibayar",
    icon: CheckCircle2,
    accent: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60",
  },
  {
    key: "remainingAll",
    label: "Remaining Amount (semua)",
    icon: Hourglass,
    accent: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/60",
  },
]

export function SummaryCards({
  data,
  loading,
}: {
  data?: SummaryData
  loading?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {CARDS.map((card) => (
        <Card key={card.key} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                {card.label}
              </p>
              <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", card.accent)}>
                <card.icon className="size-4" />
              </span>
            </div>
            {loading || !data ? (
              <Skeleton className="mt-2 h-6 w-24" />
            ) : (
              <p className="mt-1.5 truncate text-base font-semibold sm:text-xl">
                {formatIDR(data[card.key])}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
