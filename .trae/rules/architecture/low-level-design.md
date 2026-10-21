---
description: Low-Level Design — detail desain modul, schema, endpoint, komponen
alwaysApply: false
---

# Low-Level Design — System Design Document (LLD/SDD)

## Purpose

Dokumen ini berisi desain detail (Low-Level Design) Sistem Manajemen Stok berdasarkan implementasi aktual. Melengkapi `.trae/rules/architecture/architecture.md` (HLD) dan `.trae/rules/product/prd.md` (requirement).

## 1. Desain Basis Data

Skema lengkap pada `prisma/schema.prisma` (MySQL, Prisma ORM). Ringkasan tabel:

| Tabel | Kolom Kunci | Indeks |
|---|---|---|
| `users` | id (cuid), email (unik), username (unik), password_hash, role, is_active, last_login_at | email, username (unique) |
| `items` | id, code (unik), name, unit, min_stock, current_stock, is_active | code, name, (is_active, current_stock, min_stock) |
| `stock_transactions` | id, item_id, type (enum: STOCK_IN/STOCK_OUT/ADJUSTMENT), quantity, reference, notes, transaction_date, created_by_id | item_id, type, transaction_date |
| `stock_opnames` | id, item_id, system_stock, physical_stock, difference, status (enum: PENDING/RECONCILED/CANCELLED), opname_date, created_by_id | item_id, status, opname_date |
| `stock_reconciliations` | id, opname_id (unik), adjusted_by_id, adjusted_at, notes | opname_id (unique) |
| `audit_logs` | id, user_id (nullable), action, entity, entity_id, old_data (JSON), new_data (JSON), ip_address, user_agent | user_id, (entity, entity_id), created_at |

Relasi dan aturan integritas lengkap: `.trae/rules/product/erd.md`.

## 2. Desain API

Detail lengkap pada `.trae/rules/backend/api-standards.md`. Ringkasan endpoint:

| Grup | Endpoint | Metode | Role Minimum |
|---|---|---|---|
| Auth | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | POST, POST, GET | Publik / terautentikasi |
| Items | `/api/items`, `/api/items/[id]`, `/api/items/export` | GET/POST, PUT/DELETE, GET | VIEWER (baca); WAREHOUSE_STAFF (tulis); ADMIN (hapus) |
| Stock In | `/api/stock-in` | GET, POST | WAREHOUSE_STAFF |
| Stock Out | `/api/stock-out` | GET, POST | WAREHOUSE_STAFF |
| Stock Adjustment | `/api/stock-adjustment` | GET, POST | WAREHOUSE_STAFF |
| Opname | `/api/opname`, `/api/opname/[id]` | GET/POST, PUT | WAREHOUSE_STAFF |
| Reconcile | `/api/opname/[id]/reconcile` | POST | ADMIN |
| Dashboard | `/api/dashboard/stats`, `.../low-stock-items`, `.../recent-transactions` | GET | VIEWER |
| Reports | `/api/reports/{stock,mutation,low-stock}` (+ `/export`) | GET | VIEWER |

Format response standar didefinisikan di `src/lib/api-response.ts` (`success`, `error`, `validation error`).

## 3. Desain Modul / Komponen Utama

| Modul | Lokasi | Tanggung Jawab Detail |
|---|---|---|
| Auth Service | `src/lib/auth.ts` | Generate/verifikasi JWT (jose, HS256, 7 hari); `getCurrentUser()` re-lookup user aktif dari DB per request; `requireAuth()` + `requireRole()` |
| CSRF Guard | `src/lib/csrf.ts` | Generasi dan verifikasi token CSRF |
| Rate Limiter | `src/lib/rate-limiter.ts` | Sliding window 5 req/menit via Redis; fail-open saat Redis tidak tersedia |
| Schema Validasi | `src/lib/schemas.ts` | Skema Zod bersama (isomorphic) untuk semua form dan payload API |
| API Response | `src/lib/api-response.ts` | Format response sukses/error/konflik yang konsisten |
| Prisma Client | `src/lib/prisma.ts` | Singleton Prisma Client (mencegah kebocoran connection pool) |
| Komponen UI | `src/components/ui/*` | ~25 komponen bersama: tabel, dialog, form, toast, pagination, dsb. |
| Hooks | `src/hooks/*` | `use-auth` (sesi), `use-api` (React Query + query-key factory + invalidation lintas fitur) |
| Middleware | `src/middleware.ts` | Gate autentikasi navigasi; verifikasi JWT untuk semua halaman dashboard |

## 4. Logika Bisnis Kritis (Detail Implementasi)

| Aturan | Implementasi |
|---|---|
| Stok Masuk | `updateMany` dengan pengecekan snapshot stok (optimistic locking) + increment, dalam `$transaction` |
| Stok Keluar | Conditional `updateMany` dengan `currentStock: { gte: quantity }` + decrement — stok tidak mungkin negatif termasuk pada request paralel |
| Penyesuaian | Set stok ke nilai baru; notes wajib; quantity bertanda (≠ 0); optimistic locking |
| Opname | Snapshot `systemStock = currentStock` saat opname dibuat |
| Rekonsiliasi | ADMIN-only; verifikasi `currentStock == opname.systemStock` sebelum overwrite (`StaleOpnameError` jika stale); hasil: stok = physicalStock + transaksi ADJUSTMENT + record StockReconciliation |
| Soft Delete | Item/User dinonaktifkan via `isActive = false` |

Rasioni dan aturan bisnis: `.trae/rules/backend/inventory-rules.md`.

## 5. Desain Penanganan Error

| Skenario | Penanganan |
|---|---|
| Validasi gagal | Response 400 dengan detail ZodError terstruktur; UI menampilkan error per field |
| Tidak terautentikasi | 401 dari API; middleware mengarahkan halaman ke login |
| Role tidak memenuhi | 403 dengan pesan peran yang diizinkan |
| Kode barang duplikat | 409 Conflict |
| Stok tidak cukup | 400/409 dengan sisa stok saat ini |
| Opname stale | `StaleOpnameError` — rekonsiliasi ditolak, pengguna dimuat ulang data |
| Error tak terduga | 500 terstruktur, tidak membocorkan detail internal |

## 6. Desain Antarmuka Pengguna

| Halaman | Rute | Fungsi |
|---|---|---|
| Login | `/login` | Form email + password |
| Dashboard | `/dashboard` | 6 stat cards, quick actions, transaksi terbaru, peringatan stok rendah |
| Barang | `/dashboard/items` | Tabel + CRUD + bulk delete + ekspor CSV |
| Stok Masuk/Keluar/Penyesuaian | `/dashboard/stock-in`, `/dashboard/stock-out`, `/dashboard/stock-adjustment` | Form transaksi + riwayat + filter tanggal |
| Stok Opname | `/dashboard/opname` | Buat opname, rekonsiliasi (ADMIN), cancel, riwayat |
| Laporan | `/dashboard/reports/{stock,mutation,low-stock}` | Laporan + filter + ekspor CSV |
| Pengguna | `/dashboard/users` (ADMIN-only) | CRUD pengguna + penetapan role |

Pola UI: sidebar navigasi (9 menu inti + menu "Pengguna" khusus ADMIN), page header, filter card, data table dengan pagination (10/20/50/100), form dialog, confirm dialog, toast notifikasi, serta loading/empty/error state yang konsisten.

## Maintenance

Dokumen ini harus diperbarui ketika terjadi perubahan pada:

- skema database;
- kontrak API;
- logika bisnis kritis;
- struktur halaman/rute frontend.
