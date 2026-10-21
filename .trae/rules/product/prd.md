---
description: Product Requirements Document — requirement fungsional, spesifikasi, gap & roadmap
alwaysApply: false
---

# Product Requirements Document (PRD)

# Sistem Manajemen Stok (Stock Management)

| Atribut | Nilai |
|---|---|
| Nama Produk | Stock Management System |
| Versi Dokumen | 2.0 |
| Status | Approved — As-Is (merefleksikan kondisi implementasi aktual) |
| Tanggal | 2026-10-21 |
| Penyusun | Engineering Team |
| Pemilik Dokumen | Engineering Team |
| Distribusi | Tim Engineering, Tim Produk, Manajemen |
| Dokumen Terkait | `.trae/rules/product/user-story.md`, `.trae/rules/product/erd.md`, `.trae/rules/architecture/architecture.md` (HLD), `.trae/rules/architecture/low-level-design.md` (LLD/SDD), `.trae/rules/backend/security.md`, `.trae/rules/backend/inventory-rules.md`, `.trae/rules/backend/api-standards.md`, `.trae/rules/database/database-safety.md` |

---

## Riwayat Revisi

| Versi | Tanggal | Penyusun | Deskripsi Perubahan |
|---|---|---|---|
| 1.0 | 2026-10-21 | Engineering Team | Penyusunan awal PRD berbasis implementasi as-is |
| 2.0 | 2026-10-21 | Engineering Team | Restrukturisasi sesuai standar PRD resmi: System Document, System Specification, System Design, HLD (Architecture Design), dan LLD (System Design Document) |
| 2.1 | 2026-10-21 | Engineering Team | Sinkronisasi audit: GAP-04 diperbarui (menu Pengguna ADMIN-only), GAP-05 ditandai RESOLVED (link register sudah tidak ada), FR-10 diklarifikasi (quick actions ter-render inline di dashboard page) |

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [System Document](#2-system-document)
3. [System Specification](#3-system-specification)
4. [System Design](#4-system-design)
5. [High-Level Design — Architecture Design](#5-high-level-design--architecture-design)
6. [Low-Level Design — System Design Document (LLD/SDD)](#6-low-level-design--system-design-document-lldsdd)
7. [Gap & Roadmap](#7-gap--roadmap)
8. [Metrik Keberhasilan](#8-metrik-keberhasilan)
9. [Batasan & Asumsi](#9-batasan--asumsi)
10. [Persetujuan](#10-persetujuan)

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen

Dokumen ini adalah Product Requirements Document (PRD) resmi untuk Sistem Manajemen Stok. PRD mendefinisikan requirement produk, spesifikasi sistem, desain sistem, arsitektur tingkat tinggi (High-Level Design), dan desain detail sistem (Low-Level Design) sesuai kondisi implementasi aktual, serta mengidentifikasi gap terhadap requirement awal dan roadmap pengembangannya.

### 1.2 Ruang Lingkup Produk

**Dalam lingkup (in-scope):**

- Pencatatan dan pengelolaan data barang (sparepart)
- Transaksi stok masuk, stok keluar, dan penyesuaian stok
- Stok opname dan rekonsiliasi stok
- Laporan persediaan, mutasi stok, dan stok rendah beserta ekspor CSV
- Dashboard monitoring real-time
- Autentikasi pengguna dan kontrol akses berbasis peran (RBAC)
- Audit trail perubahan data

**Di luar lingkup (out-of-scope) pada versi saat ini:**

- Manajemen pengguna (CRUD user melalui antarmuka)
- Multi-tenant / multi-perusahaan
- Format ekspor selain CSV
- Notifikasi otomatis (email/push)

### 1.3 Definisi, Akronim, dan Singkatan

| Istilah | Definisi |
|---|---|
| PRD | Product Requirements Document |
| RBAC | Role-Based Access Control — kontrol akses berbasis peran |
| HLD | High-Level Design — desain arsitektur tingkat tinggi |
| LLD | Low-Level Design — desain detail sistem (System Design Document) |
| SDD | System Design Document — sama dengan LLD |
| Stok Opname | Proses penghitungan fisik barang untuk dibandingkan dengan stok sistem |
| Rekonsiliasi | Penyesuaian stok sistem berdasarkan hasil stok opname |
| Soft Delete | Penonaktifan data dengan menandai `isActive = false`, tanpa menghapus fisik |
| Optimistic Locking | Teknik konkurensi dengan memverifikasi nilai stok sebelum menimpa |
| CSV | Comma-Separated Values — format ekspor data |

### 1.4 Referensi

| ID | Dokumen | Lokasi |
|---|---|---|
| R1 | User Story & Kebutuhan Teknis | `.trae/rules/product/user-story.md` |
| R2 | Entity Relationship Diagram | `.trae/rules/product/erd.md` |
| R3 | Arsitektur Aplikasi | `.trae/rules/architecture/architecture.md` |
| R4 | Keamanan Aplikasi | `.trae/rules/backend/security.md` |
| R5 | Aturan Inventory | `.trae/rules/backend/inventory-rules.md` |
| R6 | Dokumentasi API | `.trae/rules/backend/api-standards.md` |
| R7 | Keselamatan Database | `.trae/rules/database/database-safety.md` |

### 1.5 Ringkasan Produk

Stock Management adalah aplikasi web internal untuk mengelola persediaan sparepart pada gudang. Sistem menyediakan pencatatan barang, transaksi stok masuk/keluar, penyesuaian stok, stok opname beserta rekonsiliasi, laporan persediaan, dan ekspor data — dengan kontrol akses berbasis peran yang ditegakkan di sisi server.

---

## 2. System Document

### 2.1 Deskripsi Umum Sistem

Sistem Manajemen Stok adalah aplikasi web berbasis browser yang digunakan internal perusahaan untuk mencatat dan memantau persediaan sparepart gudang. Sistem memastikan stok tercatat selalu sinkron dengan kondisi fisik melalui mekanisme transaksi atomik, stok opname, dan rekonsiliasi yang tervalidasi, serta seluruh perubahan data tercatat pada audit log.

### 2.2 Konteks Sistem

Sistem beroperasi sebagai aplikasi terpusat (single-company, bukan multi-tenant):

```
┌─────────────┐     HTTPS      ┌──────────────────────┐     Prisma      ┌─────────┐
│  Browser     │ ─────────────▶│  Next.js App Server   │ ──────────────▶│  MySQL  │
│  (Pengguna)  │◀─────────────│  (UI + API Routes)    │◀──────────────│         │
└─────────────┘   JSON/HTML    └──────────┬───────────┘                └─────────┘
                                          │ rate limit
                                          ▼
                                     ┌─────────┐
                                     │  Redis  │
                                     └─────────┘
```

### 2.3 Pengguna Sistem dan Karakteristik

| Peran | Deskripsi | Karakteristik / Kebutuhan |
|---|---|---|
| **ADMIN** | Administrator sistem | Membutuhkan akses penuh: kelola barang, transaksi, opname, rekonsiliasi, hapus data, laporan |
| **WAREHOUSE_STAFF** | Petugas gudang | Membutuhkan pencatatan operasional harian: stok masuk/keluar/penyesuaian, opname, laporan |
| **VIEWER** | Pengamat | Membutuhkan akses baca saja: dashboard, laporan, ekspor |

Hierarki peran: `ADMIN > WAREHOUSE_STAFF > VIEWER`. Authorization ditegakkan di sisi server (API routes); antarmuka hanya membatasi tampilan.

### 2.4 Batasan Sistem (System Constraints)

- Aplikasi bersifat internal, bukan multi-tenant.
- Ekspor terbatas pada format CSV.
- Rate limiting memerlukan Redis; sistem tetap berjalan (fail-open) jika Redis tidak tersedia.
- Riwayat transaksi bersifat permanen; penghapusan data menggunakan soft delete.

### 2.5 Dependensi Sistem

| Dependensi | Kegunaan |
|---|---|
| MySQL | Penyimpanan data utama |
| Redis | Rate limiting login |
| Node.js (runtime Next.js) | Server aplikasi |

### 2.6 Dokumentasi Sistem Terkait

| Dokumen | Fungsi |
|---|---|
| `.trae/rules/architecture/architecture.md` | Arsitektur aplikasi (HLD) |
| `.trae/rules/backend/security.md` | Kebijakan keamanan & RBAC |
| `.trae/rules/backend/inventory-rules.md` | Aturan bisnis inventory |
| `.trae/rules/backend/api-standards.md` | Spesifikasi API |
| `.trae/rules/development/development.md` | Setup & workflow pengembangan |
| `.trae/rules/testing/test-standards.md` | Strategi pengujian & verifikasi |
| `.trae/rules/database/database-safety.md` | Prosedur keselamatan database |

---

## 3. System Specification

### 3.1 Persyaratan Fungsional

Status: ✅ Terimplementasi · ❌ Belum diimplementasi · ⚠️ Implementasi berbeda dari requirement

#### FR-01 — Autentikasi (US-15, US-16)

| Aspek | Spesifikasi |
|---|---|
| Login | Email + password. Endpoint `POST /api/auth/login` |
| Validasi kredensial | Bcrypt hash comparison di server |
| Rate limiting | Maks. 5 percobaan login/menit per IP (Redis sliding window) |
| Sesi | JWT (HS256, kedaluwarsa 7 hari) di cookie httpOnly `auth-token` |
| Proteksi route | Middleware Next.js memverifikasi JWT untuk semua halaman dashboard; API memverifikasi sesi + status `isActive` via database |
| Logout | `POST /api/auth/logout` menghapus cookie dan mengakhiri sesi |

> ⚠️ **Deviasi:** US-15 mensyaratkan login dapat menggunakan *username* ATAU *email*; implementasi saat ini hanya menerima **email**.

#### FR-02 — Manajemen Data Barang (US-01 – US-04)

| Fungsi | Spesifikasi |
|---|---|
| Tambah barang | Form: kode (unik, wajib), nama, satuan, stok minimum, stok awal, deskripsi (opsional). Validasi wajib isi; penolakan kode duplikat di server dan client |
| Lihat daftar | Kolom nama, kode, satuan, stok, stok minimum; pencarian kode/nama; filter status aktif/nonaktif; pagination 10/25/50/100 |
| Ubah barang | Kode tidak dapat diubah setelah dibuat |
| Hapus barang | Soft delete (`isActive = false`) dengan dialog konfirmasi; mendukung hapus tunggal dan bulk delete |
| Ekspor | Daftar barang ke CSV sesuai filter aktif |

#### FR-03 — Transaksi Stok Masuk (US-05)

- Pilih barang aktif (stok saat ini ditampilkan), jumlah > 0, tanggal transaksi (default hari ini), referensi PO/SO (opsional), catatan (opsional).
- Stok barang bertambah otomatis secara atomik (database transaction + optimistic locking).
- Riwayat transaksi dengan pencarian dan filter rentang tanggal.

#### FR-04 — Transaksi Stok Keluar (US-06)

- Form identik dengan stok masuk (referensi berlabel SO/PO).
- Validasi ketersediaan stok di client (tombol disabled + alert) **dan** di server (conditional update — stok tidak dapat menjadi negatif, termasuk pada request paralel).
- Stok berkurang otomatis secara atomik.

#### FR-05 — Penyesuaian Stok

> Fitur tambahan di luar user story inti (melengkapi Epic 3).

- Mengatur stok langsung ke nilai baru; catatan **wajib**; quantity dapat bertanda (tidak boleh 0).
- Tercatat sebagai transaksi `ADJUSTMENT` + audit log.

#### FR-06 — Stok Opname (US-07)

- Pilih barang; sistem menampilkan stok sistem (snapshot saat pembuatan); input stok fisik; selisih dihitung otomatis; catatan selisih.
- Status opname: `PENDING` → `RECONCILED` / `CANCELLED`.
- Filter: pencarian, status, rentang tanggal; pagination.

#### FR-07 — Rekonsiliasi Stok (US-08)

- Hanya **ADMIN** yang dapat merekonsiliasi (ditegakkan di server).
- Konfirmasi penyesuaian via dialog; sistem memverifikasi stok saat ini masih sama dengan snapshot opname (`StaleOpnameError` jika sudah berubah) sebelum menimpa stok.
- Perubahan stok tercatat sebagai transaksi `ADJUSTMENT` + record `StockReconciliation` (waktu & pengguna tercatat) + audit log.
- Tersedia aksi **Cancel** opname.

#### FR-08 — Laporan (US-09 – US-11)

| Laporan | Rute | Filter | Ekspor |
|---|---|---|---|
| Laporan Stok | `/dashboard/reports/stock` | pencarian, hanya stok rendah, status aktif | CSV |
| Mutasi Stok | `/dashboard/reports/mutation` | pencarian, jenis transaksi (IN/OUT/ADJUSTMENT), rentang tanggal, barang | CSV |
| Stok Rendah | `/dashboard/reports/low-stock` | pencarian, sertakan stok 0 | CSV |

#### FR-09 — Data Real-Time (US-12)

- Stok selalu dihitung dari state database (`currentStock`) yang diperbarui secara atomik setiap transaksi.
- Frontend menggunakan TanStack React Query dengan invalidation lintas fitur sehingga data tampil selalu terbaru tanpa input manual.

#### FR-10 — Dashboard

- 6 kartu statistik (klikabel): Total Barang, Stok Rendah, Stok Habis, Stok Masuk (terkini), Stok Keluar (terkini), Opname Pending — kartu kritis diberi badge "Perlu Tindakan".
- Quick actions: Tambah Barang, Stok Masuk, Stok Keluar, Opname.
- Widget: Tabel Transaksi Terbaru dan Peringatan Stok Rendah.

#### FR-11 — Manajemen Pengguna (US-13, US-14)

**Status: ✅ Diimplementasi** — halaman `/dashboard/users` (ADMIN-only), API `/api/users` (list, create, detail, update) dengan validasi, audit log, dan proteksi self-lockout. Lihat `.trae/rules/backend/api-standards.md` (Users API).

#### FR-12 — Antarmuka Responsif (US-17)

- Berbasis browser, Next.js App Router + Tailwind CSS; komponen UI konsisten (shadcn-style, `src/components/ui`).
- Navigasi utama berupa sidebar dengan 9 menu; form berlabel jelas; pesan sukses/galat (toast); konfirmasi untuk aksi destruktif; empty state, loading state, dan error state tersedia; pagination konsisten.

### 3.2 Persyaratan Non-Fungsional

| ID | Kategori | Persyaratan | Status |
|---|---|---|---|
| NFR-01 | Keamanan | Password di-hash (bcrypt) di server; `DATABASE_URL` tidak terekspos ke client | ✅ |
| NFR-02 | Keamanan | Authorization 2 level: middleware (navigasi) + pengecekan role per API endpoint | ✅ |
| NFR-03 | Integritas Data | Semua mutasi stok atomik (`$transaction`) dengan optimistic locking; stok tidak dapat negatif | ✅ |
| NFR-04 | Auditabilitas | Audit log (aksi, entitas, data lama/baru, IP, user-agent) ditulis dalam transaksi database yang sama | ✅ |
| NFR-05 | Keandalan | Validasi isomorphic (Zod di client dan server); error response konsisten | ✅ |
| NFR-06 | Performa | Pagination dan query terindeks pada tabel utama | ✅ |
| NFR-07 | Usability | Loading/empty/error state, konfirmasi aksi destruktif, antarmuka responsif | ✅ |

### 3.3 Persyaratan Antarmuka

| Antarmuka | Deskripsi |
|---|---|
| Antarmuka Pengguna | Aplikasi web browser (Next.js App Router), responsif, bahasa Indonesia |
| Antarmuka API | REST API (Next.js API Routes), format JSON, autentikasi via cookie httpOnly |
| Antarmuka Database | MySQL melalui Prisma ORM (type-safe, singleton client) |
| Antarmuka Eksternal | Redis untuk rate limiting (opsional, fail-open) |

---

## 4. System Design

### 4.1 Pendekatan Desain

Sistem didesain dengan prinsip:

1. **Server-side authorization** — semua keputusan akses ditegakkan di server; UI hanya kosmetik.
2. **Integritas stok di atas segalanya** — setiap mutasi stok atomik, tervalidasi, dan tercatat.
3. **Isomorphic validation** — skema Zod yang sama dipakai client dan server.
4. **Soft delete & riwayat permanen** — data tidak dihapus fisik; riwayat transaksi tetap utuh.

### 4.2 Desain Data

Model data mengikuti `.trae/rules/product/erd.md` dengan 6 entitas utama:

| Entitas | Peran | Relasi Kunci |
|---|---|---|
| User | Pengguna sistem (role: ADMIN/WAREHOUSE_STAFF/VIEWER) | 1-N ke StockTransaction, StockOpname, StockReconciliation, AuditLog |
| Item | Master data barang (stok real-time, stok minimum) | 1-N ke StockTransaction, StockOpname |
| StockTransaction | Riwayat mutasi stok (IN/OUT/ADJUSTMENT) | N-1 ke Item dan User |
| StockOpname | Snapshot stok sistem vs fisik | N-1 ke Item dan User; 1-1 ke StockReconciliation |
| StockReconciliation | Rekaman rekonsiliasi (ADMIN) | 1-1 ke StockOpname |
| AuditLog | Jejak audit perubahan data | N-1 ke User |

### 4.3 Desain Alur Bisnis Utama

**Alur Transaksi Stok:**

```
Input pengguna → Validasi Zod (client) → API Route → Validasi Zod (server)
→ Verifikasi sesi & role → Validasi bisnis (stok tersedia, dll.)
→ $transaction: [cek optimistic locking → update stok → catat StockTransaction → catat AuditLog]
→ Response → Invalidasi cache React Query → UI diperbarui
```

**Alur Stok Opname & Rekonsiliasi:**

```
Buat opname (snapshot systemStock) → Status PENDING
→ [ADMIN] Rekonsiliasi: verifikasi currentStock == systemStock
→ Set currentStock = physicalStock + catat ADJUSTMENT + StockReconciliation → Status RECONCILED
→ (alternatif) Cancel → Status CANCELLED
```

### 4.4 Desain Keamanan

| Lapisan | Mekanisme |
|---|---|
| Navigasi | Middleware Next.js memverifikasi JWT untuk semua halaman dashboard |
| API | `requireAuth()` verifikasi sesi + status aktif dari database; pengecekan role per endpoint |
| Data | Bcrypt password hash; kredensial hanya server-side |
| Transport | Cookie httpOnly, SameSite=Lax; proteksi CSRF |
| Anti-abuse | Rate limiting login 5 req/menit per IP (Redis) |

---

## 5. High-Level Design — Architecture Design

### 5.1 Arsitektur Sistem

Aplikasi menggunakan **Next.js 14 monolith (App Router)** dengan pola full-stack TypeScript: UI dan API berada dalam satu codebase dan satu deployment unit.

```
┌──────────────────────────────────────────────────────────────┐
│                     Client (Browser)                          │
│  React 18 · Client Components · TanStack React Query ·        │
│  React Hook Form + Zod · Tailwind CSS (shadcn-style UI)       │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTPS (JSON, cookie httpOnly)
┌───────────────────────────▼──────────────────────────────────┐
│                Next.js 14 App Router (Server)                 │
│                                                              │
│  ┌───────────────┐   ┌────────────────────────────────────┐  │
│  │  Middleware    │   │  API Routes (/api/**)              │  │
│  │  (JWT gate)    │   │  auth · items · stock-in/out/adj ·  │  │
│  └───────────────┘   │  opname/reconcile · dashboard ·     │  │
│                      │  reports + export                   │  │
│                      └──────────────┬─────────────────────┘  │
│  ┌──────────────────────────────────┼─────────────────────┐  │
│  │  Shared libs: auth.ts · csrf.ts · schemas.ts (Zod) ·    │  │
│  │  api-response.ts · rate-limiter.ts · prisma.ts          │  │
│  └──────────────────────────────────┼─────────────────────┘  │
└─────────────────────────────────────┼────────────────────────┘
                     ┌────────────────┼─────────────────┐
                     ▼                ▼                 ▼
                ┌─────────┐    ┌──────────────┐   ┌─────────┐
                │  MySQL  │    │    Redis     │   │ AuditLog│
                │ (Prisma)│    │ (rate limit) │   │ (table) │
                └─────────┘    └──────────────┘   └─────────┘
```

### 5.2 Komponen Arsitektur

| Komponen | Tanggung Jawab | Teknologi |
|---|---|---|
| Client Layer | Render UI, state server via React Query, validasi form | React 18, TanStack React Query, React Hook Form, Zod, Tailwind |
| Middleware | Gate autentikasi navigasi (verifikasi JWT) | Next.js Middleware |
| API Layer | Logika bisnis, validasi ulang, authorization, transaksi DB | Next.js API Routes, Zod |
| Data Layer | Akses data type-safe, singleton client | Prisma ORM + MySQL |
| Infrastruktur Pendukung | Rate limiting | Redis (ioredis) |

### 5.3 Struktur Direktori (HLD)

```
src/
├── app/
│   ├── (auth)/login/              → halaman login
│   ├── (dashboard)/dashboard/     → items, stock-in, stock-out,
│   │                                stock-adjustment, opname, reports/*, dashboard/*
│   └── api/                       → auth, items, stock-in, stock-out,
│                                    stock-adjustment, opname (+reconcile),
│                                    dashboard, reports (+export)
├── components/ui/                 → library komponen UI bersama
├── hooks/                         → use-auth, use-api (React Query), dll.
├── lib/                           → auth, csrf, prisma, schemas (Zod),
│                                    api-response, rate-limiter
└── middleware.ts                  → gate autentikasi navigasi
```

### 5.4 Keputusan Arsitektur Utama

| # | Keputusan | Alasan |
|---|---|---|
| AD-01 | Monolith Next.js (bukan microservices) | Aplikasi internal skala menengah; deployment sederhana |
| AD-02 | JWT di cookie httpOnly (bukan localStorage) | Mitigasi XSS; sesi tervalidasi ulang ke database per request |
| AD-03 | Authorization di server, bukan UI | UI restriction bukan authorization (prinsip keamanan) |
| AD-04 | Optimistic locking untuk stok | Menjamin konsistensi stok pada request paralel tanpa lock eksplisit |
| AD-05 | Audit log dalam transaksi yang sama | Menjamin audit log tidak pernah terpisah dari perubahan yang diaudit |
| AD-06 | Soft delete untuk Item/User | Menjaga integritas riwayat transaksi |

---

## 6. Low-Level Design — System Design Document (LLD/SDD)

### 6.1 Desain Basis Data

Skema lengkap pada `prisma/schema.prisma` (MySQL, Prisma ORM). Ringkasan tabel:

| Tabel | Kolom Kunci | Indeks |
|---|---|---|
| `users` | id (cuid), email (unik), username (unik), password_hash, role, is_active, last_login_at | email, username (unique) |
| `items` | id, code (unik), name, unit, min_stock, current_stock, is_active | code, name, (is_active, current_stock, min_stock) |
| `stock_transactions` | id, item_id, type (enum), quantity, reference, notes, transaction_date, created_by_id | item_id, type, transaction_date |
| `stock_opnames` | id, item_id, system_stock, physical_stock, difference, status (enum), opname_date | item_id, status, opname_date |
| `stock_reconciliations` | id, opname_id (unik), adjusted_by_id, adjusted_at | opname_id (unique) |
| `audit_logs` | id, user_id, action, entity, entity_id, old_data (JSON), new_data (JSON), ip_address, user_agent | user_id, (entity, entity_id), created_at |

### 6.2 Desain API

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

### 6.3 Desain Modul / Komponen Utama (SDD)

| Modul | Lokasi | Tanggung Jawab Detail |
|---|---|---|
| Auth Service | `src/lib/auth.ts` | Generate/verifikasi JWT (jose, HS256, 7 hari); `getCurrentUser()` re-lookup user aktif dari DB per request; `requireAuth()` + `requireRole()` |
| CSRF Guard | `src/lib/csrf.ts` | Generasi dan verifikasi token CSRF |
| Rate Limiter | `src/lib/rate-limiter.ts` | Sliding window 5 req/menit via Redis; fail-open saat Redis tidak tersedia |
| Schema Validasi | `src/lib/schemas.ts` | Skema Zod bersama (isomorphic) untuk semua form dan payload API |
| API Response | `src/lib/api-response.ts` | Format response sukses/error/konflik yang konsisten |
| Prisma Client | `src/lib/prisma.ts` | Singleton Prisma Client (mencegah kebocoran connection pool) |
| Komponen UI | `src/components/ui/*` | ~25 komponen bersama: tabel, dialog, form, toast, pagination, dll. |
| Hooks | `src/hooks/*` | `use-auth` (sesi), `use-api` (React Query + query-key factory + invalidation lintas fitur) |

### 6.4 Logika Bisnis Kritis (Detail Implementasi)

| Aturan | Implementasi |
|---|---|
| Stok Masuk | `updateMany` dengan pengecekan snapshot stok (optimistic locking) + increment, dalam `$transaction` |
| Stok Keluar | Conditional `updateMany` dengan `currentStock: { gte: quantity }` + decrement — stok tidak mungkin negatif termasuk pada request paralel |
| Penyesuaian | Set stok ke nilai baru; notes wajib; quantity bertanda (≠ 0); optimistic locking |
| Opname | Snapshot `systemStock = currentStock` saat opname dibuat |
| Rekonsiliasi | ADMIN-only; verifikasi `currentStock == opname.systemStock` sebelum overwrite (`StaleOpnameError` jika stale); hasil: stok = physicalStock + transaksi ADJUSTMENT + record StockReconciliation |
| Soft Delete | Item/User dinonaktifkan via `isActive = false` |

### 6.5 Desain Penanganan Error

| Skenario | Penanganan |
|---|---|
| Validasi gagal | Response 400 dengan detail ZodError terstruktur; UI menampilkan error per field |
| Tidak terautentikasi | 401 dari API; middleware mengarahkan halaman ke login |
| Role tidak memenuhi | 403 dengan pesan peran yang diizinkan |
| Kode barang duplikat | 409 Conflict |
| Stok tidak cukup | 400/409 dengan sisa stok saat ini |
| Opname stale | `StaleOpnameError` — rekonsiliasi ditolak, pengguna dimuat ulang data |
| Error tak terduga | 500 terstruktur, tidak membocorkan detail internal |

### 6.6 Desain Antarmuka Pengguna

| Halaman | Rute | Fungsi |
|---|---|---|
| Login | `/login` | Form email + password |
| Dashboard | `/dashboard` | Stat cards, quick actions, transaksi terbaru, peringatan stok rendah |
| Barang | `/dashboard/items` | Tabel + CRUD + bulk delete + ekspor |
| Stok Masuk/Keluar/Penyesuaian | `/dashboard/stock-in`, `/dashboard/stock-out`, `/dashboard/stock-adjustment` | Form transaksi + riwayat |
| Stok Opname | `/dashboard/opname` | Buat opname, rekonsiliasi (ADMIN), cancel, riwayat |
| Laporan | `/dashboard/reports/{stock,mutation,low-stock}` | Laporan + filter + ekspor CSV |

Pola UI: sidebar navigasi (9 menu), page header, filter card, data table dengan pagination, form dialog, confirm dialog, toast notifikasi, serta loading/empty/error state yang konsisten.

---

## 7. Gap & Roadmap

### 7.1 Gap terhadap User Story

| ID | Item | Prioritas | Deskripsi |
|---|---|---|---|
| GAP-01 | US-13 — Manajemen Pengguna | Tinggi | **RESOLVED** — halaman & API CRUD pengguna telah diimplementasi (lihat FR-11) |
| GAP-02 | US-14 — Pengaturan hak akses via UI | Tinggi | **RESOLVED** — role dapat diubah via `/dashboard/users` oleh ADMIN (dengan proteksi self-lockout) |
| GAP-03 | US-15 — Login via username atau email | Sedang | Implementasi saat ini hanya menerima email |
| GAP-04 | Menu per-role di sidebar | Sedang | Menu "Pengguna" hanya tampil untuk ADMIN (sidebar.tsx); menu fitur lain tampil untuk semua role (aksi tetap diblokir di server; VIEWER akan mendapat error saat mencoba aksi tulis) |
| GAP-05 | Link "/register" di halaman login | Rendah | **RESOLVED** — halaman login tidak lagi menautkan ke `/register`; footer menyarankan menghubungi administrator |
| GAP-06 | US-10 — Ringkasan jumlah masuk/keluar | Rendah | Laporan mutasi menampilkan rincian transaksi; agregasi total per periode perlu dikonfirmasi kelengkapannya |

### 7.2 Roadmap

| Fase | Ruang Lingkup |
|---|---|
| Fase 1 | ~~Modul Manajemen Pengguna~~ — **SELESAI** (FR-11 diimplementasi) |
| Fase 2 | Perbaikan autentikasi: dukung login username/email (link register sudah dihapus — GAP-05 resolved) |
| Fase 3 | Penyempurnaan laporan (agregasi ringkasan mutasi, format ekspor tambahan) |
| Fase 4 | Pengetatan keamanan dan konsistensi data (rujukan: laporan audit di `docs/audits/`) |

---

## 8. Metrik Keberhasilan

| Metrik | Target | Cara Pengukuran |
|---|---|---|
| Selisih stok sistem vs fisik pasca-rekonsiliasi | 0 | Laporan stok opname |
| Stok negatif di database | 0 (dijamin constraint transaksional) | Query audit berkala |
| Transaksi kritis tercatat di audit log | 100% | Verifikasi tabel audit_logs |
| Waktu deteksi barang stok rendah | Real-time via dashboard | Widget stok rendah |
| Kesalahan validasi lolos ke database | 0 | Isomorphic validation (Zod client + server) |

---

## 9. Batasan & Asumsi

### 9.1 Batasan (Constraints)

- Aplikasi bersifat internal (single-company), bukan multi-tenant.
- Ekspor terbatas pada format CSV.
- Rate limiting bergantung Redis; sistem tetap berjalan (fail-open) jika Redis tidak tersedia.

### 9.2 Asumsi (Assumptions)

- Pengguna mengakses sistem melalui browser modern yang mendukung JavaScript.
- MySQL dan (opsional) Redis tersedia pada lingkungan deployment.
- Riwayat transaksi bersifat permanen; penghapusan data menggunakan soft delete.
- Perubahan requirement mengikuti proses revisi dokumen ini (riwayat revisi di Bab awal).

---

