import { useMutation } from "@tanstack/react-query"

import type { Wallet } from "@/lib/api/types/wallet"
import { transactionsApi } from "@/lib/api/transactions"
import { exportAccountStatementCSV } from "@/lib/export"

export function useDownloadStatement(wallet: Wallet | undefined) {
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      if (!wallet) throw new Error("Akun belum siap.")

      const { items, truncated } = await transactionsApi.listAll({
        walletId: wallet.id,
        from,
        to,
        sort: "-date",
      })

      if (items.length === 0) {
        throw new Error("Tidak ada transaksi pada periode statement.")
      }

      exportAccountStatementCSV({ wallet, transactions: items, from, to })
      return { count: items.length, truncated }
    },
  })
}
