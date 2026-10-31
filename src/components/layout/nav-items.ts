import {
  ArrowLeftRight,
  CalendarDays,
  ChartColumn,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
  { href: "/bills", label: "Tagihan", icon: ReceiptText },
  { href: "/accounts", label: "Akun & Kartu", icon: Wallet },
  { href: "/budgets", label: "Anggaran", icon: PiggyBank },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/reports", label: "Laporan", icon: ChartColumn },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/bills", label: "Tagihan", icon: ReceiptText },
  { href: "/reports", label: "Laporan", icon: ChartColumn },
];

export function findNavLabel(pathname: string): string | undefined {
  return NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.label;
}

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
