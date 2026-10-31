"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { cn } from "cn"

import { MOBILE_NAV_ITEMS, isNavActive } from "@/components/layout/nav-items"
import { useQuickAdd } from "@/hooks/use-quick-add"

export function MobileNav({ pathname }: { pathname: string }) {
  const { open } = useQuickAdd()
  const [first, second, third, fourth] = MOBILE_NAV_ITEMS

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        {[first, second].map((item) => (
          <MobileNavItem key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => open("transaction")}
            aria-label="Tambah transaksi"
            className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Plus className="size-6" />
          </button>
        </div>

        {[third, fourth].map((item) => (
          <MobileNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  )
}

function MobileNavItem({
  item,
  pathname,
}: {
  item: (typeof MOBILE_NAV_ITEMS)[number]
  pathname: string
}) {
  const active = isNavActive(pathname, item.href)

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <item.icon className="size-5" />
      {item.label}
    </Link>
  )
}
