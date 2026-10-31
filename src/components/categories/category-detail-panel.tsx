"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Check, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import type { Category } from "@/lib/api/types/category"
import { CATEGORY_COLORS } from "@/lib/categories"
import { formatIDR, formatTanggal } from "@/lib/format"
import {
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories"
import {
  CATEGORY_ICON_OPTIONS,
  CategoryIcon,
} from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TYPE_LABEL: Record<string, string> = {
  EXPENSE: "Pengeluaran",
  INCOME: "Pemasukan",
  TRANSFER: "Transfer",
}

interface CategoryDetailPanelProps {
  category: Category
  roots: Category[]
  amount: number
  count: number
  onDeleted: () => void
}

export function CategoryDetailPanel({
  category,
  roots,
  amount,
  count,
  onDeleted,
}: CategoryDetailPanelProps) {
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [name, setName] = useState(category.name)
  const [parentId, setParentId] = useState(category.parentId ?? "")
  const [icon, setIcon] = useState(category.icon || "tag")
  const [color, setColor] = useState(category.bgColor || CATEGORY_COLORS[0])
  const [iconQuery, setIconQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const type = category.transactionTypes?.type ?? category.transactionTypeName ?? ""
  const typeLabel = TYPE_LABEL[type] ?? type
  const hasChildren = (category.children ?? []).length > 0
  const parentOptions = roots.filter((root) => root.id !== category.id)
  const parentItems = [
    { label: "Tanpa Induk (Kategori Utama)", value: "none" },
    ...parentOptions.map((root) => ({
      label: `${root.name} (Induk)`,
      value: root.id,
    })),
  ]
  const parentName = roots.find((root) => root.id === category.parentId)?.name
  const updatedSource =
    category.updatedAt && !category.updatedAt.startsWith("0001-")
      ? category.updatedAt
      : category.createdAt

  const icons = useMemo(() => {
    const keyword = iconQuery.trim().toLowerCase()
    if (!keyword) return CATEGORY_ICON_OPTIONS
    return CATEGORY_ICON_OPTIONS.filter((option) =>
      option.name.includes(keyword),
    )
  }, [iconQuery])

  const dirty =
    name !== category.name ||
    parentId !== (category.parentId ?? "") ||
    icon !== (category.icon || "tag") ||
    color !== (category.bgColor || CATEGORY_COLORS[0])

  function reset() {
    setName(category.name)
    setParentId(category.parentId ?? "")
    setIcon(category.icon || "tag")
    setColor(category.bgColor || CATEGORY_COLORS[0])
    setError(null)
  }

  function save() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError("Nama kategori wajib diisi.")
      return
    }
    if (trimmed.length > 30) {
      setError("Nama kategori maksimal 30 karakter.")
      return
    }

    updateCategory.mutate(
      {
        id: category.id,
        input: {
          name: trimmed,
          transactionTypeId: category.transactionTypeId,
          parentId: parentId || null,
          bgColor: color,
          icon,
          sortOrder: category.sortOrder,
          isArchived: category.isArchived,
        },
      },
      {
        onSuccess: () => {
          toast.success("Kategori diperbarui")
          setError(null)
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  function archive() {
    deleteCategory.mutate(
      { id: category.id, archive: true },
      {
        onSuccess: () => {
          toast.success("Kategori diarsipkan")
          onDeleted()
        },
        onError: (mutationError) => toast.error(mutationError.message),
      },
    )
  }

  function remove() {
    deleteCategory.mutate(
      { id: category.id, archive: false },
      {
        onSuccess: () => {
          toast.success("Kategori dihapus permanen")
          setDeleteOpen(false)
          onDeleted()
        },
        onError: (mutationError) => {
          setDeleteOpen(false)
          toast.error(mutationError.message)
        },
      },
    )
  }

  const pending = updateCategory.isPending

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-h2">Detail &amp; Edit Kategori</h2>
          <p className="text-caption text-muted-foreground">
            ID {category.id.slice(0, 8).toUpperCase()} · Terakhir diubah{" "}
            {formatTanggal(updatedSource.slice(0, 10))}
          </p>
        </div>
        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
          {category.isArchived ? "Diarsipkan" : "Status: Aktif"}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-accent/40 p-3">
        <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
          PRATINJAU TAMPILAN BULAN INI
        </p>
        <div className="flex items-center gap-3 rounded-xl bg-card p-3">
          <CategoryIcon icon={icon} color={color} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{name || "Nama kategori"}</p>
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-accent-foreground">
                {typeLabel}
              </span>
              {parentId ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  Sub-kategori
                </span>
              ) : null}
            </div>
            <p className="truncate text-caption text-muted-foreground">
              {parentId
                ? `Di bawah ${roots.find((root) => root.id === parentId)?.name ?? "induk"}`
                : "Kategori utama"}
            </p>
            <p className="text-caption text-muted-foreground">
              {count > 0 ? `${count} transaksi` : "Belum ada transaksi"}
            </p>
          </div>
          <p
            className={cn(
              "num shrink-0 text-lg font-semibold",
              type === "INCOME" ? "text-success" : "text-destructive",
            )}
          >
            {formatIDR(amount)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 sm:col-span-2">
          <span className="flex items-center justify-between text-label">
            <span>
              Nama Kategori <span className="text-destructive">*</span>
            </span>
            <span className="text-caption font-normal text-muted-foreground">
              Maks. 30 karakter
            </span>
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 30))}
            className="h-10 rounded-xl"
          />
        </label>

        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-label">Jenis Aliran Dana</p>
          <div className="flex gap-2">
            {(["EXPENSE", "INCOME"] as const).map((option) => (
              <span
                key={option}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-caption",
                  type === option
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground opacity-60",
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    type === option ? "bg-primary" : "bg-muted-foreground/40",
                  )}
                />
                {TYPE_LABEL[option]}
              </span>
            ))}
          </div>
          <p className="text-caption text-muted-foreground">
            Tipe transaksi tidak dapat diubah setelah kategori dibuat.
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-label">Induk Kategori</p>
          <Select
            items={parentItems}
            value={parentId || "none"}
            onValueChange={(value) =>
              setParentId(!value || value === "none" ? "" : value)
            }
            disabled={hasChildren}
          >
            <SelectTrigger className="h-10 w-full rounded-xl">
              <SelectValue placeholder="Tanpa induk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa Induk (Kategori Utama)</SelectItem>
              {parentOptions.map((root) => (
                <SelectItem key={root.id} value={root.id}>
                  {root.name} (Induk)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-caption text-muted-foreground">
            {hasChildren
              ? "Kategori ini punya sub-kategori, jadi tidak bisa dijadikan sub-kategori."
              : parentName
                ? `Saat ini di bawah ${parentName}.`
                : "Pilih induk untuk menjadikannya sub-kategori. Maksimal 2 level."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-label">
            Pilih Ikon ({CATEGORY_ICON_OPTIONS.length} ikon Standar)
          </p>
          <span className="text-caption text-muted-foreground">
            Ikon terpilih: {icon}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={iconQuery}
            onChange={(event) => setIconQuery(event.target.value)}
            placeholder="Cari ikon…"
            className="h-9 rounded-xl pl-8"
          />
        </div>
        <div className="grid max-h-40 grid-cols-10 gap-1.5 overflow-y-auto rounded-xl border border-border p-2">
          {icons.map((option) => (
            <button
              key={option.name}
              type="button"
              aria-label={`Ikon ${option.name}`}
              onClick={() => setIcon(option.name)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                icon === option.name
                  ? "border-primary bg-accent text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              <option.icon className="size-4" />
            </button>
          ))}
          {icons.length === 0 ? (
            <p className="col-span-10 py-3 text-center text-caption text-muted-foreground">
              Ikon tidak ditemukan.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-label">Pilihan Warna Aksen (12 Palet)</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Warna ${value}`}
              onClick={() => setColor(value)}
              className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                color === value ? "border-foreground" : "border-transparent",
              )}
              style={{ backgroundColor: value }}
            >
              {color === value ? <Check className="size-3 text-white" /> : null}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={reset} disabled={!dirty || pending}>
          Batal Perubahan
        </Button>
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Simpan Perubahan
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
          <AlertTriangle className="size-4" />
          Zona Bahaya
        </p>
        <p className="text-caption text-muted-foreground">
          Tindakan di bawah ini mengubah atau menghapus kategori dan dapat
          memengaruhi laporan transaksi.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-2.5">
          <div>
            <p className="text-sm font-medium">Arsipkan Kategori</p>
            <p className="text-caption text-muted-foreground">
              Sembunyikan tanpa menghapus riwayat transaksi.
              {hasChildren
                ? " Pindahkan atau arsipkan sub-kategori terlebih dahulu."
                : ""}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={archive}
            disabled={hasChildren}
            title={hasChildren ? "Kategori masih memiliki sub-kategori" : undefined}
          >
            Arsipkan
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5">
          <div>
            <p className="text-sm font-medium text-destructive">
              Hapus Kategori Permanen
            </p>
            <p className="text-caption text-muted-foreground">
              Hanya untuk kategori tanpa transaksi dan sub-kategori.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Hapus Permanen
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus kategori permanen?</DialogTitle>
            <DialogDescription>
              Kategori “{category.name}” akan dihapus. Backend akan menolak jika
              kategori masih memiliki transaksi atau sub-kategori.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? <Loader2 className="animate-spin" /> : null}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
