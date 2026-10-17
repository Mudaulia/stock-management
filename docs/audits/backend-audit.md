# Audit Backend — Stock Management

**Ημερομηνία**: 2026-10-17
**Αντικείμενο**: Σύγκριση υλοποίησης με API Documentation (`docs/backend/API-DOCUMENTATION.md`)
**Τεστ**: `grep_search` + `read_file` σε όλα τα αρχεία routes и lib

---

## Σύντομη Συνοπτική

Η υλοποίηση ακολουθεί **κυρίως** την τεκμηρίωση, αλλά υπάρχουν **4 σημαντικά bugs** (1 security, 2 UX, 1 data integrity), **3 inconsistencies** μεταξύ doc και code, и **παραλείψεις** στα docs (δεν καλύπτουν bulk delete, reconciliation logs).

---

## ✅ Πράγματα που ταιριάζουν

| Στοιχείο | Κατάσταση |
|----------|-----------|
| Tech stack (Next.js 14.2.0, Prisma 5.12.0, jose, zod 3.22+, ioredis 6.x, bcryptjs cost 12) | ✅ Sync |
| Cookie config: `auth-token` httpOnly, secure=prod, sameSite=lax, path=/ | ✅ Sync |
| JWT alg: HS256, expiry 7d | ✅ Sync |
| CSRF: separate JWT, 1h expiry, cookie+header token, skip GET/HEAD/OPTIONS | ✅ Sync |
| Rate limit: 5/min/IP, Redis ZSET, fail-open, response headers | ✅ Sync |
| Auth check: `getCurrentUser()` → JWT → DB, inactive users rejected | ✅ Sync |
| RBAC: VIEWER read-only, ADMIN+WAREHOUSE_STAFF write, ADMIN-only reconcile | ✅ Sync |
| Soft delete items (isActive=false), hard delete bulk via API | ✅ Sync |
| Stock concurrency: optimistic lock with `updateMany` | ✅ Sync |
| Opname stale check: `updateMany` with `currentStock === systemStock` | ✅ Sync |
| Auto ADJUSTMENT transaction on opname reconcile (when diff≠0) | ✅ Sync |
| All endpoints protected by auth check | ✅ Sync |
| POST/PUT/DELETE require CSRF | ✅ Sync |
| Pagination convention: `{page, limit, total, totalPages}` | ✅ Sync |
| Standard response shape: `{data, pagination?, summary?}` | ✅ Sync |

---

## 🔴 Critical / Security

### 1. Missing CSRF on `items/[id]` PUT and DELETE — **BUG (Security)**

**Πού**: `src/app/api/items/[id]/route.ts`

**Τι λέει η doc**: POST/PUT/DELETE πρέπει να έχουν CSRF protection.

**Τι υπάρχει**: Η συνάρτηση `verifyCSRF` **δεν καλείται** στα `PUT` και `DELETE` της `/items/[id]/route.ts`. Μόνο η `GET` έχει auth check.

```typescript
// items/[id]/route.ts - PUT
export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser()  // ← ΜΟΝΟ auth check, ΟΧΙ CSRF!
    // ...
  }
}

// items/[id]/route.ts - DELETE
export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser()  // ← ΜΟΝΟ auth check, ΟΧΙ CSRF!
    // ...
  }
}
```

**Σύγκριση με άλλα routes**:
- `items/route.ts` POST/DELETE: ✅ `verifyCSRF(request)`
- `stock-in/route.ts` POST: ✅ `verifyCSRF(request)`
- `stock-out/route.ts` POST: ✅ `verifyCSRF(request)`
- `opname/route.ts` POST: ✅ `verifyCSRF(request)`
- `opname/[id]/route.ts` PUT/DELETE: ✅ `verifyCSRF(request)` (για το PUT)

**Impact**: XSS/CSRF attack μπορεί να τροποποιήσει ή να διαγράψει item χωρίς CSRF token.

**Fix**: Προσθήκη `verifyCSRF(request)` στο PUT και DELETE της `/items/[id]/route.ts`.

---

### 2. Λανθασμένο HTTP status για rate limit — **BUG**

**Πού**: `src/app/api/auth/login/route.ts`

**Τι λέει η doc**: 
> | 429 | Too Many Requests |

**Τι υπάρχει**:
```typescript
if (!rateLimitResult.success) {
  return NextResponse.json(
    { message: 'Terlalu banyak percobaan login...' },
    { status: 403 }  // ← ΛΑΘΟΣ! Θα έπρεπε να είναι 429
  )
}
```

**Impact**: Η frontend λογική που ελέγχει 429 θα χάνει αυτή την περίπτωση. Τα tools monitoring θα καταγράφουν λάθος status code.

---

## 🟡 Medium — Data Integrity / UX

### 3. Opname POST schema ≠ Documentation — **INCONSISTENCY**

**Τι λέει η doc**:
```json
{
  "itemId": string (required),
  "opnameDate": string (required, ISO datetime)
}
```

**Τι υπάρχει στην υλοποίηση** (`opname/route.ts`):
```typescript
const opnameSchema = z.object({
  itemId: z.string().min(1, 'Barang wajib dipilih'),
  physicalStock: z.coerce.number().int().nonnegative(...),  // ← REQUIRED!
  notes: z.string().optional(),
  opnameDate: z.string().min(1, 'Tanggal wajib diisi'),
})
```

**Problem**: Η doc λέει ότι το `physicalStock` μπαίνει στο **PUT /opname/:id**, όχι στο POST. Στην υλοποίηση, το POST απαιτεί `physicalStock` (mandatory). Αυτό σημαίνει ότι ο χρήστης πρέπει να δώσει physical stock αμέσως beim creation — δεν υπάρχει workflow "create → count → update".

**Recommendation**:
- Ή διορθώνουμε τη doc (να αναφέρει το physicalStock ως required στο POST)
- Ή αλλάζουμε το schema στο POST να γίνεται optional (και να βάλουμε validation στο PUT)

### 4. Γλωσσικά inconsistencies — **UX Issue**

Πολλά error messages είναι στα **Indonesian** αντί για αγγλικά ή ελληνικά:
- `"Barang tidak ditemukan"` (Item not found)
- `"Kode barang sudah digunakan"` (Item code already used)
- `"Masih ada opname pending untuk barang ini..."` (Still a pending opname...)
- `"Validasi gagal"` (Validation failed)
- `"Hanya opname dengan status PENDING yang dapat diubah"` (Only PENDING opnames can be changed)

**Impact**: Δυσκολία στη συντήρηση, σύγχυση για μη indophones developers, inconsistency με τα ελληνικά messages σε άλλα routes.

**Recommendation**: Standardize σε English (ή Greek αν είναι target market).

---

## 🟢 Minor — Documentation Gaps

### 5. Έλλειψη docs για bulk DELETE

Η doc αναφέρει:
> `DELETE /api/items` (Bulk Delete) — **HARD DELETE** με cascade

Αλλά **δεν περιγράφεται** πλήρως:
- Request body schema `{ids: string[]}`
- Response shape `{deletedCount: number}`
- Difference από soft delete του `DELETE /api/items/:id`

### 6. Reconciliation audit logs — missing detail

Η doc λέει:
> Create audit logs: ADJUST (item stock change) + RECONCILE (opname status change)

Η υλοποίηση (reconcile/route.ts) κάνει:
```typescript
// Audit log
await tx.auditLog.create({
  data: {
    userId: user.id,
    action: 'RECONCILE',
    entity: 'StockOpname',
    entityId: id,
    newData: { /* partial */ }
  }
})
```

Δεν δημιουργείται ξεχωριστό audit log για το item stock change (ADJUST).

---

## 📊 Summary Table

| Κατηγορία | Αριθμός | Severity |
|-----------|---------|----------|
| Security bugs | 1 | 🔴 High |
| Incorrect HTTP status | 1 | 🟡 Medium |
| Schema mismatch | 1 | 🟡 Medium |
| Language inconsistencies | ~10 | 🟢 Low |
| Doc gaps | 2 | 🟢 Low |

---

## 🔧 Recommendations (Priority Order)

1. **P0**: Add CSRF check to `items/[id]/route.ts` PUT and DELETE
2. **P1**: Fix rate limit status code (403 → 429)
3. **P1**: Decide on opname POST schema — align doc or code
4. **P2**: Standardize error message language
5. **P3**: Extend reconciliation audit logs
6. **P3**: Document bulk delete endpoint fully

---

## 📁 Files Checked

| Route | File |
|-------|------|
| POST /api/auth/login | `src/app/api/auth/login/route.ts` |
| POST /api/auth/logout | `src/app/api/auth/logout/route.ts` |
| GET /api/auth/me | `src/app/api/auth/me/route.ts` |
| GET /api/items | `src/app/api/items/route.ts` |
| POST /api/items | `src/app/api/items/route.ts` |
| DELETE /api/items (bulk) | `src/app/api/items/route.ts` |
| GET /api/items/:id | `src/app/api/items/[id]/route.ts` |
| PUT /api/items/:id | `src/app/api/items/[id]/route.ts` |
| DELETE /api/items/:id | `src/app/api/items/[id]/route.ts` |
| GET /api/items/export | `src/app/api/items/export/route.ts` |
| GET/POST /api/stock-in | `src/app/api/stock-in/route.ts` |
| GET/POST /api/stock-out | `src/app/api/stock-out/route.ts` |
| GET/POST /api/stock-adjustment | `src/app/api/stock-adjustment/route.ts` |
| GET/POST /api/opname | `src/app/api/opname/route.ts` |
| GET/PUT/DELETE /api/opname/:id | `src/app/api/opname/[id]/route.ts` |
| POST /api/opname/:id/reconcile | `src/app/api/opname/[id]/reconcile/route.ts` |
| GET /api/dashboard/stats | `src/app/api/dashboard/stats/route.ts` |
| GET /api/dashboard/low-stock-items | `src/app/api/dashboard/low-stock-items/route.ts` |
| GET /api/dashboard/recent-transactions | `src/app/api/dashboard/recent-transactions/route.ts` |
| GET /api/reports/stock | `src/app/api/reports/stock/route.ts` |
| GET /api/reports/stock/export | `src/app/api/reports/stock/export/route.ts` |
| GET /api/reports/low-stock | `src/app/api/reports/low-stock/route.ts` |
| GET /api/reports/low-stock/export | `src/app/api/reports/low-stock/export/route.ts` |
| GET /api/reports/mutation | `src/app/api/reports/mutation/route.ts` |
| GET /api/reports/mutation/export | `src/app/api/reports/mutation/export/route.ts` |

| Library | File |
|---------|------|
| Auth | `src/lib/auth.ts` |
| CSRF | `src/lib/csrf.ts` |
| Rate Limiter | `src/lib/rate-limiter.ts` |
| API Response | `src/lib/api-response.ts` |
| Middleware | `src/middleware.ts` |

---

**Σημείωση**: Η τεκμηρίωση είναι γενικά ακριβής. Τα bugs εντοπίστηκαν μέσω static analysis — δεν έγινε runtime testing.
