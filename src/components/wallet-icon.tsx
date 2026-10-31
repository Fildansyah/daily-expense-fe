import {
  Banknote,
  CalendarClock,
  CreditCard,
  Landmark,
  Smartphone,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

const ICONS: Record<string, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  ewallet: Smartphone,
  credit_card: CreditCard,
  paylater: CalendarClock,
  investment: TrendingUp,
}

export const WALLET_TYPE_LABELS: Record<string, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-wallet",
  credit_card: "Kartu Kredit",
  paylater: "PayLater",
  investment: "Investasi",
}

export function WalletIcon({
  type,
  className,
}: {
  type?: string
  className?: string
}) {
  const Icon = ICONS[type ?? ""] ?? Wallet

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      <Icon className="size-3.5" />
    </span>
  )
}
