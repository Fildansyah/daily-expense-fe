"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ReceiptText,
  ChartColumn,
  CircleDollarSign,
} from "lucide-react"

import { cn } from "cn"
import { USE_MOCK } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bills", label: "Tagihan", icon: ReceiptText },
  { href: "/reporting", label: "Reporting", icon: ChartColumn },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <CircleDollarSign className="size-4" />
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold">Daily Expense</p>
          <p className="text-[11px] text-muted-foreground">Kredit & PayLater</p>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-dvh bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard">
            <Brand />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(pathname, item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <Badge variant={USE_MOCK ? "secondary" : "outline"} className="w-fit">
            {USE_MOCK ? "Mode Mock (localStorage)" : "Mode API"}
          </Badge>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard">
          <Brand />
        </Link>
        <Badge variant={USE_MOCK ? "secondary" : "outline"}>
          {USE_MOCK ? "Mock" : "API"}
        </Badge>
      </header>

      {/* Konten */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10 lg:pl-68">
        {children}
      </main>

      {/* Bottom navigation mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
