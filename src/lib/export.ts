import { BILL_STATUS_LABELS, type Bill, type Budget, type Transaction } from "./types"

function escapeCSV(v: string | number): string {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportBillsCSV(bills: Bill[], periodLabel: string): void {
  const header = [
    "Lender",
    "Deskripsi",
    "Jatuh Tempo",
    "Tagihan",
    "Terbayar",
    "Sisa",
    "Status",
  ]
  const rows = bills.map((b) =>
    [
      b.lender?.name ?? "",
      b.deskripsi,
      b.dueDate,
      b.amount,
      b.paidAmount,
      b.remainingAmount,
      BILL_STATUS_LABELS[b.status],
    ]
      .map(escapeCSV)
      .join(","),
  )
  const csv = "\uFEFF" + [header.map(escapeCSV).join(","), ...rows].join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `laporan-tagihan-${periodLabel}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportBudgetsCSV(budgets: Budget[], periodLabel: string): void {
  const header = ["Kategori", "Anggaran", "Terpakai", "Sisa", "Persentase", "Status"]

  const rows = budgets.map((budget) =>
    [
      budget.categoryName,
      budget.amount,
      budget.spent,
      budget.remaining,
      `${budget.percentage}%`,
      budget.status,
    ]
      .map(escapeCSV)
      .join(","),
  )

  const csv = "\uFEFF" + [header.map(escapeCSV).join(","), ...rows].join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `anggaran-${periodLabel}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: "Pemasukan",
  EXPENSE: "Pengeluaran",
  TRANSFER: "Transfer",
}

export function exportTransactionsCSV(
  transactions: Transaction[],
  periodLabel: string,
): void {
  const header = [
    "Tanggal",
    "Tipe",
    "Kategori",
    "Catatan",
    "Akun",
    "Akun Tujuan",
    "Jumlah",
  ]

  const rows = transactions.map((transaction) =>
    [
      transaction.date,
      TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type,
      transaction.category?.name ?? "",
      transaction.memo,
      transaction.wallet?.name ?? "",
      transaction.transferWallet?.name ?? "",
      transaction.amount,
    ]
      .map(escapeCSV)
      .join(","),
  )

  const csv = "\uFEFF" + [header.map(escapeCSV).join(","), ...rows].join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `transaksi-${periodLabel}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
