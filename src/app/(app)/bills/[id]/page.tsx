import { PlaceholderPage } from "@/components/states/placeholder-page"

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <PlaceholderPage
      title="Detail Tagihan"
      description={`Rincian tagihan ${id} dan riwayat pembayaran.`}
      note="Detail tagihan, pembayaran, dan timeline akan dibangun pada Phase 4."
    />
  )
}
