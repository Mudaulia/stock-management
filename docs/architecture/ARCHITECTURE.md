# Architecture

## Purpose

Dokumen ini menjelaskan arsitektur aktual project Stock Management (High-Level Design / Architecture Design), disusun berdasarkan implementasi aktual pada repository.

Dokumen harus diperbarui ketika terjadi perubahan arsitektur yang signifikan.

Desain detail tingkat rendah (Low-Level Design / System Design Document) berada di:

`docs/architecture/LOW-LEVEL-DESIGN.md`

## Source of Truth

Untuk kondisi implementasi aktual, prioritaskan:

- source code;
- configuration;
- database/schema;
- runtime behavior;
- tests;
- documentation.

## Application Layers

```
Browser
   ↓
Frontend / UI (React 18, Client Components)
   ↓
Next.js Middleware (JWT gate)
   ↓
Server / API (Next.js API Routes)
   ↓
Business Logic (validasi Zod, authorization, transaksi)
   ↓
Data Access / ORM (Prisma Client — singleton)
   ↓
MySQL
   ↘
    Redis (rate limiting login — opsional, fail-open)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2.0 (App Router) |
| Language | TypeScript 5.4+ (strict mode) |
| Frontend | React 18, TanStack React Query 5, React Hook Form + Zod, Tailwind CSS (komponen shadcn-style di `src/components/ui`) |
| ORM | Prisma 5.12.0 |
| Database | MySQL |
| Auth | JWT (jose, HS256, 7 hari) + cookie httpOnly |
| Validation | Zod 3.22.0 (isomorphic — skema sama di client & server) |
| Rate Limiting | Redis (ioredis 6.x) |
| Password Hash | bcryptjs (cost 12) |

## Frontend

- **Routing:** Next.js App Router dengan dua route group:
  - `(auth)/login` — halaman login;
  - `(dashboard)/dashboard/**` — seluruh halaman aplikasi (items, stock-in, stock-out, stock-adjustment, opname, reports/{stock,mutation,low-stock}, users, dashboard utama).
- **Layouts:** `(dashboard)/layout.tsx` membungkus sidebar + konten; sidebar berisi 9 menu inti + menu "Pengguna" khusus ADMIN.
- **Components:** ~25 komponen UI bersama di `src/components/ui` (tabel, dialog, form, toast, pagination, empty/loading/error state, dsb.) serta komponen dashboard di `dashboard/components`.
- **Forms:** React Hook Form + resolver Zod; error state dinamis per field.
- **State management:** server state sepenuhnya via TanStack React Query (`src/hooks/use-api.ts`) dengan query-key factory dan invalidation lintas fitur (mis. transaksi stok masuk me-refresh items, dashboard, transaksi terbaru).
- **Data fetching:** wrapper `fetch-utils.ts` dengan validasi response Zod (`src/lib/schemas.ts`).
- **Validation:** isomorphic — skema Zod yang sama dipakai form client dan API server.

## Backend

- **API routes** (Next.js App Router, `src/app/api/**`):
  - `auth` — login, logout, me;
  - `items` — CRUD, bulk delete, export CSV;
  - `stock-in`, `stock-out`, `stock-adjustment` — transaksi stok;
  - `opname` + `opname/[id]/reconcile` — stok opname & rekonsiliasi;
  - `dashboard` — stats, low-stock-items, recent-transactions;
  - `reports/{stock,mutation,low-stock}` (+ `/export`).
- **Service layer:** tidak ada layer terpisah; business logic berada langsung di route handlers menggunakan Prisma `$transaction`.
- **Business logic:** validasi Zod ulang di server, verifikasi sesi & role, lalu mutasi stok atomik dengan optimistic locking (detail di `docs/business/INVENTORY-RULES.md`).
- **Authorization:** ditegakkan di server per endpoint — VIEWER baca saja; WAREHOUSE_STAFF untuk transaksi tulis; ADMIN untuk hapus item dan rekonsiliasi.
- **Error handling:** format response konsisten via `src/lib/api-response.ts` (success / error / validation error / 409 conflict).

## Database

- **Engine:** MySQL.
- **ORM:** Prisma (Client singleton di `src/lib/prisma.ts` — mencegah kebocoran connection pool).
- **Schema:** 6 model — User, Item, StockTransaction, StockOpname, StockReconciliation, AuditLog (detail `prisma/schema.prisma` dan `docs/product/ERD.md`).
- **Relasi penting:**
  - User 1-N StockTransaction / StockOpname / StockReconciliation / AuditLog;
  - Item 1-N StockTransaction / StockOpname;
  - StockOpname 1-1 StockReconciliation (opnameId unique).
- **Transaction strategy:** setiap mutasi stok berjalan dalam satu `$transaction`: cek optimistic locking (`updateMany` dengan snapshot stok / kondisi `gte`) → update stok → buat StockTransaction → buat AuditLog. Audit log ditulis di dalam transaksi yang sama agar tidak pernah terpisah dari perubahan yang diaudit.
- **Soft delete:** User dan Item menggunakan `isActive = false`; riwayat transaksi bersifat permanen.

## Authentication

- **Login flow:** `POST /api/auth/login` → validasi Zod → rate limit (Redis, 5 req/menit/IP) → lookup user by email → bcrypt compare → tolak `isActive = false` → set cookie sesi.
- **Session strategy:** stateless JWT (HS256, kedaluwarsa 7 hari). Tidak ada session store; setiap request memverifikasi token lalu re-lookup user ke database.
- **Token strategy:** secret wajib ≥ 32 karakter dari environment (`JWT_SECRET`), tanpa fallback hardcoded; role tidak dipercaya dari klaim token — selalu dari database.
- **Cookie strategy:** cookie `auth-token` httpOnly, sameSite=lax, path `/`; `secure` pada production.
- **Logout flow:** `POST /api/auth/logout` menghapus cookie dan mengakhiri sesi di sisi client.
- **Middleware:** `src/middleware.ts` memverifikasi JWT untuk semua halaman dashboard; redirect ke login jika tidak valid.

## Authorization

- **Role:** `ADMIN > WAREHOUSE_STAFF > VIEWER` (enum Prisma).
- **Permission per endpoint:**

| Aksi | Role minimum |
|---|---|
| Baca (items, dashboard, reports, export) | VIEWER |
| Tulis item, stok in/out/adjustment, buat opname | WAREHOUSE_STAFF |
| Hapus item (tunggal & bulk) | ADMIN |
| Rekonsiliasi opname | ADMIN |

- **Server-side enforcement:** `requireAuth()` / `requireRole()` di `src/lib/auth.ts` memverifikasi sesi dan role dari database (bukan klaim token). UI restriction (sidebar/menu/tombol) hanya kosmetik, bukan authorization.
- **Protected routes:** semua halaman `(dashboard)` dilindungi middleware; semua API memverifikasi sesi + status `isActive`.

## Inventory

- **Current stock:** `Item.currentStock` adalah authoritative state yang diperbarui secara atomik setiap transaksi; tidak pernah negatif (dijamin conditional update di server).
- **Stock transaction:** setiap perubahan stok (IN/OUT/ADJUSTMENT) mencatat riwayat permanen dengan user, tanggal, referensi, dan catatan.
- **Stock opname:** snapshot `systemStock` saat opname dibuat; selisih = `physicalStock - systemStock`; status PENDING → RECONCILED/CANCELLED.
- **Reconciliation:** ADMIN-only; verifikasi stok saat ini masih sama dengan snapshot (`StaleOpnameError` jika stale) sebelum overwrite; hasil tercatat sebagai transaksi ADJUSTMENT + record StockReconciliation.
- **Audit trail:** AuditLog (action, entity, old/new data, IP, user-agent) ditulis dalam transaksi yang sama dengan mutasi.

Aturan detail inventory: `docs/business/INVENTORY-RULES.md`

## Architecture Changes

Perubahan arsitektur penting harus dicatat di:

`docs/decisions/`

Jangan menggunakan file ini sebagai changelog detail.
