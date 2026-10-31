import { cn } from "cn"

import type { Wallet } from "@/lib/api/types/wallet"
import { WALLET_TYPE_LABEL } from "@/lib/wallet"

interface CreditCardFaceProps {
  wallet: Wallet
  holderName?: string
  className?: string
}

export function CreditCardFace({ wallet, holderName, className }: CreditCardFaceProps) {
  const digits = (wallet.accountNumber ?? "").replace(/\D/g, "")
  const last4 = digits.slice(-4) || "••••"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 text-white shadow-sm",
        className,
      )}
      style={{ backgroundColor: wallet.color || "var(--primary)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.2em] opacity-80">
            {WALLET_TYPE_LABEL[wallet.type]?.toUpperCase() ?? wallet.type.toUpperCase()}
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{wallet.name}</p>
        </div>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/20">
          <span className="size-3.5 rounded-[3px] bg-white/70" />
        </span>
      </div>

      <p className="num mt-6 text-base tracking-[0.18em]">•••• •••• •••• {last4}</p>

      <p className="mt-3 truncate text-[10px] tracking-wide uppercase opacity-80">
        {holderName?.trim() || "Pemegang Kartu"}
      </p>
    </div>
  )
}
