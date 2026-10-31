"use client"

import { useMemo, useState } from "react"
import { Check, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { CATEGORY_COLORS, countCategoryTree } from "@/lib/categories"
import { useCategoryTree, useCreateCategory } from "@/hooks/use-categories"
import { useTransactionTypes } from "@/hooks/use-transaction-types"
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

type CategoryFlow = "EXPENSE" | "INCOME"

const FLOW_LABEL: Record<string, string> = {
  EXPENSE: "Pengeluaran",
  INCOME: "Pemasukan",
  TRANSFER: "Transfer",
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: CategoryFlow
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  defaultType = "EXPENSE",
}: CategoryFormDialogProps) {
  const createCategory = useCreateCategory()
  const typesQuery = useTransactionTypes()

  const [type, setType] = useState<CategoryFlow>(defaultType)
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState("")
  const [icon, setIcon] = useState("coffee")
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [parentQuery, setParentQuery] = useState("")
  const [iconQuery, setIconQuery] = useState("")
  const [error, setError] = useState<string | null>(null)

  const treeQuery = useCategoryTree(type)
  const roots = useMemo(() => treeQuery.data ?? [], [treeQuery.data])
  const stats = countCategoryTree(roots)

  const selectedParent = roots.find((root) => root.id === parentId)

  const filteredRoots = useMemo(() => {
    const keyword = parentQuery.trim().toLowerCase()
    if (!keyword) return roots
    return roots.filter(
      (root) =>
        root.name.toLowerCase().includes(keyword) ||
        (root.children ?? []).some((child) =>
          child.name.toLowerCase().includes(keyword),
        ),
    )
  }, [roots, parentQuery])

  const icons = useMemo(() => {
    const keyword = iconQuery.trim().toLowerCase()
    if (!keyword) return CATEGORY_ICON_OPTIONS
    return CATEGORY_ICON_OPTIONS.filter((option) =>
      option.name.includes(keyword),
    )
  }, [iconQuery])

  function changeType(next: CategoryFlow) {
    setType(next)
    setParentId("")
    setParentQuery("")
    setError(null)
  }

  function submit() {
    const trimmed = name.trim()
    if (!trimmed) return setError("Nama kategori wajib diisi.")
    if (trimmed.length > 30) {
      return setError("Nama kategori maksimal 30 karakter.")
    }

    const typeRow = (typesQuery.data ?? []).find((item) => item.type === type)
    if (!typeRow) {
      return setError(
        "Transaction type belum tersedia. Muat ulang halaman lalu coba lagi.",
      )
    }

    const parent = roots.find((root) => root.id === parentId)
    const sortOrder = parent
      ? (parent.children ?? []).length
      : roots.length

    createCategory.mutate(
      {
        name: trimmed,
        transactionTypeId: typeRow.id,
        parentId: parentId || null,
        bgColor: color,
        icon,
        sortOrder,
        isArchived: false,
      },
      {
        onSuccess: () => {
          toast.success("Kategori ditambahkan")
          onOpenChange(false)
        },
        onError: (mutationError) => setError(mutationError.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CategoryIcon icon={icon} color={color} size="sm" />
            Tambah Kategori
          </DialogTitle>
          <DialogDescription>
            Atur pengelompokan usaha atau pengeluaran baru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              TIPE TRANSAKSI
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">
              {(["EXPENSE", "INCOME"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeType(option)}
                  aria-pressed={type === option}
                  className={cn(
                    "min-h-8 rounded-lg text-label transition-colors",
                    type === option
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {FLOW_LABEL[option]}
                </button>
              ))}
              <button
                type="button"
                disabled
                title="Transfer tidak memakai kategori"
                className="min-h-8 rounded-lg text-label text-muted-foreground opacity-50"
              >
                Transfer
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-accent/40 p-3">
            <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground">
              PRATINJAU LANGSUNG
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-card p-3">
              <CategoryIcon icon={icon} color={color} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">
                    {name || "Nama kategori"}
                  </p>
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-medium text-accent-foreground">
                    {FLOW_LABEL[type]}
                  </span>
                  {parentId ? (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                      Sub-Kategori Aktif
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-caption text-muted-foreground">
                  {selectedParent
                    ? `Induk: ${selectedParent.name}`
                    : "Kategori utama"}
                </p>
                <p className="text-caption text-muted-foreground">
                  Belum ada transaksi
                </p>
              </div>
              <p className="num shrink-0 text-lg font-semibold text-muted-foreground">
                Rp 0
              </p>
            </div>
          </div>

          <label className="block space-y-1.5">
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
              placeholder="mis. Kopi & Kafe"
              className="h-10 rounded-xl"
            />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-label">Induk Kategori</p>
              <span className="text-caption text-muted-foreground">
                {stats.total} kategori pada tipe ini
              </span>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={parentQuery}
                onChange={(event) => setParentQuery(event.target.value)}
                placeholder="Cari kategori induk…"
                className="h-9 rounded-xl pl-8"
              />
            </div>

            <div className="max-h-44 overflow-y-auto rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setParentId("")}
                className={cn(
                  "flex w-full items-center gap-2 border-b border-border px-2.5 py-2 text-left text-sm transition-colors",
                  parentId === ""
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/60",
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <CategoryIcon icon="tag" size="sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    Tanpa Induk (Jadikan Kategori Utama)
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    Tingkat 1
                  </span>
                </span>
                {parentId === "" ? <Check className="size-4 text-primary" /> : null}
              </button>

              {filteredRoots.map((root) => {
                const keyword = parentQuery.trim().toLowerCase()
                const children = keyword
                  ? (root.children ?? []).filter((child) =>
                      child.name.toLowerCase().includes(keyword),
                    )
                  : (root.children ?? [])

                return (
                  <div key={root.id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setParentId(root.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm transition-colors",
                        parentId === root.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <CategoryIcon
                        icon={root.icon}
                        color={root.bgColor}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{root.name}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          Root (Bisa dipilih)
                        </span>
                      </span>
                      {parentId === root.id ? (
                        <Check className="size-4 text-primary" />
                      ) : null}
                    </button>

                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 py-1 pr-2.5 pl-9 text-caption text-muted-foreground/60"
                      >
                        <CategoryIcon
                          icon={child.icon}
                          color={child.bgColor}
                          size="sm"
                        />
                        <span className="truncate">{child.name}</span>
                        <span className="ml-auto text-[9px]">
                          Sub-level tidak dapat dipilih
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}

              {filteredRoots.length === 0 ? (
                <p className="px-3 py-4 text-center text-caption text-muted-foreground">
                  Kategori induk tidak ditemukan.
                </p>
              ) : null}
            </div>
            <p className="text-caption text-muted-foreground">
              Pilih induk untuk menjadikannya sub-kategori. Maksimal 2 level
              hierarki.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-label">Pilih Ikon</p>
              <span className="text-caption text-muted-foreground">
                {icon}
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={iconQuery}
                onChange={(event) => setIconQuery(event.target.value)}
                placeholder="Cari ikon (cth: kopi, belajar, musik)…"
                className="h-9 rounded-xl pl-8"
              />
            </div>
            <div className="grid max-h-36 grid-cols-10 gap-1.5 overflow-y-auto rounded-xl border border-border p-2">
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
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-label">Warna Aksen</p>
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
        </div>

        <DialogFooter className="items-center">
          <label className="mr-auto flex items-center gap-2 text-caption text-muted-foreground">
            <span className="flex size-4 items-center justify-center rounded border border-primary bg-primary text-primary-foreground">
              <Check className="size-3" />
            </span>
            Pembaruan langsung tersimpan ke cloud
          </label>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={createCategory.isPending}>
            {createCategory.isPending ? <Loader2 className="animate-spin" /> : null}
            Simpan Kategori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
