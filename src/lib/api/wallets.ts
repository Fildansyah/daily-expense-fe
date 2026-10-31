import { request, toQuery } from "./client"
import type { Transaction } from "./types/transaction"
import type {
  TransferInput,
  Wallet,
  WalletInput,
  WalletSummary,
} from "./types/wallet"

export const walletsApi = {
  list(includeArchived = false) {
    return request<Wallet[]>(
      `/wallets${toQuery({ includeArchived: includeArchived ? "true" : "" })}`,
    )
  },

  get(id: string) {
    return request<Wallet>(`/wallets/${id}`)
  },

  create(input: WalletInput) {
    return request<Wallet>("/wallets", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  update(id: string, input: WalletInput) {
    return request<Wallet>(`/wallets/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },

  remove(id: string, archive = false) {
    return request<{ message: string }>(
      `/wallets/${id}${toQuery({ archive: archive ? "true" : "" })}`,
      { method: "DELETE" },
    )
  },

  summary() {
    return request<WalletSummary>("/wallets/summary")
  },

  transfer(input: TransferInput) {
    return request<Transaction>("/wallets/transfer", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },
}
