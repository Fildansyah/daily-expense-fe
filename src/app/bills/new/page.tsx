import { BillForm } from "@/components/bill-form"

export default function NewBillPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Catat Tagihan Baru</h1>
        <p className="text-sm text-muted-foreground">
          Catat tagihan kredit atau paylater baru
        </p>
      </div>
      <BillForm mode="create" />
    </div>
  )
}
