import { EditBillForm } from "./edit-bill-form"

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Ubah Tagihan</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data tagihan kredit atau paylater
        </p>
      </div>
      <EditBillForm id={id} />
    </div>
  )
}
