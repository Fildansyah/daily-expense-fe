"use client"

import { ChevronDown, ChevronRight, Eye } from "lucide-react"
import { cn } from "cn"

import type { Category } from "@/lib/api/types/category"
import { categoryTotalCount } from "@/lib/categories"
import { CategoryIcon } from "@/components/category-icon"

interface CategoryTreeProps {
  tree: Category[]
  search: string
  selectedId?: string
  collapsed: Set<string>
  onToggle: (id: string) => void
  onSelect: (category: Category) => void
}

function matches(name: string, query: string): boolean {
  return name.toLowerCase().includes(query)
}

export function CategoryTree({
  tree,
  search,
  selectedId,
  collapsed,
  onToggle,
  onSelect,
}: CategoryTreeProps) {
  const query = search.trim().toLowerCase()

  return (
    <div className="space-y-0.5">
      {tree.map((root) => {
        const children = root.children ?? []
        const rootMatches = query ? matches(root.name, query) : true
        const visibleChildren = query
          ? children.filter((child) => rootMatches || matches(child.name, query))
          : children

        if (query && !rootMatches && visibleChildren.length === 0) return null

        const isCollapsed = collapsed.has(root.id)
        const rootSelected = selectedId === root.id

        return (
          <div key={root.id}>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={rootSelected}
              onClick={() => onSelect(root)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onSelect(root)
                }
              }}
              className={cn(
                "flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                rootSelected ? "bg-accent ring-2 ring-primary" : "hover:bg-muted/60",
              )}
            >
              {children.length > 0 ? (
                <button
                  type="button"
                  aria-label={
                    isCollapsed ? `Buka ${root.name}` : `Tutup ${root.name}`
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggle(root.id)
                  }}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </button>
              ) : (
                <span className="flex size-5 shrink-0 items-center justify-center">
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                </span>
              )}

              <CategoryIcon icon={root.icon} color={root.bgColor} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {root.name}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {categoryTotalCount(root)}
              </span>
            </div>

            {!isCollapsed && visibleChildren.length > 0 ? (
              <div className="mt-0.5 ml-4 space-y-0.5 border-l border-border/70 pl-2">
                {visibleChildren.map((child) => {
                  const childSelected = selectedId === child.id
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child)}
                      aria-pressed={childSelected}
                      className={cn(
                        "flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                        childSelected
                          ? "bg-accent ring-2 ring-primary"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <CategoryIcon
                        icon={child.icon}
                        color={child.bgColor}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{child.name}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {root.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {child.transactionCount}
                      </span>
                      <Eye
                        className="size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden
                      />
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
