import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-display">404</p>
      <p className="text-h2">Halaman tidak ditemukan</p>
      <p className="max-w-md text-sm text-muted-foreground">
        Alamat yang kamu buka tidak tersedia atau sudah dipindahkan.
      </p>
      <Button render={<Link href="/dashboard" />} nativeButton={false}>
        Kembali ke dashboard
      </Button>
    </div>
  )
}
