"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "cn"

import type { Category } from "@/lib/api/types/category"
import { flattenCategories, type FlatCategory } from "@/lib/categories"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CategoryPickerProps {
  categories: Category[]
  value?: string
  onChange: (categoryId: string, category: FlatCategory) => void
  placeholder?: string
  className?: string
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = "Pilih kategori",
  className,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const flat = useMemo(() => flattenCategories(categories), [categories])
  const selected = flat.find((category) => category.id === value)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return flat
    return flat.filter(
      (category) =>
        category.name.toLowerCase().includes(keyword) ||
        (category.parentName ?? "").toLowerCase().includes(keyword),
    )
  }, [flat, query])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "h-auto min-h-11 w-full justify-between gap-2 rounded-xl bg-card px-3 py-2 text-left",
              className,
            )}
          />
        }
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            <CategoryIcon icon={selected.icon} color={selected.bgColor} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{selected.name}</span>
              {selected.parentName ? (
                <span className="block truncate text-caption text-muted-foreground">
                  {selected.parentName}
                </span>
              ) : null}
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kategori…"
            className="h-9 pl-8"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Kategori tidak ditemukan.
            </p>
          ) : (
            filtered.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id, category)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                  category.depth > 0 && "pl-7",
                )}
              >
                <CategoryIcon icon={category.icon} color={category.bgColor} size="sm" />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm",
                      category.depth === 0 ? "font-medium" : "font-normal",
                    )}
                  >
                    {category.name}
                  </span>
                  {category.parentName ? (
                    <span className="block truncate text-caption text-muted-foreground">
                      {category.parentName}
                    </span>
                  ) : null}
                </span>
                {category.id === value ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
