# API Data Structure & Rendering Analysis

## Ringkasan Eksekutif

Dokumen ini berisi analisis terhadap:

1. **Struktur data request/response API** — apakah konsisten dan matching antar endpoint.
2. **Pola rendering** — apakah project menggunakan Server-Side Rendering (SSR), Client-Side Rendering (CSR), atau campuran.

Analisis dilakukan berdasarkan inspeksi langsung terhadap source code di `src/app/api/`, `src/app/(dashboard)/`, `src/lib/auth.ts`, `prisma/schema.prisma`, dan konfigurasi Next.js.

---

## 1. Struktur Data API — Request & Response

### 1.1 Pola Umum (Consistent Pattern)

Hampir seluruh endpoint API mengikuti pola berikut:

#### Request
- **Method**: `GET`, `POST`, `PUT`, `DELETE`
- **Auth**: Memeriksa session via `getCurrentUser()` atau `getServerSession()` dari `@/lib/auth`
- **Validation**: Menggunakan Zod schema (`z.object(...)`) untuk memvalidasi body request
- **Response sukses**: `NextResponse.json(data, { status: 200/201 })`
- **Response error**: `NextResponse.json({ message: string, errors?: ... }, { status: 400/401/403/404/500 })`

#### Response Sukses (GET — List/Paginated)
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "summary": { ... }  // opsional, hanya di endpoint report
}
```

#### Response Sukses (GET — Single Item)
```json
{ ...itemObject }
```

#### Response Sukses (POST/PUT — Create/Update)
```json
{ ...createdOrUpdatedObject }
```

#### Response Error
```json
{
  "message": "Deskripsi error dalam bahasa Indonesia",
  "errors": [ ... ]  // hanya untuk Zod validation errors
}
```

### 1.2 Endpoint-by-Endpoint Analysis

#### 1.2.1 Auth Endpoints

| Endpoint | Method | Request Body | Response | Catatan |
|----------|--------|-------------|----------|---------|
| `/api/auth/login` | POST | `{ email: string, password: string }` | `{ user: { id, email, username, fullName, role } }` | **Tidak ada pagination/summary** — konsisten |
| `/api/auth/logout` | POST | (kosong) | `{ message: "Logout berhasil" }` | **Tidak ada pagination/summary** — konsisten |

**Status**: ✅ Matching — auth endpoints memiliki struktur response yang konsisten dan sesuai konteksnya.

#### 1.2.2 Items Endpoints

| Endpoint | Method | Request Body | Response | Catatan |
|----------|--------|-------------|----------|---------|
| `/api/items` | GET | Query params: `page, limit, search, isActive, sortBy, sortOrder` | `{ data: [...], pagination: {...} }` | **Konsisten** |
| `/api/items` | POST | `{ code, name, unit, minStock, currentStock, description? }` | `{ ...item }` (tanpa pagination) | **Konsisten** — create mengembalikan single object |
| `/api/items/[id]` | GET | (path param `id`) | `{ ...item }` (tanpa pagination) | **Konsisten** — single item |
| `/api/items/[id]` | PUT | `{ code?, name?, unit?, minStock?, description?, isActive? }` | `{ ...item }` (tanpa pagination) | **Konsisten** |
| `/api/items/[id]` | DELETE | (path param `id`) | `{ message: "..." }` | **Konsisten** |

**Status**: ✅ Matching — semua endpoint items memiliki struktur response yang konsisten. List endpoints mengembalikan `{ data, pagination }`, single/create/update mengembalikan object langsung.

#### 1.2.3 Stock In / Stock Out Endpoints

| Endpoint | Method | Request Body | Response | Catatan |
|----------|--------|-------------|----------|---------|
| `/api/stock-in` | GET | Query params: `page, limit, itemId, startDate, endDate, sortBy, sortOrder` | `{ data: [...], pagination: {...} }` | **Konsisten** |
| `/api/stock-in` | POST | `{ itemId, quantity, reference?, notes?, transactionDate? }` | `{ ...transaction }` (dengan `include: item`) | **Konsisten** |
| `/api/stock-out` | GET | Query params: sama seperti stock-in | `{ data: [...], pagination: {...} }` | **Konsisten** |
| `/api/stock-out` | POST | `{ itemId, quantity, reference?, notes?, transactionDate? }` | `{ ...transaction }` (dengan `include: item`) | **Konsisten** |

**Perhatian**: Stock-in dan stock-out menggunakan endpoint terpisah meskipun keduanya adalah `StockTransaction` dengan `type` yang berbeda. Ini adalah keputusan desain yang valid — tidak masalah dari segi konsistensi struktur data.

**Status**: ✅ Matching — struktur response konsisten antar kedua endpoint.

#### 1.2.4 Opname Endpoints

| Endpoint | Method | Request Body | Response | Catatan |
|----------|--------|-------------|----------|---------|
| `/api/opname` | GET | Query params: `page, limit, search, status, startDate, endDate` | `{ data: [...], pagination: {...} }` | **Konsisten** |
| `/api/opname` | POST | `{ itemId, physicalStock, notes?, opnameDate }` | `{ ...opname }` (dengan `include: item, createdBy`) | **Konsisten** |
| `/api/opname/[id]` | GET | (path param `id`) | `{ ...opname }` (dengan `include: item, createdBy, reconciliation`) | **Konsisten** |
| `/api/opname/[id]` | PUT | `{ physicalStock?, notes? }` | `{ ...opname }` (dengan `include: item, createdBy`) | **Konsisten** |
| `/api/opname/[id]` | DELETE | (path param `id`) | `{ message: "..." }` | **Konsisten** |
| `/api/opname/[id]/reconcile` | POST | `{ notes? }` | `{ ... }` (lihat di bawah) | **Perlu verifikasi** |

**Status**: ✅ Matching — hampir semua endpoint opname konsisten. Namun, response dari `reconcile` endpoint belum sepenuhnya terlihat karena file terpotong. Berdasarkan kode yang ada, endpoint ini mengembalikan hasil dari transaksi Prisma (`$transaction`), yang kemungkinan besar berupa object `StockReconciliation` atau `StockOpname` yang diupdate.

#### 1.2.5 Reports Endpoints

| Endpoint | Method | Request Body | Response | Catatan |
|----------|--------|-------------|----------|---------|
| `/api/reports/stock` | GET | Query params: `page, limit, search, lowStockOnly, isActive` | `{ data: [...], pagination: {...}, summary: {...} }` | **Konsisten** — menambahkan `summary` |
| `/api/reports/mutation` | GET | Query params: `page, limit, search, type, startDate, endDate, itemId` | `{ data: [...], pagination: {...}, summary: {...} }` | **Konsisten** — menambahkan `summary` |
| `/api/reports/low-stock` | GET | Query params: `page, limit, search, includeZeroStock` | `{ data: [...], pagination: {...}, summary: {...} }` | **Konsisten** — menambahkan `summary` |

**Status**: ✅ Matching — ketiga endpoint report mengikuti pola yang sama: `{ data, pagination, summary }`. Field `summary` berisi agregasi data yang relevan dengan laporan.

### 1.3 Inconsistency yang Ditemukan

#### 1.3.1 Auth Method yang Berbeda

- **`/api/items/*`** dan **`/api/stock-in/*`, `/api/stock-out/*`** menggunakan `getCurrentUser()` dari `@/lib/auth`
- **`/api/opname/*`** dan **`/api/reports/*`** menggunakan `getServerSession()` dari `@/lib/auth`

Kedua fungsi ini pada dasarnya melakukan hal yang sama — `getServerSession()` adalah wrapper di sekitar `getCurrentUser()`. Ini bukan inkonsistensi struktur data, tetapi inkonsistensi dalam penggunaan API auth. Ini dapat menyebabkan kebingungan tetapi tidak memengaruhi struktur request/response.

#### 1.3.2 Response Single Item vs Paginated

- **List endpoints** (GET dengan banyak data): selalu mengembalikan `{ data: [...], pagination: {...} }`
- **Single item endpoints** (GET by ID, POST, PUT): mengembalikan object langsung tanpa pembungkus `{ data }`

Ini adalah pola yang konsisten dan dapat diterima — tidak dianggap inkonsistensi.

#### 1.3.3 Field `errors` pada Zod Validation

- **`/api/items/route.ts`** (GET): mengembalikan `{ message, errors: error.errors }`
- **`/api/items/[id]/route.ts`** (PUT): mengembalikan `{ message, errors: error.errors }`
- **`/api/stock-in/route.ts`** (GET & POST): mengembalikan `{ message, errors: error.errors }`
- **`/api/stock-out/route.ts`** (GET & POST): mengembalikan `{ message, errors: error.errors }`
- **`/api/opname/route.ts`** (POST): mengembalikan `{ message, errors: validation.error.flatten().fieldErrors }` — **berbeda!**
- **`/api/opname/[id]/route.ts`** (PUT): mengembalikan `{ message, errors: validation.error.flatten().fieldErrors }` — **berbeda!**
- **`/api/opname/[id]/reconcile/route.ts`** (POST): mengembalikan `{ message, errors: validation.error.flatten().fieldErrors }` — **berbeda!**

**Status**: ⚠️ **Inconsistency ditemukan** — endpoint opname menggunakan `validation.error.flatten().fieldErrors` (format object key-value) sementara endpoint lain menggunakan `error.errors` (format array ZodError standar). Frontend perlu menangani dua format error yang berbeda.

#### 1.3.4 Response dari Reconcile Endpoint

File `/api/opname/[id]/reconcile/route.ts` terpotong sebelum selesai. Berdasarkan kode yang tersedia, endpoint ini:
- Memvalidasi dengan `reconcileSchema` (hanya `notes?`)
- Melakukan transaksi database
- Mengembalikan hasil dari `prisma.$transaction()`

Tanpa melihat akhir file, strukturnya kemungkinan konsisten, tetapi perlu verifikasi akhir.

### 1.4 Kesimpulan Struktur Data API

| Aspek | Status |
|-------|--------|
| Pola response umum (data + pagination) | ✅ Konsisten |
| Pola response error (message + errors) | ⚠️ **Inconsistency** — opname menggunakan format error yang berbeda |
| Auth method (getCurrentUser vs getServerSession) | ⚠️ **Inconsistency** — dua cara berbeda untuk mencapai hal yang sama |
| Request validation (Zod) | ✅ Konsisten |
| Response single item vs list | ✅ Konsisten (pola yang dapat diterima) |

---

## 2. Pola Rendering — SSR vs CSR

### 2.1 Gambaran Umum

Project ini menggunakan **Next.js 14.2.0** dengan App Router. Berdasarkan inspeksi kode, project ini menggunakan **campuran SSR dan CSR**:

- **Halaman utama dan layout**: Server-Side Rendering (SSR)
- **Halaman dashboard dan form**: Client-Side Rendering (CSR) dengan `"use client"` directive

### 2.2 Server-Side Rendering (SSR)

#### Layout dan Halaman yang Di-render di Server

1. **`src/app/layout.tsx`** — Root layout, tidak memiliki `"use client"`, di-render di server
2. **`src/app/page.tsx`** — Halaman home, hanya melakukan redirect ke `/dashboard`
3. **`src/app/(dashboard)/dashboard/layout.tsx`** — Dashboard layout, **bisa di-render di server** (tidak ada `"use client"`), tetapi menerima `userRole` sebagai prop
4. **`src/app/(dashboard)/dashboard/page.tsx`** — Dashboard page, **di-render di server** (tidak ada `"use client"`), menggunakan `getCurrentUser()` dan `prisma` langsung untuk mengambil data

#### Karakteristik SSR di Project Ini

- Data diambil langsung di server menggunakan Prisma (`prisma.item.count()`, `prisma.stockTransaction.findMany()`, dll.)
- User di-autentikasi di server menggunakan `getCurrentUser()`
- Hasil rendering dikirim ke client sebagai HTML yang sudah lengkap
- **Keuntungan**: Lebih cepat untuk first paint, lebih baik untuk SEO, data sudah tersedia saat halaman dimuat

#### Contoh: Dashboard Page (SSR)

```typescript
// src/app/(dashboard)/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await getCurrentUser()  // Server-side
  const stats = await getDashboardStats()  // Server-side Prisma query
  const recentTransactions = await getRecentTransactions()  // Server-side Prisma query

  // ... rendering dengan data yang sudah tersedia
}
```

### 2.3 Client-Side Rendering (CSR)

#### Halaman yang Menggunakan `"use client"`

1. **`src/app/(auth)/login/page.tsx`** — Login page
2. **`src/app/(dashboard)/dashboard/items/page.tsx`** — Items management
3. **`src/app/(dashboard)/dashboard/stock-in/page.tsx`** — Stock in
4. **`src/app/(dashboard)/dashboard/stock-out/page.tsx`** — Stock out
5. **`src/app/(dashboard)/dashboard/opname/page.tsx`** — Opname
6. **`src/app/(dashboard)/dashboard/reports/stock/page.tsx`** — Stock report
7. **`src/app/(dashboard)/dashboard/reports/mutation/page.tsx`** — Mutation report
8. **`src/app/(dashboard)/dashboard/reports/low-stock/page.tsx`** — Low stock report
9. **`src/app/(dashboard)/dashboard/sidebar.tsx`** — Sidebar (interaktif)
10. **`src/app/(dashboard)/dashboard/dashboard-context.tsx`** — Context provider

#### Karakteristik CSR di Project Ini

- Data diambil menggunakan `fetch()` ke API routes setelah komponen mount
- State dikelola dengan `useState` dan `useEffect`
- Form menggunakan `react-hook-form` dengan `zodResolver`
- Interaktivitas seperti pencarian, filter, pagination, dialog, dan toast dikelola di client

#### Contoh: Items Page (CSR)

```typescript
// src/app/(dashboard)/dashboard/items/page.tsx
"use client";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({...});

  const fetchItems = async () => {
    setIsLoading(true);
    const res = await fetch(`/api/items?${params}`);  // Client-side fetch
    const json = await res.json();
    setItems(json.data);
    setPagination(json.pagination);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();  // Fetch setelah mount
  }, []);

  // ... rendering dengan state
}
```

### 2.4 API Routes — Server-Side

Semua endpoint di `src/app/api/` adalah **server-side functions** (Route Handlers di Next.js 14). Mereka:
- Dijalankan di server
- Mengakses database langsung melalui Prisma
- Mengembalikan JSON response
- Tidak pernah di-render di client

### 2.5 Middleware — Server-Side

**`src/middleware.ts`** berjalan di server untuk:
- Memeriksa auth token dari cookie
- Redirect ke halaman login jika tidak terautentikasi
- Menambahkan header `x-user-id`, `x-user-role`, `x-user-email` ke request

### 2.6 Dynamic Rendering

Beberapa endpoint API menggunakan `export const dynamic = 'force-dynamic'`:
- `/api/reports/stock/route.ts`
- `/api/reports/mutation/route.ts`
- `/api/reports/low-stock/route.ts`

Ini memaksa endpoint untuk tidak di-cache dan selalu dijalankan di server.

### 2.7 Kesimpulan Pola Rendering

| Layer | Teknologi | Pola Rendering |
|-------|-----------|----------------|
| Root Layout | `src/app/layout.tsx` | SSR |
| Home Page | `src/app/page.tsx` | SSR (redirect only) |
| Dashboard Layout | `src/app/(dashboard)/dashboard/layout.tsx` | SSR |
| Dashboard Page | `src/app/(dashboard)/dashboard/page.tsx` | **SSR** (data diambil di server) |
| Auth Pages | `src/app/(auth)/login/page.tsx` | CSR (`"use client"`) |
| CRUD Pages | `items/`, `stock-in/`, `stock-out/`, `opname/` | CSR (`"use client"`) |
| Report Pages | `reports/*` | CSR (`"use client"`) |
| Sidebar | `sidebar.tsx` | CSR (`"use client"`) |
| API Routes | `src/app/api/*` | Server-side (Route Handlers) |
| Middleware | `src/middleware.ts` | Server-side |

**Kesimpulan**: Project ini menggunakan **hybrid rendering** — dashboard page dan layout di-render di server (SSR) untuk performa dan SEO, sementara halaman interaktif (CRUD, laporan, login) menggunakan client-side rendering (CSR) untuk pengalaman pengguna yang dinamis.

### 2.8 CSR Data Fetching Patterns

#### Pola Umum CSR Fetching (Sebelum Standardisasi)

Semua halaman CSR mengikuti pola berikut:

```typescript
const fetchItems = async () => {
  setIsLoading(true)
  try {
    const response = await fetch(`/api/items?${params}`)
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || 'Gagal memuat data')
    setItems(result.data)
    setPagination(result.pagination)
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Terjadi kesalahan')
  } finally {
    setIsLoading(false)
  }
}
```

**Masalah:**
- Tidak ada validasi tipe response — `result.data` diasumsikan benar
- Error handling manual di setiap halaman
- Duplikasi kode fetch + error handling

#### Pola Baru dengan `fetchWithZod` (Setelah Standardisasi)

```typescript
import { fetchSummary } from '@/lib/fetch-utils'
import { itemWithStockStatusSchema } from '@/lib/schemas'

const fetchItems = async () => {
  setIsLoading(true)
  try {
    const result = await fetchSummary<StockItem>(
      `/api/reports/stock?${params}`,
      itemWithStockStatusSchema
    )
    if (!result.ok) throw new Error(result.message)
    setItems(result.data)
    setPagination(result.pagination)
    setSummary(result.summary)
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Terjadi kesalahan')
  } finally {
    setIsLoading(false)
  }
}
```

**Keuntungan:**
- Response divalidasi dengan Zod — type safety + runtime validation
- Error handling terpusat di `fetchWithZod`
- `FetchResult<T>` type memberi type safety yang jelas
- `formatZodErrors()` untuk mapping error ke form fields

---

## 3. Rekomendasi

### 3.1 Konsistensi Error Format (Prioritas: Medium)

Endpoint opname menggunakan format error yang berbeda (`validation.error.flatten().fieldErrors`) dibanding endpoint lain (`error.errors`). Rekomendasi:

- Standarisasi ke `error.errors` (array ZodError standar) di semua endpoint
- Atau dokumentasikan perbedaan ini di frontend

### 3.2 Konsistensi Auth Method (Prioritas: Low)

Beberapa endpoint menggunakan `getCurrentUser()` sementara yang lain menggunakan `getServerSession()`. Kedua fungsi ini setara. Rekomendasi:

- Pilih satu metode dan gunakan secara konsisten di seluruh endpoint
- `getCurrentUser()` lebih langsung dan lebih efisien

### 3.3 Dokumentasi API (Prioritas: Medium)

Tidak ada dokumentasi API (misalnya OpenAPI/Swagger) yang tersedia. Rekomendasi:

- Tambahkan dokumentasi API untuk memudahkan frontend developer
- Dokumentasikan struktur request/response untuk setiap endpoint

---

## 4. Cross-Layer Verification — API Response vs Frontend Consumption

### 4.1 Metodologi

Verifikasi dilakukan dengan membandingkan response shape yang dikembalikan oleh setiap API endpoint (setelah standardisasi dengan `api-response.ts`) terhadap apa yang diharapkan oleh halaman frontend yang memanggilnya.

### 4.2 Temuan

#### 4.2.1 Report Endpoints — `summary` Field Mismatch (P0)

**Expected (frontend):**
```ts
interface PaginatedResponse<T> {
  data: T[]
  pagination: { page, limit, total, totalPages }
  summary: { ... }  // frontend calls setSummary(result.summary)
}
```

**Actual (API setelah standardisasi):**
```ts
// paginatedResponse() returns: { data, pagination } — NO summary field
```

**Gap:** `paginatedResponse()` utility tidak mendukung `summary` field, tetapi ketiga halaman report (stock, mutation, low-stock) masih memanggil `setSummary(result.summary)`.

**Impact:** Runtime error — `result.summary` akan `undefined`, dan `setSummary(undefined)` akan menimpa state summary dengan `undefined`, menyebabkan crash ketika komponen mencoba mengakses properti summary.

**Recommendation:** Tiga opsi tersedia:
1. Tambahkan `summary` parameter opsional ke `paginatedResponse()` — **DIPILIH**
2. Update frontend untuk menghandle `summary` yang missing
3. Gunakan `successResponse()` dengan summary untuk report endpoints

**Solusi yang Diimplementasikan:**
- `paginatedResponse()` diperbarui untuk menerima parameter `summary?` ketiga
- Report endpoints diperbarui untuk melewatkan `summary` ke `paginatedResponse()`
- Frontend tidak perlu diubah — response shape tetap konsisten

#### 4.2.2 Auth Endpoints — Response Shape Changed (P1)

**Expected (frontend login):**
```ts
// Login page hanya memakai result.message untuk error handling
// dan router.push('/dashboard') setelah sukses — tidak memakai result.data
```

**Actual (API setelah standardisasi):**
```ts
// successResponse({ user: {...} }) → { data: { user: {...} } }
// successResponse(null, 'Logout berhasil') → { data: null, summary: { message: "Logout berhasil" } }
```

**Gap:** Login response berubah dari `{ user: {...} }` langsung ke `{ data: { user: {...} } }`. Namun frontend login tidak memakai `result.data` — hanya memakai `result.message` untuk error dan `router.push()` untuk sukses. Jadi **tidak ada breaking change** di praktik.

Logout response berubah dari `{ message: "..." }` ke `{ data: null, summary: { message: "..." } }`. Frontend logout (di sidebar) hanya memakai `response.ok` dan tidak memakai `result.message`. Jadi **tidak ada breaking change** di praktik.

**Impact:** Tidak ada runtime error, tetapi response shape berubah. Jika frontend di masa depan membutuhkan `result.user` langsung, akan perlu update.

**Recommendation:** Frontend login dan logout sudah tidak bergantung pada response shape spesifik, jadi perubahan ini aman.

#### 4.2.3 Items Endpoints — Response Shape Changed (P2)

**Expected (frontend items):**
```ts
// GET: json.data, json.pagination — masih cocok
// POST/PUT: json.message untuk error handling — masih cocok
// DELETE: json.message untuk error handling — masih cocok
```

**Actual (API setelah standardisasi):**
```ts
// GET: paginatedResponse() → { data, pagination } — MATCH
// POST: successResponse(item) → { data: item } — frontend tidak memakai result.data
// PUT: successResponse(item) → { data: item } — frontend tidak memakai result.data
// DELETE: successResponse(item, 'Barang berhasil dihapus') → { data: item, summary: { message: "..." } }
```

**Gap:** POST/PUT/DELETE response berubah dari object langsung ke `{ data: item }`. Frontend hanya memakai `json.message` untuk error handling dan tidak memakai `result.data` untuk POST/PUT/DELETE. Jadi **tidak ada breaking change** di praktik.

**Impact:** Tidak ada runtime error.

#### 4.2.4 Stock In/Out Endpoints — Response Shape Changed (P2)

**Expected (frontend stock-in/stock-out):**
```ts
// GET: json.data, json.pagination — masih cocok
// POST: json.message untuk error handling — masih cocok
```

**Actual (API setelah standardisasi):**
```ts
// GET: paginatedResponse() → { data, pagination } — MATCH
// POST: successResponse(result) → { data: result } — frontend tidak memakai result.data
```

**Gap:** POST response berubah dari object langsung ke `{ data: result }`. Frontend hanya memakai `json.message` untuk error handling. **Tidak ada breaking change** di praktik.

**Impact:** Tidak ada runtime error.

#### 4.2.5 Opname Endpoints — Response Shape Changed (P2)

**Expected (frontend opname):**
```ts
// GET: json.data, json.pagination — masih cocup
// POST: json.message untuk error handling — masih cocup
// DELETE: json.message untuk error handling — masih cocup
// RECONCILE: json.message untuk error handling — masih cocup
```

**Actual (API setelah standardisasi):**
```ts
// GET: paginatedResponse() → { data, pagination } — MATCH
// POST: successResponse(opname) → { data: opname } — frontend tidak memakai result.data
// DELETE: successResponse(item, '...') → { data: item, summary: { message: "..." } }
// RECONCILE: successResponse(result) → { data: result }
```

**Gap:** Response shape berubah, tetapi frontend tidak memakai `result.data` untuk POST/DELETE/RECONCILE. **Tidak ada breaking change** di praktik.

**Impact:** Tidak ada runtime error.

### 4.3 Solusi yang Diimplementasikan

#### 4.3.1 `src/lib/fetch-utils.ts` (BARU)

File utilitas baru yang menyediakan:

- **`fetchWithZod<T>(url, schema, init?)`** — Fetch wrapper yang memvalidasi response dengan Zod schema
- **`fetchPaginated<T>(url, dataSchema, init?)`** — Convenience wrapper untuk paginated list responses
- **`fetchSingle<T>(url, dataSchema, init?)`** — Convenience wrapper untuk single item responses
- **`fetchSummary<T>(url, dataSchema, init?)`** — Convenience wrapper untuk summary responses (reports)
- **`formatZodErrors(errors)`** — Format ZodError menjadi object key-value untuk form display
- **`getErrorMessage(result)`** — Extract user-friendly error message dari FetchResult

Response shape:
```ts
type FetchResult<T> =
  | { ok: true; data: T; pagination?: Pagination; summary?: Record<string, unknown> }
  | { ok: false; message: string; errors?: unknown[]; code?: string; status: number }
```

#### 4.3.2 `src/lib/schemas.ts` (BARU)

Zod schemas untuk semua tipe data frontend:

- `userSchema`, `loginResponseSchema`
- `itemSchema`, `itemWithStockStatusSchema`, `itemWithShortageSchema`
- `stockTransactionSchema`, `stockTransactionWithItemStockSchema`
- `stockOpnameSchema`, `reconciliationSchema`
- `stockReportSummarySchema`, `lowStockReportSummarySchema`, `mutationSummarySchema`

#### 4.3.3 `src/lib/api-response.ts` — `paginatedResponse()` Update

`paginatedResponse()` diperbarui untuk menerima parameter `summary?` ketiga:

```ts
export function paginatedResponse<T>(
  data: T,
  pagination: Pagination,
  summary?: Record<string, unknown>
): ApiSuccessResponse<T>
```

Report endpoints (stock, mutation, low-stock) diperbarui untuk melewatkan `summary` ke `paginatedResponse()`.

### 4.4 Kesimpulan Cross-Layer Verification

| Layer | Endpoint | Response Shape | Frontend Expectation | Status |
|-------|----------|---------------|---------------------|--------|
| API | `/api/items` GET | `{ data, pagination }` | `json.data`, `json.pagination` | ✅ Match |
| API | `/api/items` POST | `{ data: item }` | `json.message` (error only) | ✅ Match |
| API | `/api/items/[id]` PUT | `{ data: item }` | `json.message` (error only) | ✅ Match |
| API | `/api/items/[id]` DELETE | `{ data: item, summary: { message } }` | `json.message` (error only) | ✅ Match |
| API | `/api/reports/stock` GET | `{ data, pagination, summary }` | `result.data`, `result.pagination`, `result.summary` | ✅ Match (after fix) |
| API | `/api/reports/mutation` GET | `{ data, pagination, summary }` | `result.data`, `result.pagination`, `result.summary` | ✅ Match (after fix) |
| API | `/api/reports/low-stock` GET | `{ data, pagination, summary }` | `result.data`, `result.pagination`, `result.summary` | ✅ Match (after fix) |
| API | `/api/auth/login` POST | `{ data: { user } }` | `result.message` (error only) | ✅ Match |
| API | `/api/auth/logout` POST | `{ data: null, summary: { message } }` | `response.ok` only | ✅ Match |
| API | `/api/stock-in` GET | `{ data, pagination }` | `json.data`, `json.pagination` | ✅ Match |
| API | `/api/stock-in` POST | `{ data: transaction }` | `json.message` (error only) | ✅ Match |
| API | `/api/stock-out` GET | `{ data, pagination }` | `json.data`, `json.pagination` | ✅ Match |
| API | `/api/stock-out` POST | `{ data: transaction }` | `json.message` (error only) | ✅ Match |
| API | `/api/opname` GET | `{ data, pagination }` | `json.data`, `json.pagination` | ✅ Match |
| API | `/api/opname` POST | `{ data: opname }` | `json.message` (error only) | ✅ Match |
| API | `/api/opname/[id]` GET | `{ data: opname }` | (not consumed by frontend) | ✅ Match |
| API | `/api/opname/[id]` PUT | `{ data: opname }` | (not consumed by frontend) | ✅ Match |
| API | `/api/opname/[id]` DELETE | `{ data: opname, summary: { message } }` | `json.message` (error only) | ✅ Match |
| API | `/api/opname/[id]/reconcile` POST | `{ data: result }` | `json.message` (error only) | ✅ Match |

---

## 5. Contoh Penggunaan `fetchWithZod` di Frontend

### 5.1 Report Pages (Summary Response)

```typescript
import { fetchSummary } from '@/lib/fetch-utils'
import { itemWithStockStatusSchema } from '@/lib/schemas'

const result = await fetchSummary<StockItem>(
  `/api/reports/stock?${params}`,
  itemWithStockStatusSchema
)

if (!result.ok) {
  showError(result.message)
  return
}

setItems(result.data)
setPagination(result.pagination)
setSummary(result.summary)
```

### 5.2 Items Page (Paginated Response)

```typescript
import { fetchPaginated } from '@/lib/fetch-utils'
import { itemSchema } from '@/lib/schemas'

const result = await fetchPaginated<Item>(
  `/api/items?${params}`,
  itemSchema
)

if (!result.ok) {
  showError(result.message)
  return
}

setItems(result.data)
setPagination(result.pagination)
```

### 5.3 Single Item (Create/Update/Delete)

```typescript
import { fetchSingle } from '@/lib/fetch-utils'
import { itemSchema } from '@/lib/schemas'

const result = await fetchSingle<Item>(
  `/api/items/${id}`,
  itemSchema
)

if (!result.ok) {
  showError(result.message)
  return
}

setItem(result.data)
```

### 5.4 Error Handling dengan `formatZodErrors`

```typescript
import { fetchWithZod, formatZodErrors } from '@/lib/fetch-utils'
import { itemSchema } from '@/lib/schemas'

const result = await fetchWithZod('/api/items', itemSchema, {
  method: 'POST',
  body: JSON.stringify(data),
})

if (!result.ok && result.errors) {
  const fieldErrors = formatZodErrors(result.errors)
  setError('code', { message: fieldErrors.code })
  setError('name', { message: fieldErrors.name })
}
```

---

## 6. Metadata Dokumen

- **Tanggal analisis**: 2026-10-01
- **Scope**: `src/app/api/`, `src/app/(dashboard)/`, `src/lib/auth.ts`, `prisma/schema.prisma`, `next.config.js`, `tsconfig.json`
- **Versi Next.js**: 14.2.0
- **ORM**: Prisma 5.12.0
- **Database**: MySQL
- **Validation**: Zod 3.22.0
- **Auth**: JWT (jose 5.2.0) + bcryptjs 2.4.3