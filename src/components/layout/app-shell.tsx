"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell } from "lucide-react"

import { Brand } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useAuth } from "@/hooks/use-auth"
import type { User } from "@/lib/types"

function initials(user: User) {
  const first = user.firstName?.[0] ?? ""
  const last = user.lastName?.[0] ?? ""
  return `${first}${last}`.toUpperCase() || user.email.slice(0, 2).toUpperCase()
}

function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Memuat…</p>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, status, logout } = useAuth()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])

  if (status !== "authenticated" || !user) {
    return <FullScreenLoader />
  }

  const userInitials = initials(user)

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar pathname={pathname} user={user} onLogout={logout} />
      <Topbar userInitials={userInitials} />

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Daily Expense — Dashboard">
          <Brand />
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            aria-label="Notifikasi segera hadir"
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground opacity-50"
          >
            <Bell className="size-5" />
          </button>
          <Link
            href="/profile"
            aria-label="Buka profil"
            className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {userInitials}
          </Link>
        </div>
      </header>

      <main className="lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 pb-28 sm:px-6 lg:pb-10">
          {children}
        </div>
      </main>

      <MobileNav pathname={pathname} />
    </div>
  )
}
