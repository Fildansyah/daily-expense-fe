import {
  deriveRemaining,
  deriveStatus,
  type AuthResponse,
  type Bill,
  type BillFilters,
  type BillInput,
  type BillSummary,
  type Lender,
  type LenderSummary,
  type LoginRequest,
  type RegisterInput,
  type User,
} from "./types";

// Nilai NEXT_PUBLIC_API_URL harus absolut (https://domain/api) atau root-relative
// (/api). Tanpa skema, fetch akan memperlakukannya sebagai path relatif dan
// menempelkannya ke URL halaman — mis. https://domain/domain/public/user/login.
function normalizeApiUrl(raw: string): string {
  const value = raw.trim().replace(/\/+$/, "");
  if (!value) return "";
  if (value.startsWith("/")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}

const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "");

// Base URL untuk endpoint publik (login/register). Backend menyajikan auth
// di `/public` dan resource di `/api`, sehingga kita turunkan dari API_URL
// (konvensi: diakhiri `/api`).
const PUBLIC_URL = API_URL
  ? `${API_URL.replace(/\/api$/, "")}/public`
  : "/public";

if (API_URL && !API_URL.endsWith("/api")) {
  console.warn(
    `NEXT_PUBLIC_API_URL sebaiknya diakhiri "/api" (nilai sekarang: ${API_URL}).`,
  );
}

export const USE_MOCK = !API_URL;

/* ------------------------------ Auth token ----------------------------- */
// Access token hanya disimpan di memori (tidak pernah di localStorage).
// Refresh token ada di cookie httpOnly yang dikelola browser.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Handler yang dipanggil saat sesi benar-benar tidak valid (refresh gagal).
// AuthProvider mendaftarkan fungsi untuk membersihkan state auth.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

/* ------------------------------------------------------------------ */
/*  Implementasi HTTP — dipakai saat NEXT_PUBLIC_API_URL diisi        */
/*  Standar respons API (Go Fiber):                                  */
/*    { "status": "success", "data": ... }                            */
/*    { "status": "error", "error": "pesan" }                         */
/* ------------------------------------------------------------------ */
interface ApiEnvelope<T> {
  status?: string;
  data?: T;
  error?: string;
}

type RequestOptions = {
  auth?: boolean;
  retryOn401?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const result = await requestUrl<AuthResponse>(
          `${PUBLIC_URL}/auth/refresh`,
          { method: "POST" },
          { auth: false, retryOn401: false },
        );
        setAccessToken(result.accessToken);
        return result.accessToken;
      } catch {
        setAccessToken(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function requestUrl<T>(
  url: string,
  init?: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, retryOn401 = true } = options;

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    // Cookie refresh hanya dikirim ke endpoint auth.
    credentials: auth ? "same-origin" : "include",
  });

  if (res.status === 204) return undefined as T;

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* respons tanpa body JSON */
  }

  if (res.status === 401) {
    if (auth && retryOn401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return requestUrl<T>(url, init, { auth: true, retryOn401: false });
      }
    }

    if (auth) {
      setAccessToken(null);
      onUnauthorized?.();
      throw new Error(body?.error ?? "Sesi berakhir, silakan login kembali");
    }

    throw new Error(body?.error ?? "Email atau kata sandi salah");
  }

  if (!res.ok || body?.status === "error") {
    const message =
      body?.error ??
      (body?.status === "error" ? "Terjadi kesalahan" : null) ??
      `Request gagal (${res.status})`;
    throw new Error(message);
  }

  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }

  return body as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestUrl<T>(`${API_URL}${path}`, init);
}

function buildQuery(filters: BillFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.lender) params.set("lender", filters.lender);
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  const s = params.toString();
  return s ? `?${s}` : "";
}

/* ------------------------------------------------------------------ */
/*  Implementasi HTTP — dipakai saat NEXT_PUBLIC_API_URL diisi        */
/* ------------------------------------------------------------------ */
const httpApi = {
  list: (filters: BillFilters) => request<Bill[]>(`/bills${buildQuery(filters)}`),
  get: (id: string) => request<Bill>(`/bills/${id}`),
  create: (data: BillInput) =>
    request<Bill>("/bills", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: BillInput) =>
    request<Bill>(`/bills/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/bills/${id}`, { method: "DELETE" }),
  summary: (filters: BillFilters) =>
    request<BillSummary>(`/bills/summary${buildQuery(filters)}`),
  lenders: () => request<Lender[]>("/lenders"),
};

export const authApi = {
  login: (email: string, password: string) =>
    requestUrl<AuthResponse>(
      `${PUBLIC_URL}/user/login`,
      {
        method: "POST",
        body: JSON.stringify({ email, password } as LoginRequest),
      },
      { auth: false, retryOn401: false },
    ),
  refresh: () =>
    requestUrl<AuthResponse>(
      `${PUBLIC_URL}/auth/refresh`,
      { method: "POST" },
      { auth: false, retryOn401: false },
    ),
  logout: () =>
    requestUrl<{ message: string }>(
      `${PUBLIC_URL}/auth/logout`,
      { method: "POST" },
      { auth: false, retryOn401: false },
    ),
  register: (input: RegisterInput) =>
    requestUrl<User>(
      `${PUBLIC_URL}/user`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      { auth: false, retryOn401: false },
    ),
  me: () => request<User>("/user/me"),
};

/* ------------------------------------------------------------------ */
/*  Implementasi mock — data tersimpan di localStorage                 */
/* ------------------------------------------------------------------ */
const BILLS_KEY = "daily-expense.bills.v1";

const DEFAULT_LENDERS: Lender[] = [
  { id: "gopay", name: "GoPay" },
  { id: "shopeepay", name: "ShopeePay" },
  { id: "tiktok", name: "TikTok" },
  { id: "spinjam", name: "SpinJam" },
  { id: "mandiri", name: "Mandiri" },
];

function seedBills(): Bill[] {
  const now = new Date().toISOString();
  const mk = (
    id: string,
    lender: string,
    amount: number,
    dueDate: string,
    paidAmount: number,
    deskripsi: string,
  ): Bill => {
    const remaining = deriveRemaining(amount, paidAmount);
    return {
      id,
      lender,
      amount,
      dueDate,
      paidAmount,
      remainingAmount: remaining,
      status: deriveStatus(paidAmount, amount),
      deskripsi,
      createdAt: now,
      updatedAt: now,
    };
  };
  return [
    mk("b1", "gopay", 139000, "2026-11-01", 0, "shopping"),
    mk("b2", "shopeepay", 126000, "2026-11-01", 0, "gir motor"),
    mk("b3", "shopeepay", 115911, "2026-11-01", 0, "shopping"),
    mk("b4", "tiktok", 250000, "2026-11-05", 0, "cicilan hp"),
    mk("b5", "spinjam", 310294, "2026-11-10", 0, "pinjaman"),
    mk("b6", "mandiri", 180000, "2026-11-15", 0, "kredit motor"),
    mk("b7", "mandiri", 450000, "2026-12-01", 0, "kredit motor"),
    mk("b8", "spinjam", 600000, "2026-12-10", 0, "pinjaman"),
    mk("b9", "tiktok", 277524, "2026-12-15", 0, "cicilan hp"),
    mk("b10", "gopay", 300000, "2027-01-05", 0, "top up kredit"),
    mk("b11", "shopeepay", 400000, "2027-01-10", 0, "shopping"),
    mk("b12", "mandiri", 850000, "2026-10-01", 300000, "pelunasan bertahap"),
    mk("b13", "gopay", 250000, "2026-09-15", 250000, "lunas bulan lalu"),
  ];
}

function readBills(): Bill[] {
  if (typeof window === "undefined") return seedBills();
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    if (!raw) {
      const seed = seedBills();
      localStorage.setItem(BILLS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Bill[];
  } catch {
    return seedBills();
  }
}

function writeBills(bills: Bill[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function matches(bill: Bill, filters: BillFilters): boolean {
  if (filters.from && bill.dueDate < filters.from) return false;
  if (filters.to && bill.dueDate > filters.to) return false;
  if (filters.lender && bill.lender !== filters.lender) return false;
  if (filters.status && bill.status !== filters.status) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const hay = `${bill.deskripsi} ${bill.lender}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function buildSummary(filters: BillFilters, bills: Bill[]): BillSummary {
  const inPeriod = bills.filter((b) => matches(b, filters));
  const sum = (xs: Bill[], f: (b: Bill) => number) => xs.reduce((a, b) => a + f(b), 0);
  const byLender = new Map<string, LenderSummary>();
  for (const b of inPeriod) {
    const cur = byLender.get(b.lender) ?? {
      lender: b.lender,
      count: 0,
      total: 0,
      paid: 0,
      remaining: 0,
    };
    cur.count += 1;
    cur.total += b.amount;
    cur.paid += b.paidAmount;
    cur.remaining += b.remainingAmount;
    byLender.set(b.lender, cur);
  }
  return {
    total: sum(inPeriod, (b) => b.amount),
    paid: sum(inPeriod, (b) => b.paidAmount),
    remaining: sum(inPeriod, (b) => b.remainingAmount),
    remainingAll: sum(bills, (b) => b.remainingAmount),
    perLender: [...byLender.values()].sort((a, b) => a.lender.localeCompare(b.lender)),
  };
}

const mockApi = {
  async list(filters: BillFilters): Promise<Bill[]> {
    await delay();
    return readBills()
      .filter((b) => matches(b, filters))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
  async get(id: string): Promise<Bill> {
    await delay();
    const bill = readBills().find((b) => b.id === id);
    if (!bill) throw new Error("Tagihan tidak ditemukan");
    return bill;
  },
  async create(data: BillInput): Promise<Bill> {
    await delay();
    const bills = readBills();
    const now = new Date().toISOString();
    const bill: Bill = {
      id: crypto.randomUUID(),
      ...data,
      remainingAmount: deriveRemaining(data.amount, data.paidAmount),
      status: deriveStatus(data.paidAmount, data.amount),
      createdAt: now,
      updatedAt: now,
    };
    bills.push(bill);
    writeBills(bills);
    return bill;
  },
  async update(id: string, data: BillInput): Promise<Bill> {
    await delay();
    const bills = readBills();
    const idx = bills.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Tagihan tidak ditemukan");
    const now = new Date().toISOString();
    bills[idx] = {
      ...bills[idx],
      ...data,
      remainingAmount: deriveRemaining(data.amount, data.paidAmount),
      status: deriveStatus(data.paidAmount, data.amount),
      updatedAt: now,
    };
    writeBills(bills);
    return bills[idx];
  },
  async remove(id: string): Promise<void> {
    await delay();
    writeBills(readBills().filter((b) => b.id !== id));
  },
  async summary(filters: BillFilters): Promise<BillSummary> {
    await delay();
    return buildSummary(filters, readBills());
  },
  async lenders(): Promise<Lender[]> {
    await delay(100);
    return DEFAULT_LENDERS;
  },
};

export const billsApi = USE_MOCK ? mockApi : httpApi;
export { DEFAULT_LENDERS };
