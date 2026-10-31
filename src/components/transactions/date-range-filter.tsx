"use client"

import { useState } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"
import { cn } from "cn"

import { formatTanggal, monthRange } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangeFilterProps {
  from?: string
  to?: string
  onChange: (range: { from?: string; to?: string }) => void
  className?: string
}

function labelFor(from?: string, to?: string): string {
  if (from && to) return `${formatTanggal(from)} – ${formatTanggal(to)}`
  if (from) return `Dari ${formatTanggal(from)}`
  if (to) return `Sampai ${formatTanggal(to)}`
  return "Semua tanggal"
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(from ?? "")
  const [draftTo, setDraftTo] = useState(to ?? "")

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setDraftFrom(from ?? "")
      setDraftTo(to ?? "")
    }
  }

  function apply(range: { from?: string; to?: string }) {
    onChange(range)
    setOpen(false)
  }

  const now = new Date()
  const currentMonth = monthRange(now.getFullYear(), now.getMonth())

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("h-9 justify-start gap-2 rounded-xl bg-card", className)}
          />
        }
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="truncate text-label">{labelFor(from, to)}</span>
        <ChevronDown className="ml-auto size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-caption text-muted-foreground">Dari</span>
            <Input
              type="date"
              value={draftFrom}
              onChange={(event) => setDraftFrom(event.target.value)}
              className="h-9"
            />
          </label>
          <label className="space-y-1">
            <span className="text-caption text-muted-foreground">Sampai</span>
            <Input
              type="date"
              value={draftTo}
              onChange={(event) => setDraftTo(event.target.value)}
              className="h-9"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => apply(currentMonth)}
          >
            Bulan ini
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => apply({})}
          >
            Semua
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() =>
              apply({
                from: draftFrom || undefined,
                to: draftTo || undefined,
              })
            }
          >
            Terapkan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
