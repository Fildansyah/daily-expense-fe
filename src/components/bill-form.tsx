"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Calculator, Loader2 } from "lucide-react"

import { deriveRemaining } from "@/lib/types"
import { formatIDR, fromISODate, toISODate } from "@/lib/format"
import { useCreateBill, useLenders, useUpdateBill } from "@/hooks/use-bills"
import type { Bill, BillInput } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/date-picker"
import { Card, CardContent } from "@/components/ui/card"

const billSchema = z.object({
  lender: z.string().min(1, "Pilih lender"),
  amount: z.coerce
    .number({ error: "Jumlah wajib diisi" })
    .min(1, "Jumlah minimal Rp 1"),
  paidAmount: z.coerce
    .number({ error: "Nominal tidak valid" })
    .min(0, "Tidak boleh negatif")
    .default(0),
  dueDate: z.string().min(1, "Tanggal jatuh tempo wajib diisi"),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
})

export type BillFormValues = z.infer<typeof billSchema>

interface BillFormProps {
  mode: "create" | "edit"
  bill?: Bill
}

export function BillForm({ mode, bill }: BillFormProps) {
  const router = useRouter()
  const { data: lenders } = useLenders()
  const createBill = useCreateBill()
  const updateBill = useUpdateBill()

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema) as unknown as Resolver<BillFormValues>,
    defaultValues: {
      lender: bill?.lender ?? "",
      amount: bill?.amount ?? undefined,
      paidAmount: bill?.paidAmount ?? 0,
      dueDate: bill?.dueDate ?? "",
      deskripsi: bill?.deskripsi ?? "",
    },
  })

  const { control } = form
  const amount = useWatch({ control, name: "amount" }) ?? 0
  const paidAmount = useWatch({ control, name: "paidAmount" }) ?? 0
  const remaining = deriveRemaining(amount, paidAmount)

  const pending = createBill.isPending || updateBill.isPending

  function onSubmit(values: BillFormValues) {
    const payload: BillInput = {
      lender: values.lender,
      amount: values.amount,
      paidAmount: values.paidAmount,
      dueDate: values.dueDate,
      deskripsi: values.deskripsi,
    }
    const done = () => {
      toast.success(mode === "create" ? "Tagihan dicatat" : "Tagihan diperbarui")
      router.push("/bills")
    }
    const fail = (err: Error) => toast.error(err.message)

    if (mode === "create") {
      createBill.mutate(payload, { onSuccess: done, onError: fail })
    } else if (bill) {
      updateBill.mutate({ id: bill.id, data: payload }, { onSuccess: done, onError: fail })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <FormField
              control={control}
              name="lender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lender</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v)}
                      items={lenders?.map((l) => ({ label: l.name, value: l.id })) ?? []}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih lender" />
                      </SelectTrigger>
                      <SelectContent>
                        {lenders?.map((l) => (
                          <SelectItem key={l.id} value={l.id} className="capitalize">
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Tagihan (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sudah Dibayar (Rp)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Jatuh Tempo</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ? fromISODate(field.value) : undefined}
                      onChange={(d) => field.onChange(d ? toISODate(d) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="mis. shopping, cicilan hp, gir motor"
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="size-4" />
                Sisa tagihan
              </div>
              <Label
                className={`text-base font-semibold tabular-nums ${
                  remaining > 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatIDR(remaining)}
              </Label>
            </div>
            <FormDescription>
              Sisa tagihan dihitung otomatis: jumlah tagihan dikurangi yang sudah
              dibayar.
            </FormDescription>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="sm:w-auto"
          >
            <ArrowLeft />
            Kembali
          </Button>
          <Button type="submit" disabled={pending} className="sm:min-w-36">
            {pending && <Loader2 className="animate-spin" />}
            {mode === "create" ? "Simpan" : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
