"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bell, Plus, Search } from "lucide-react"
import { cn } from "cn"

import { findNavLabel } from "@/components/layout/nav-items"
import { monthRange, toISODate } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function presetRange(preset: "current" | "previous" | "three") {
  const now = new Date()
  if (preset === "current") {
    return monthRange(now.getFullYear(), now.getMonth())
  }
  if (preset === "previous") {
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return monthRange(previous.getFullYear(), previous.getMonth())
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { from: toISODate(start), to: toISODate(end) }
}

function PeriodPresets() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeFrom = searchParams.get("from")
  const activeTo = searchParams.get("to")

  const presets = [
    { key: "current" as const, label: "Bulan ini" },
    { key: "previous" as const, label: "Bulan lalu" },
    { key: "three" as const, label: "3 bulan" },
  ]

  function select(preset: "current" | "previous" | "three") {
    const { from, to } = presetRange(preset)
    const params = new URLSearchParams(searchParams.toString())
    params.set("from", from)
    params.set("to", to)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      {presets.map((preset) => {
        const { from, to } = presetRange(preset.key)
        const matchesRange = activeFrom === from && activeTo === to
        const active =
          matchesRange ||
          (!activeFrom && !activeTo && preset.key === "current")
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => select(preset.key)}
            className={cn(
              "min-h-8 rounded-lg px-3 text-label transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        )
      })}
      <button
        type="button"
        disabled
        title="Filter tanggal kustom segera hadir"
        className="min-h-8 rounded-lg px-3 text-label text-muted-foreground opacity-50"
      >
        Kustom
      </button>
    </div>
  )
}

interface TopbarProps {
  userInitials: string
}

export function Topbar({ userInitials }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const title = findNavLabel(pathname) ?? "Daily Expense"

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur lg:flex">
      <h1 className="sr-only">{title}</h1>

      <form
        className="relative w-full max-w-sm"
        onSubmit={(event) => {
          event.preventDefault()
          const value = query.trim()
          router.push(value ? `/transactions?q=${encodeURIComponent(value)}` : "/transactions")
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari transaksi, rekening, atau tagihan…"
          aria-label="Cari transaksi, rekening, atau tagihan"
          className="h-10 rounded-xl bg-card pl-9"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground xl:block">
          ⌘K
        </kbd>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={null}>
          <PeriodPresets />
        </Suspense>

        <Button
          variant="ghost"
          size="icon-lg"
          className="relative rounded-xl"
          aria-label="Notifikasi (segera hadir)"
          title="Notifikasi segera hadir"
          disabled
        >
          <Bell className="size-5" />
        </Button>

        <Button
          className="h-10 rounded-xl px-4"
          onClick={() => router.push("/transactions?form=transaction")}
        >
          <Plus className="size-4" />
          Tambah transaksi
        </Button>

        <Link
          href="/profile"
          aria-label="Buka profil"
          className="flex size-10 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {userInitials}
        </Link>
      </div>
    </header>
  )
}
