"use client"

import * as React from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

import { cn } from "cn"
import { monthLabel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface PeriodValue {
  year: number | null
  month: number | null
}

interface PeriodFilterProps {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
  className?: string
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: new Date(2000, i, 1).toLocaleDateString("id-ID", { month: "long" }),
}))

export function currentPeriod(): PeriodValue {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const [open, setOpen] = React.useState(false)

  const allYears = React.useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, i) => current - 1 + i)
  }, [])

  const selected =
    value.year != null && value.month != null
      ? new Date(value.year, value.month, 1)
      : undefined

  const label =
    value.year != null && value.month != null
      ? monthLabel(value.year, value.month)
      : "Semua Periode"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" className={cn("h-8 w-full sm:w-52", className)} />
        }
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-col gap-2">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) onChange({ year: date.getFullYear(), month: date.getMonth() })
              setOpen(false)
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onChange(currentPeriod())
                setOpen(false)
              }}
            >
              Bulan Ini
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({ year: null, month: null })
                setOpen(false)
              }}
            >
              Semua
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={value.month != null ? String(value.month) : ""}
              onValueChange={(v) =>
                onChange({
                  year: value.year ?? new Date().getFullYear(),
                  month: v === "" ? null : Number(v),
                })
              }
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={value.year != null ? String(value.year) : ""}
              onValueChange={(v) =>
                onChange({
                  year: v === "" ? null : Number(v),
                  month: value.month ?? new Date().getMonth(),
                })
              }
            >
              <SelectTrigger className="w-full" size="sm">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {allYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
