import {
  Baby,
  Banknote,
  Bike,
  BookOpen,
  Briefcase,
  Bus,
  CalendarClock,
  Car,
  CircleParking,
  Coffee,
  CreditCard,
  Droplets,
  Dumbbell,
  Film,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Laptop,
  Music,
  MoreHorizontal,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Stethoscope,
  Tag,
  Ticket,
  Train,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

export const CATEGORY_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "utensils", icon: Utensils },
  { name: "coffee", icon: Coffee },
  { name: "shopping-cart", icon: ShoppingCart },
  { name: "shopping-bag", icon: ShoppingBag },
  { name: "car", icon: Car },
  { name: "fuel", icon: Fuel },
  { name: "bike", icon: Bike },
  { name: "circle-parking", icon: CircleParking },
  { name: "bus", icon: Bus },
  { name: "train", icon: Train },
  { name: "plane", icon: Plane },
  { name: "receipt", icon: Receipt },
  { name: "zap", icon: Zap },
  { name: "droplets", icon: Droplets },
  { name: "wifi", icon: Wifi },
  { name: "smartphone", icon: Smartphone },
  { name: "credit-card", icon: CreditCard },
  { name: "calendar-clock", icon: CalendarClock },
  { name: "hand-coins", icon: HandCoins },
  { name: "banknote", icon: Banknote },
  { name: "piggy-bank", icon: PiggyBank },
  { name: "shirt", icon: Shirt },
  { name: "laptop", icon: Laptop },
  { name: "gamepad-2", icon: Gamepad2 },
  { name: "repeat", icon: Repeat },
  { name: "music", icon: Music },
  { name: "film", icon: Film },
  { name: "ticket", icon: Ticket },
  { name: "book-open", icon: BookOpen },
  { name: "graduation-cap", icon: GraduationCap },
  { name: "heart-pulse", icon: HeartPulse },
  { name: "stethoscope", icon: Stethoscope },
  { name: "dumbbell", icon: Dumbbell },
  { name: "gift", icon: Gift },
  { name: "paw-print", icon: PawPrint },
  { name: "baby", icon: Baby },
  { name: "home", icon: Home },
  { name: "wrench", icon: Wrench },
  { name: "briefcase", icon: Briefcase },
  { name: "trending-up", icon: TrendingUp },
  { name: "sparkles", icon: Sparkles },
  { name: "wallet", icon: Wallet },
  { name: "tag", icon: Tag },
  { name: "more-horizontal", icon: MoreHorizontal },
]

const ICONS: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map((option) => [option.name, option.icon]),
)

export function CategoryIcon({
  icon,
  color,
  className,
  size = "md",
}: {
  icon?: string
  color?: string
  className?: string
  size?: "sm" | "md"
}) {
  const Icon = ICONS[icon ?? ""] ?? Tag

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
      style={{
        backgroundColor: color ? `${color}1f` : "var(--muted)",
        color: color ?? "var(--foreground)",
      }}
      aria-hidden
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  )
}
