import { cn } from "cn"

import { utilizationBand, type UtilizationBand } from "@/lib/wallet"

const BAND_ROWS: { band: UtilizationBand; label: string; dot: string }[] = [
  { band: "sehat", label: "Aman (<40%)", dot: "bg-success" },
  { band: "waspada", label: "Waspada (40–70%)", dot: "bg-warning" },
  { band: "kritis", label: "Kritis (≥70%)", dot: "bg-destructive" },
]

const BAND_COPY: Record<UtilizationBand, string> = {
  sehat: "Rekomendasi: kondisi aman. Jaga pemakaian di bawah 40% dari limit.",
  waspada: "Rekomendasi: kurangi pemakaian sebelum mendekati batas limit.",
  kritis: "Rekomendasi: segera bayar sebagian untuk menurunkan utilisasi.",
}

const BAND_COLOR: Record<UtilizationBand, string> = {
  sehat: "var(--primary)",
  waspada: "var(--warning)",
  kritis: "var(--destructive)",
}

interface UtilizationDonutProps {
  utilization: number
  className?: string
}

export function UtilizationDonut({ utilization, className }: UtilizationDonutProps) {
  const band = utilizationBand(utilization)
  const capped = Math.max(0, Math.min(100, utilization))
  const gradient = `conic-gradient(${BAND_COLOR[band]} 0% ${capped}%, var(--muted) ${capped}% 100%)`

  return (
    <div className={cn("flex flex-col items-center gap-4 sm:flex-row", className)}>
      <div
        className="relative flex size-32 shrink-0 items-center justify-center rounded-full"
        style={{ background: gradient }}
        role="img"
        aria-label={`Utilisasi kredit ${utilization.toFixed(1)} persen`}
      >
        <div className="flex size-24 flex-col items-center justify-center rounded-full bg-card">
          <span className="text-[10px] tracking-wide text-muted-foreground">
            TERPAKAI
          </span>
          <span className="num text-base font-semibold">
            {utilization.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1.5 text-caption">
        {BAND_ROWS.map((row) => (
          <p
            key={row.band}
            className={cn(
              "flex items-center gap-2",
              row.band === band ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            <span className={cn("size-2 rounded-full", row.dot)} />
            {row.label}
            {row.band === band ? (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-accent-foreground">
                kondisi saat ini
              </span>
            ) : null}
          </p>
        ))}
        <p className="pt-1 text-muted-foreground">{BAND_COPY[band]}</p>
      </div>
    </div>
  )
}
