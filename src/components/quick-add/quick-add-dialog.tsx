"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  ChevronRight,
  Plus,
  ReceiptText,
  Tags,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { useQuickAdd, type QuickAddKind } from "@/hooks/use-quick-add";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QuickAddAction {
  kind: QuickAddKind;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAddAction[] = [
  {
    kind: "transaction",
    label: "Transaksi",
    description: "Catat pengeluaran atau pemasukan",
    href: "/transactions?form=transaction",
    icon: Plus,
  },
  {
    kind: "bill",
    label: "Tagihan",
    description: "Catat tagihan, cicilan, atau utang",
    href: "/bills?form=bill",
    icon: ReceiptText,
  },
  {
    kind: "account",
    label: "Akun",
    description: "Tambah rekening atau kartu",
    href: "/accounts?form=account",
    icon: Wallet,
  },
  {
    kind: "budget",
    label: "Anggaran",
    description: "Atur batas pengeluaran bulanan",
    href: "/budgets?form=budget",
    icon: ChartColumn,
  },
  {
    kind: "category",
    label: "Kategori",
    description: "Buat kategori atau sub-kategori",
    href: "/categories?form=category",
    icon: Tags,
  },
  {
    kind: "transfer",
    label: "Transfer",
    description: "Pindahkan saldo antar akun",
    href: "/accounts?form=transfer",
    icon: ArrowLeftRight,
  },
];

export function QuickAddDialog() {
  const router = useRouter();
  const { isOpen, initialKind, close } = useQuickAdd();

  function select(action: QuickAddAction) {
    close();
    router.push(action.href);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? null : close())}>
      <DialogContent className="max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah apa?</DialogTitle>
          <DialogDescription>
            Pilih jenis data yang ingin dicatat.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action.kind}
              type="button"
              onClick={() => select(action)}
              className="flex min-h-20 flex-col items-start gap-2 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none data-[highlighted=true]:border-primary"
              data-highlighted={initialKind === action.kind}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <action.icon className="size-4" />
              </span>
              <span className="text-sm font-medium">{action.label}</span>
              <span className="text-caption text-muted-foreground">
                {action.description}
              </span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-caption text-muted-foreground">Buka halaman</p>
          <button
            type="button"
            onClick={() => {
              close();
              router.push("/calendar");
            }}
            className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <CalendarDays className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Kalender</span>
              <span className="block text-caption text-muted-foreground">
                Lihat jadwal transaksi &amp; tagihan
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
        <p className="flex items-center gap-2 text-caption text-muted-foreground">
          <CalendarClock className="size-3.5" />
          Form lengkap tersedia bertahap. Shortcut mengarah ke halaman terkait.
        </p>
      </DialogContent>
    </Dialog>
  );
}
