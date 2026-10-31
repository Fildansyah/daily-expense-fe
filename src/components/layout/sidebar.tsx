"use client"

import Link from "next/link"
import { ChevronsUpDown, LogOut, Settings, Wallet } from "lucide-react"
import { cn } from "cn"

import { NAV_ITEMS, isNavActive } from "@/components/layout/nav-items"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Wallet className="size-4.5" />
      </span>
      <span className={cn("leading-tight", compact && "sr-only")}>
        <span className="block text-[15px] font-semibold">Daily Expense</span>
        <span className="block text-caption text-muted-foreground">
          Kelola uang &amp; tagihan
        </span>
      </span>
    </div>
  )
}

function initials(user: User) {
  const first = user.firstName?.[0] ?? ""
  const last = user.lastName?.[0] ?? ""
  return `${first}${last}`.toUpperCase() || user.email.slice(0, 2).toUpperCase()
}

interface SidebarProps {
  pathname: string
  user: User
  onLogout: () => void
}

export function Sidebar({ pathname, user, onLogout }: SidebarProps) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.email

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" aria-label="Daily Expense — Dashboard">
          <Brand />
        </Link>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Wallet className="size-3.5" />
            </span>
            <span className="font-medium">Pribadi</span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </div>

      <nav aria-label="Navigasi utama" className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(user)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fullName}</p>
            <p className="truncate text-caption text-muted-foreground">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Pengaturan"
            title="Pengaturan"
            render={<Link href="/settings" />}
            nativeButton={false}
          >
            <Settings className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Keluar"
            title="Keluar"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
