"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-h2">Terjadi kesalahan</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Halaman gagal dimuat. Coba lagi."}
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  )
}
