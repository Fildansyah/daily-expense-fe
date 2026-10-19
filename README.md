# Daily Expense — Pencatatan Kredit & PayLater

Web app untuk mencatat tagihan kredit dan paylater (menggantikan pencatatan Excel). Dibangun dengan **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui**, responsive (sidebar di desktop, bottom navigation di mobile).

## Fitur

- **Dashboard** — ringkasan *Incoming Due* (periode), Total Tagihan, Sudah Dibayar, *Remaining Amount* (semua), rincian per lender, tagihan jatuh tempo 7 hari ke depan, dan peringatan tagihan lewat tempo.
- **Tagihan** — daftar tagihan dengan filter periode (bulan/tahun atau semua), pencarian, filter lender & status. Tambah, ubah, dan hapus tagihan. Tabel di desktop, kartu di mobile.
- **Form** — jumlah tagihan, sudah dibayar, tanggal jatuh tempo (date picker), deskripsi. Sisa tagihan & status dihitung otomatis.
- **Reporting** — ringkasan per lender (transaksi, total, terbayar, sisa) + detail transaksi per periode, dengan export CSV.

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # produksi
npm run lint       # ESLint
```

## Mode Mock vs API

Tanpa konfigurasi apa pun, app berjalan dalam **mode mock**: data tersimpan di `localStorage` browser (di-seed dengan contoh dari Excel: GoPay, ShopeePay, TikTok, SpinJam, Mandiri). UI bisa langsung dipakai.

Untuk connect ke API Anda, buat `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Selama `NEXT_PUBLIC_API_URL` kosong → mode mock. Terisi → semua request ke API Anda. Lihat indikator "Mock"/"API" di header/sidebar.

## Contract API (yang diharapkan dari backend)

Base URL: nilai `NEXT_PUBLIC_API_URL`. Semua request/response JSON.

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| `GET` | `/bills?from=&to=&lender=&status=&q=` | Daftar tagihan + filter periode (format tanggal `yyyy-mm-dd`), lender, status (`belum_bayar`/`sebagian`/`lunas`), pencarian |
| `POST` | `/bills` | Catat tagihan baru |
| `GET` | `/bills/:id` | Detail tagihan |
| `PUT` | `/bills/:id` | Perbarui tagihan |
| `DELETE` | `/bills/:id` | Hapus tagihan |
| `GET` | `/bills/summary?from=&to=` | Ringkasan periode |
| `GET` | `/lenders` | Daftar lender (sheet "master") |

**Body `POST`/`PUT`:**

```json
{
  "lender": "gopay",
  "amount": 139000,
  "paidAmount": 0,
  "dueDate": "2026-11-01",
  "deskripsi": "shopping"
}
```

**Respons `Bill`:**

```json
{
  "id": "...",
  "lender": "gopay",
  "amount": 139000,
  "paidAmount": 0,
  "remainingAmount": 139000,
  "status": "belum_bayar",
  "dueDate": "2026-11-01",
  "deskripsi": "shopping",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Respons `GET /bills/summary`:**

```json
{
  "total": 1121205,
  "paid": 0,
  "remaining": 1121205,
  "remainingAll": 3148729,
  "perLender": [
    { "lender": "gopay", "count": 1, "total": 139000, "paid": 0, "remaining": 139000 }
  ]
}
```

> Catatan: `remainingAmount` (= `amount` − `paidAmount`) dan `status` sebaiknya dihitung di backend agar konsisten dengan mode mock.

## Struktur Proyek

```
src/
├── app/                  # Halaman: dashboard, bills, bills/new, bills/[id]/edit, reporting
├── components/           # AppShell, form, tabel, kartu, filter periode, dst.
├── hooks/use-bills.ts    # React Query hooks
├── lib/
│   ├── api.ts            # HTTP client + fallback mock (localStorage)
│   ├── types.ts          # Bill, BillStatus, BillSummary, Lender
│   ├── format.ts         # format Rupiah (id-ID), tanggal
│   └── export.ts         # export CSV
└── ...
```

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Base UI) — tidak ada CSS custom
- [TanStack Query](https://tanstack.com/query) untuk state server
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) untuk form & validasi
