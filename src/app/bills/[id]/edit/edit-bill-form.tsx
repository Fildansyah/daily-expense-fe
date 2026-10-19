"use client"

import { ArrowLeft } from "lucide-react"
import { useBill } from "@/hooks/use-bills"
import { BillForm } from "@/components/bill-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function EditBillForm({ id }: { id: string }) {
  const { data: bill, isLoading, isError, error } = useBill(id)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (isError || !bill) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Tagihan tidak ditemukan
          {isError ? `: ${error.message}` : ""}
        </p>
        <Button variant="outline" className="mt-3" onClick={() => history.back()}>
          <ArrowLeft />
          Kembali
        </Button>
      </div>
    )
  }

  return <BillForm mode="edit" bill={bill} />
}
