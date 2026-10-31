"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import { cn } from "cn";

import type { Bill, BillStatus } from "@/lib/api/types/bill";
import { BILL_STATUS_LABELS } from "@/lib/types";
import { exportBillsCSV } from "@/lib/export";
import {
  formatIDR,
  formatTanggal,
  fromISODate,
  monthRange,
} from "@/lib/format";
import {
  currentPeriod,
  PeriodFilter,
  type PeriodValue,
} from "@/components/period-filter";
import { useBills, useBillSummary, useLenders } from "@/hooks/use-bills";
import { PageHeader } from "@/components/layout/page-header";
import { BillFormDialog } from "@/components/bills/bill-form-dialog";
import { BillPaymentDialog } from "@/components/bills/bill-payment-dialog";
import { DeleteBillDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TabValue = "" | BillStatus | "terlambat";

const TABS: { value: TabValue; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "belum_bayar", label: "Belum bayar" },
  { value: "sebagian", label: "Sebagian" },
  { value: "lunas", label: "Lunas" },
  { value: "terlambat", label: "Terlambat" },
];

const AVATAR_COLORS = [
  "bg-destructive/10 text-destructive",
  "bg-primary/10 text-primary",
  "bg-warning/15 text-[#8a5a00]",
  "bg-info/10 text-info",
  "bg-success/10 text-success",
];

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function statusClass(bill: Bill): string {
  if (bill.isOverdue) return "bg-destructive/10 text-destructive";
  if (bill.status === "lunas") return "bg-success/10 text-success";
  if (bill.status === "sebagian") return "bg-warning/15 text-[#8a5a00]";
  return "bg-muted text-muted-foreground";
}

function dueLabel(bill: Bill): string {
  if (bill.status === "lunas") return "Lunas";
  if (bill.isOverdue) return `Terlambat ${Math.abs(bill.daysUntilDue)} hari`;
  if (bill.daysUntilDue === 0) return "Jatuh tempo hari ini";
  return `${bill.daysUntilDue} hari lagi`;
}

function periodFromIso(iso?: string | null): PeriodValue {
  if (!iso) return currentPeriod();
  const date = fromISODate(iso);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export default function BillsPage() {
  return (
    <Suspense fallback={<BillsSkeleton />}>
      <BillsView />
    </Suspense>
  );
}

function BillsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);

  const debouncedQuery = useDebounced(query);
  const urlCreate = searchParams.get("form") === "bill";
  const createOpen = formOpen || urlCreate;

  const allPeriod = searchParams.get("period") === "all";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = fromParam ? fromISODate(fromParam) : null;
  const defaultNow = currentPeriod();
  const defaultRange =
    defaultNow.year != null && defaultNow.month != null
      ? monthRange(defaultNow.year, defaultNow.month)
      : { from: undefined, to: undefined };

  const rangeFrom = allPeriod ? undefined : (fromParam ?? defaultRange.from);
  const rangeTo = allPeriod
    ? undefined
    : fromParam
      ? (toParam ??
        (fromDate
          ? monthRange(fromDate.getFullYear(), fromDate.getMonth()).to
          : undefined))
      : defaultRange.to;

  const period = allPeriod
    ? { year: null, month: null }
    : periodFromIso(fromParam);
  const lenderId = searchParams.get("lenderId") ?? "";
  const rawStatus = searchParams.get("status");
  const tab: TabValue =
    searchParams.get("overdue") === "true"
      ? "terlambat"
      : rawStatus === "belum_bayar" ||
          rawStatus === "sebagian" ||
          rawStatus === "lunas"
        ? rawStatus
        : "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const status = tab === "" || tab === "terlambat" ? undefined : tab;
  const overdue = tab === "terlambat";

  const filter = useMemo(
    () => ({
      from: rangeFrom,
      to: rangeTo,
      q: debouncedQuery || undefined,
      lenderId: lenderId || undefined,
      status,
      overdue,
      page,
      limit: 20,
      sort: "due_date",
    }),
    [rangeFrom, rangeTo, debouncedQuery, lenderId, status, overdue, page],
  );

  const billsQuery = useBills(filter);
  const summaryQuery = useBillSummary({ from: rangeFrom, to: rangeTo });
  const overdueQuery = useBills({
    from: rangeFrom,
    to: rangeTo,
    overdue: true,
    limit: 1,
  });
  const lendersQuery = useLenders();

  const bills = billsQuery.data?.items ?? [];
  const meta = billsQuery.data?.meta;
  const summary = summaryQuery.data;
  const overdueCount = overdueQuery.data?.meta.total ?? 0;
  const lenderItems = [
    { label: "Semua lender", value: "all" },
    ...(lendersQuery.data ?? []).map((lender) => ({
      label: lender.name,
      value: lender.id,
    })),
  ];

  const statusCounts = useMemo(() => {
    const result: Record<BillStatus, number> = {
      belum_bayar: 0,
      sebagian: 0,
      lunas: 0,
    };
    for (const row of summary?.byStatus ?? []) result[row.status] = row.count;
    return result;
  }, [summary?.byStatus]);

  const allCount =
    statusCounts.belum_bayar + statusCounts.sebagian + statusCounts.lunas;

  function countFor(value: TabValue): number {
    if (value === "") return allCount;
    if (value === "terlambat") return overdueCount;
    return statusCounts[value];
  }

  const paidPercentage =
    summary && summary.total > 0
      ? Math.round((summary.paid / summary.total) * 1000) / 10
      : 0;

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function changePeriod(value: PeriodValue) {
    updateParams((params) => {
      params.delete("page");
      if (value.year == null || value.month == null) {
        params.set("period", "all");
        params.delete("from");
        params.delete("to");
        return;
      }
      params.delete("period");
      const next = monthRange(value.year, value.month);
      params.set("from", next.from);
      params.set("to", next.to);
    });
  }

  function changeTab(value: TabValue) {
    updateParams((params) => {
      params.delete("page");
      params.delete("status");
      params.delete("overdue");
      if (value === "terlambat") params.set("overdue", "true");
      else if (value) params.set("status", value);
    });
  }

  function changeLender(value: string) {
    updateParams((params) => {
      params.delete("page");
      if (value) params.set("lenderId", value);
      else params.delete("lenderId");
    });
  }

  function changeQuery(value: string) {
    setQuery(value);
    updateParams((params) => {
      params.delete("page");
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
    });
  }

  function resetFilters() {
    setQuery("");
    updateParams((params) => {
      for (const key of [
        "q",
        "lenderId",
        "status",
        "overdue",
        "from",
        "to",
        "page",
        "period",
      ]) {
        params.delete(key);
      }
    });
  }

  function changePage(next: number) {
    updateParams((params) => {
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));
    });
  }

  function closeForm(open: boolean) {
    if (open) return;
    setFormOpen(false);
    setEditing(null);
    if (urlCreate) {
      updateParams((params) => params.delete("form"));
    }
  }

  const firstRow =
    meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
  const lastRow = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tagihan & Utang"
        description="Pantau tagihan kredit, cicilan, dan utang bulanan tanpa terlewat."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                exportBillsCSV(bills, `${period.year}-${period.month}`)
              }
              disabled={bills.length === 0}
            >
              <Download className="size-4" />
              Ekspor
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4" />
              Catat tagihan
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Tagihan"
          value={summary?.total ?? 0}
          caption="Bulan berjalan"
          icon={<ReceiptText className="size-4" />}
          tone="primary"
        />
        <KpiCard
          label="Sudah Dibayar"
          value={summary?.paid ?? 0}
          caption={`${paidPercentage}% terkumpul`}
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
        <KpiCard
          label="Sisa Tagihan"
          value={summary?.remaining ?? 0}
          caption="Sisa periode ini"
          icon={<Wallet className="size-4" />}
          tone="warning"
        />
        <KpiCard
          label="Terlambat"
          value={summary?.overdueTotal ?? 0}
          caption={`${overdueCount} tagihan terlambat`}
          icon={<AlertTriangle className="size-4" />}
          tone="danger"
        />
      </div>

      <Card>
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1">
            {TABS.map((item) => (
              <button
                key={item.value || "all"}
                type="button"
                onClick={() => changeTab(item.value)}
                aria-pressed={tab === item.value}
                className={cn(
                  "min-h-7 rounded-lg px-2.5 text-caption transition-colors",
                  tab === item.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}{" "}
                <span className="text-[10px] opacity-75">
                  {countFor(item.value)}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => changeQuery(event.target.value)}
                placeholder="Cari tagihan atau cicilan…"
                className="h-9 rounded-xl pl-8"
              />
            </div>
            <Select
              items={lenderItems}
              value={lenderId || "all"}
              onValueChange={(value) =>
                changeLender(value === "all" ? "" : (value ?? ""))
              }
            >
              <SelectTrigger className="h-9 w-full rounded-xl bg-card">
                <SelectValue placeholder="Semua lender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua lender</SelectItem>
                {(lendersQuery.data ?? []).map((lender) => (
                  <SelectItem key={lender.id} value={lender.id}>
                    {lender.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PeriodFilter
              value={period}
              onChange={(value) => changePeriod(value)}
            />
            <Button
              variant="ghost"
              className="h-9 justify-start"
              onClick={resetFilters}
            >
              Reset filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {billsQuery.isLoading ? (
            <BillsSkeleton />
          ) : billsQuery.isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-destructive">
                  Gagal memuat tagihan: {billsQuery.error.message}
                </p>
                <Button variant="outline" onClick={() => billsQuery.refetch()}>
                  Coba lagi
                </Button>
              </CardContent>
            </Card>
          ) : bills.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm font-medium">Belum ada tagihan</p>
                <p className="max-w-sm text-caption text-muted-foreground">
                  {query || lenderId || tab
                    ? "Coba ubah filter atau periode."
                    : "Catat tagihan pertama untuk mulai memantau utang."}
                </p>
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="size-4" />
                  Catat tagihan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Pemberi Pinjaman</TableHead>
                      <TableHead>Deskripsi / Cicilan</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead>Progres Pembayaran</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill, index) => {
                      const progress =
                        bill.amount > 0
                          ? Math.min(100, (bill.paidAmount / bill.amount) * 100)
                          : 0;
                      return (
                        <TableRow key={bill.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold",
                                  AVATAR_COLORS[index % AVATAR_COLORS.length],
                                )}
                              >
                                {bill.lender.name.slice(0, 2).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {bill.lender.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Pemberi pinjaman
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="max-w-52 truncate text-sm">
                              {bill.deskripsi || "Tagihan"}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {bill.installmentTotal
                                ? `Cicilan ${bill.installmentIndex ?? 1}/${bill.installmentTotal}`
                                : "Tanpa cicilan"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {formatTanggal(bill.dueDate)}
                            </p>
                            <span className="text-[10px] text-muted-foreground">
                              {dueLabel(bill)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    bill.isOverdue
                                      ? "bg-destructive"
                                      : bill.status === "lunas"
                                        ? "bg-success"
                                        : "bg-primary",
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="num text-[10px] text-muted-foreground">
                                {Math.round(progress)}%
                              </span>
                              <span
                                className={cn(
                                  "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                                  statusClass(bill),
                                )}
                              >
                                {bill.isOverdue
                                  ? "Terlambat"
                                  : BILL_STATUS_LABELS[bill.status]}
                              </span>
                            </div>
                            <p className="num text-[10px] text-muted-foreground">
                              {formatIDR(bill.paidAmount)} /{" "}
                              {formatIDR(bill.amount)}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="num text-sm font-medium">
                              {formatIDR(bill.remainingAmount)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Aksi tagihan"
                                  />
                                }
                              >
                                <MoreHorizontal className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {bill.status !== "lunas" ? (
                                  <DropdownMenuItem
                                    onClick={() => setPayBill(bill)}
                                  >
                                    Bayar tagihan
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditing(bill);
                                    setFormOpen(true);
                                  }}
                                >
                                  Ubah tagihan
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteTarget(bill)}
                                >
                                  Hapus tagihan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 md:hidden">
                {bills.map((bill) => (
                  <BillMobileCard
                    key={bill.id}
                    bill={bill}
                    onPay={() => setPayBill(bill)}
                    onEdit={() => {
                      setEditing(bill);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleteTarget(bill)}
                  />
                ))}
              </div>

              {meta && meta.total > 0 ? (
                <div className="flex flex-col items-center justify-between gap-2 text-caption text-muted-foreground sm:flex-row">
                  <p>
                    Menampilkan {firstRow}–{lastRow} dari {meta.total} tagihan
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => changePage(Math.max(1, page - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <span className="num">
                      {meta.page} / {meta.totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => changePage(page + 1)}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Beban Bulan Ini</CardTitle>
              <p className="text-caption text-muted-foreground">
                Komposisi status tagihan
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <BillStatusDonut summary={summary} />
              <div className="space-y-1.5">
                {(summary?.byStatus ?? []).map((row) => (
                  <div
                    key={row.status}
                    className="flex items-center justify-between text-caption"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          row.status === "lunas"
                            ? "bg-success"
                            : row.status === "sebagian"
                              ? "bg-warning"
                              : "bg-primary",
                        )}
                      />
                      {BILL_STATUS_LABELS[row.status]}
                    </span>
                    <span className="num">{formatIDR(row.total)}</span>
                  </div>
                ))}
                {overdueCount > 0 ? (
                  <div className="flex items-center justify-between text-caption text-destructive">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-destructive" />
                      Terlambat
                    </span>
                    <span className="num">{overdueCount} tagihan</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Berdasarkan Lender</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(summary?.perLender ?? []).length === 0 ? (
                <p className="py-4 text-center text-caption text-muted-foreground">
                  Belum ada data lender.
                </p>
              ) : (
                [...(summary?.perLender ?? [])]
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 6)
                  .map((row) => {
                    const percent =
                      summary && summary.total > 0
                        ? Math.round((row.total / summary.total) * 1000) / 10
                        : 0;
                    return (
                      <div key={row.lenderId} className="space-y-1">
                        <div className="flex items-center justify-between text-caption">
                          <span className="truncate">{row.lender.name}</span>
                          <span className="num text-muted-foreground">
                            {formatIDR(row.total)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground">
                          {percent}%
                        </p>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {createOpen ? (
        <BillFormDialog
          key={editing?.id ?? "new"}
          open
          onOpenChange={closeForm}
          bill={editing}
        />
      ) : null}

      {payBill ? (
        <BillPaymentDialog
          key={payBill.id}
          open
          onOpenChange={(open) => {
            if (!open) setPayBill(null);
          }}
          bill={payBill}
        />
      ) : null}

      <DeleteBillDialog
        bill={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  caption,
  icon,
  tone,
}: {
  label: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  tone: "primary" | "success" | "warning" | "danger";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div>
          <p className="text-caption text-muted-foreground">{label}</p>
          <p className="num mt-1 text-xl font-semibold">{formatIDR(value)}</p>
          <p className="text-caption text-muted-foreground">{caption}</p>
        </div>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            toneClass,
          )}
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function BillStatusDonut({
  summary,
}: {
  summary?: {
    total: number;
    paid: number;
    byStatus: { status: BillStatus; total: number }[];
  };
}) {
  const rows = summary?.byStatus ?? [];
  const total = summary?.total ?? 0;

  const segments = rows.map((row, index) => {
    const previous = rows
      .slice(0, index)
      .reduce(
        (sum, item) => sum + (total > 0 ? (item.total / total) * 100 : 0),
        0,
      );
    const percentage = total > 0 ? (row.total / total) * 100 : 0;
    return {
      color:
        row.status === "lunas"
          ? "var(--success)"
          : row.status === "sebagian"
            ? "var(--warning)"
            : "var(--primary)",
      start: previous,
      end: previous + percentage,
    };
  });

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map(
            (segment) => `${segment.color} ${segment.start}% ${segment.end}%`,
          )
          .join(", ")})`
      : "conic-gradient(var(--muted) 0% 100%)";

  const paidPercent =
    summary && summary.total > 0
      ? Math.round((summary.paid / summary.total) * 1000) / 10
      : 0;

  return (
    <div className="flex justify-center">
      <div
        className="relative flex size-32 items-center justify-center rounded-full"
        style={{ background: gradient }}
        role="img"
        aria-label="Komposisi status tagihan"
      >
        <div className="flex size-20 flex-col items-center justify-center rounded-full bg-card text-center">
          <span className="text-[9px] text-muted-foreground">
            TOTAL TAGIHAN
          </span>
          <span className="num text-sm font-semibold">{formatIDR(total)}</span>
          <span className="text-[9px] text-muted-foreground">
            {paidPercent}% terbayar
          </span>
        </div>
      </div>
    </div>
  );
}

function BillMobileCard({
  bill,
  onPay,
  onEdit,
  onDelete,
}: {
  bill: Bill;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress =
    bill.amount > 0 ? Math.min(100, (bill.paidAmount / bill.amount) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{bill.lender.name}</p>
            <p className="truncate text-caption text-muted-foreground">
              {bill.deskripsi || "Tagihan"}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              statusClass(bill),
            )}
          >
            {bill.isOverdue ? "Terlambat" : BILL_STATUS_LABELS[bill.status]}
          </span>
        </div>
        <div className="flex items-center justify-between text-caption">
          <span className="text-muted-foreground">
            Jatuh tempo {formatTanggal(bill.dueDate)}
          </span>
          <span className="font-medium">{dueLabel(bill)}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full",
              bill.isOverdue
                ? "bg-destructive"
                : bill.status === "lunas"
                  ? "bg-success"
                  : "bg-primary",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="num text-caption text-muted-foreground">
            Sisa {formatIDR(bill.remainingAmount)}
          </p>
          <div className="flex gap-1">
            {bill.status !== "lunas" ? (
              <Button size="sm" onClick={onPay}>
                Bayar
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={onEdit}>
              Ubah
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              Hapus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BillsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-16 w-full rounded-2xl" />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
