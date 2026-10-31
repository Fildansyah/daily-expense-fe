"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    <div className="space-y-3 md:space-y-4">
      <div className="hidden md:block">
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
      </div>

      <Card className="md:hidden">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Kewajiban Rutin</p>
              <p className="text-[10px] text-muted-foreground">
                Ringkasan tagihan periode ini
              </p>
            </div>
            <PeriodFilter
              value={period}
              onChange={(value) => changePeriod(value)}
              className="h-8 w-auto shrink-0 rounded-full px-2.5 text-[11px]"
            />
          </div>

          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="pr-2">
              <p className="text-[10px] text-muted-foreground">Total Tagihan</p>
              <p className="num mt-0.5 truncate text-xs font-semibold">
                {formatIDR(summary?.total ?? 0)}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {allCount} tagihan aktif
              </p>
            </div>
            <div className="px-2">
              <p className="text-[10px] text-muted-foreground">Terbayar</p>
              <p className="num mt-0.5 truncate text-xs font-semibold text-success">
                {formatIDR(summary?.paid ?? 0)}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {statusCounts.lunas} lunas
              </p>
            </div>
            <div className="pl-2">
              <p className="text-[10px] text-muted-foreground">Sisa</p>
              <p className="num mt-0.5 truncate text-xs font-semibold text-warning">
                {formatIDR(summary?.remaining ?? 0)}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {statusCounts.belum_bayar + statusCounts.sebagian} menunggu
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="truncate font-medium">
                Bulan ini: {formatIDR(summary?.total ?? 0)}
              </span>
              <span className="num shrink-0 text-muted-foreground">
                {paidPercentage}%
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, paidPercentage)}%` }}
              />
            </div>
            <p className="mt-1 text-[9px] text-muted-foreground">
              Tagihan terbayar dari total periode berjalan
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
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

      <Card className="bg-transparent py-0 ring-0 md:bg-card md:py-4 md:ring-1">
        <CardContent className="space-y-3 p-0 md:p-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-1 overflow-x-auto md:flex-wrap md:overflow-visible md:rounded-xl md:border md:border-border md:bg-card md:p-1">
              {TABS.map((item) => (
                <button
                  key={item.value || "all"}
                  type="button"
                  onClick={() => changeTab(item.value)}
                  aria-pressed={tab === item.value}
                  className={cn(
                    "min-h-7 shrink-0 rounded-full border px-3 text-[11px] transition-colors md:rounded-lg md:border-0 md:px-2.5 md:text-caption",
                    tab === item.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground md:bg-transparent",
                  )}
                >
                  {item.label}{" "}
                  <span className="text-[10px] opacity-75">
                    {countFor(item.value)}
                  </span>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Filter tagihan"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((value) => !value)}
              className={cn(
                "shrink-0 md:hidden",
                mobileFiltersOpen && "border-primary text-primary",
              )}
            >
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4",
              !mobileFiltersOpen && "hidden md:grid",
            )}
          >
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
            <div className="hidden md:block">
              <PeriodFilter
                value={period}
                onChange={(value) => changePeriod(value)}
              />
            </div>
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
  const overdue = bill.isOverdue;
  const paid = bill.status === "lunas";
  const dueSoon = !overdue && !paid && bill.daysUntilDue <= 3;

  return (
    <Card
      className={cn(
        "gap-0 border-l-4 py-0",
        paid
          ? "border-l-success"
          : overdue
            ? "border-l-destructive"
            : dueSoon
              ? "border-l-warning"
              : "border-l-primary",
      )}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              paid
                ? "bg-success/10 text-success"
                : overdue
                  ? "bg-destructive/10 text-destructive"
                  : "bg-warning/15 text-[#8a5a00]",
            )}
          >
            <ReceiptText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{bill.lender.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {bill.deskripsi || "Tagihan"}
              {bill.installmentTotal
                ? ` · Cicilan ${bill.installmentIndex ?? 1}/${bill.installmentTotal}`
                : ""}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              Jatuh tempo {formatTanggal(bill.dueDate)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="num text-sm font-semibold whitespace-nowrap">
              {formatIDR(bill.remainingAmount)}
            </p>
            <span
              className={cn(
                "mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                statusClass(bill),
              )}
            >
              {overdue ? "Terlambat" : BILL_STATUS_LABELS[bill.status]}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Aksi tagihan"
                  className="shrink-0"
                />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Ubah tagihan</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Hapus tagihan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {overdue ? (
          <p className="rounded-lg bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive">
            Segera selesaikan sebelum denda
          </p>
        ) : dueSoon ? (
          <p className="rounded-lg bg-warning/15 px-2 py-1 text-[10px] font-medium text-[#8a5a00]">
            Segera selesaikan sebelum jatuh tempo
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] text-muted-foreground">
            {bill.wallet?.name ?? "—"}
          </p>
          {paid ? (
            <span className="text-[10px] font-medium text-success">
              Sudah lunas
            </span>
          ) : (
            <Button
              size="sm"
              variant={dueSoon || overdue ? "default" : "outline"}
              className={cn(
                "h-8 rounded-lg px-3",
                overdue && "bg-destructive text-white hover:bg-destructive/90",
              )}
              onClick={onPay}
            >
              {overdue ? "Bayar Sekarang" : "Bayar"}
            </Button>
          )}
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
