import { BILL_STATUS_LABELS, type Bill } from "./types"

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
      b.lender,
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
