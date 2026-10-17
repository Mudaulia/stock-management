# Stock Management — Backend Documentation

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Session](#2-authentication--session)
3. [Authorization & RBAC](#3-authorization--rbac)
4. [Security Layer](#4-security-layer)
5. [Input Validation](#5-input-validation)
6. [API Contract](#6-api-contract)
7. [API Routes Reference](#7-api-routes-reference)
   - [7.2. Pola Route dengan Parameter](#72-pola-route-dengan-parameter)
   - [7.3. Best Practices Penulisan API di Next.js](#73-best-practices-penulisan-api-di-nextjs)
8. [Data Models](#8-data-models)
9. [Error Handling](#9-error-handling)
10. [Pagination Convention](#10-pagination-convention)

---

## 1. Architecture Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14.2.0 (App Router) |
| Language | TypeScript 5.4+ (strict mode) |
| ORM | Prisma 5.12.0 |
| Database | MySQL |
| Auth | JWT (jose) + Secure Cookie |
| Validation | Zod 3.22.0 |
| Rate Limiting | Redis (ioredis 6.x) |
| Password Hash | bcryptjs (cost 12) |

### Request Flow

```
Browser
  ↓ (Cookie: auth-token, CSRF-Token)
Next.js Middleware (verify token, inject headers)
  ↓
App Router API Route (src/app/api/...)
  ↓
Auth Check (getCurrentUser / requireAuth)
  ↓
CSRF Verification (POST/PUT/DELETE)
  ↓
Input Validation (Zod schema.parse)
  ↓
Business Logic (Prisma transactions)
  ↓
Audit Log (auto-created)
  ↓
Response (JSON)
```

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST: Authenticate user
│   │   │   ├── logout/route.ts     # POST: Destroy session
│   │   │   └── me/route.ts         # GET: Current user profile
│   │   ├── dashboard/
│   │   │   ├── stats/route.ts      # GET: Dashboard statistics
│   │   │   ├── low-stock-items/route.ts
│   │   │   └── recent-transactions/route.ts
│   │   ├── items/
│   │   │   ├── route.ts            # GET: List items, POST: Create item
│   │   │   ├── [id]/
│   │   │   │   └── route.ts        # GET: Get item, PUT: Update item, DELETE: Soft delete
│   │   │   └── export/route.ts     # GET: Export items to CSV
│   │   ├── opname/
│   │   │   ├── route.ts            # GET: List opnames, POST: Create opname
│   │   │   └── [id]/
│   │   │       └── route.ts        # PUT: Update opname, DELETE: Cancel opname
│   │   ├── opname/[id]/reconcile/
│   │   │   └── route.ts            # POST: Reconcile opname
│   │   ├── reports/
│   │   │   ├── stock/route.ts
│   │   │   ├── stock/export/route.ts
│   │   │   ├── low-stock/route.ts
│   │   │   ├── low-stock/export/route.ts
│   │   │   ├── mutation/route.ts
│   │   │   └── mutation/export/route.ts
│   │   ├── stock-adjustment/route.ts      # GET: List adjustments, POST: Create adjustment
│   │   ├── stock-in/route.ts              # GET: List stock-ins, POST: Create stock-in
│   │   └── stock-out/route.ts             # GET: List stock-outs, POST: Create stock-out
│   ├── (auth)/login/      # Login page
│   └── (dashboard)/       # Dashboard layout
├── lib/
│   ├── auth.ts            # JWT, session, getCurrentUser, requireAuth
│   ├── csrf.ts            # CSRF token generation & verification
│   ├── rate-limiter.ts    # Redis-based rate limiting
│   ├── prisma.ts          # Prisma client singleton
│   ├── api-response.ts    # Response builders (success, error, paginated)
│   ├── schemas.ts         # Zod schemas for frontend validation
│   └── fetch-utils.ts     # fetchWithZod, fetchPaginated helpers
└── middleware.ts          # Next.js middleware (auth redirect, header injection)
```

### API Route Pattern (App Router)

Semua API endpoint mengikuti pola Next.js App Router dengan file `route.ts`:

```typescript
// src/app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, successResponse, paginatedResponse } from '@/lib/api-response'

// GET: Mengambil daftar items
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    // ... business logic
    return NextResponse.json(successResponse(data))
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Membuat item baru
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }
    // ... business logic
    return NextResponse.json(successResponse(newItem), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
```

```typescript
// src/app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: Ambil detail item berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  // ... business logic
}

// PUT: Perbarui item
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  // ... business logic
}

// DELETE: Hapus item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  // ... business logic
}
```

---

## 2. Authentication & Session

### Strategy

- **Algorithm**: HS256 (HMAC-SHA256)
- **Token**: JWT stored in httpOnly cookie
- **Cookie Name**: `auth-token`
- **Expiry**: 7 days
- **Cookie Config**: `httpOnly: true`, `secure: production-only`, `sameSite: lax`, `path: /`

### Endpoints

#### POST `/api/auth/login`

**Purpose**: Authenticate user and create session.

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Validation**:
- Email required
- Password required
- Rate limited: 5 requests/minute/IP (Redis-backed)

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "cuid-string",
      "email": "user@example.com",
      "username": "admin",
      "fullName": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

**Response Headers**:
- `X-CSRF-Token`: New CSRF token for subsequent requests
- `X-RateLimit-Limit`: Maximum requests in window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Unix timestamp when window resets

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 400 | Missing email or password |
| 401 | Invalid credentials or inactive user |
| 429 | Rate limit exceeded |

**Flow**:
1. Check rate limit (Redis, 5 req/min per IP)
2. Find user by email
3. Verify password with bcrypt
4. Update `lastLoginAt`
5. Create JWT token
6. Set `auth-token` cookie (httpOnly, 7 days)
7. Generate and set `csrf-token` cookie
8. Return user data + CSRF token in header

---

#### POST `/api/auth/logout`

**Purpose**: Destroy session and clear cookies.

**Request**: No body required.

**Response** (200 OK):
```json
{
  "data": null,
  "summary": "Logout berhasil"
}
```

**Flow**:
1. Delete `auth-token` cookie
2. Delete `csrf-token` cookie
3. Return success

---

#### GET `/api/auth/me`

**Purpose**: Get current authenticated user profile.

**Headers**: None required (uses cookie session)

**Response** (200 OK):
```json
{
  "data": {
    "id": "cuid-string",
    "email": "user@example.com",
    "username": "admin",
    "fullName": "Admin User",
    "role": "ADMIN",
    "isActive": true
  }
}
```

**Error Responses**:
| Status | Condition |
|--------|-----------|
| 401 | No valid session |

---

## 3. Authorization & RBAC

### Roles

| Role | Key | Description |
|------|-----|-------------|
| Admin | `ADMIN` | Full access including item deletion, reconciliation |
| Warehouse Staff | `WAREHOUSE_STAFF` | Can create/update stock operations |
| Viewer | `VIEWER` | Read-only access |

### Permission Matrix

| Endpoint Group | ADMIN | WAREHOUSE_STAFF | VIEWER |
|----------------|-------|-----------------|--------|
| GET /api/items | ✅ | ✅ | ✅ |
| POST /api/items | ✅ | ✅ | ❌ |
| PUT /api/items/:id | ✅ | ✅ | ❌ |
| DELETE /api/items/:id | ✅ | ❌ | ❌ |
| DELETE /api/items (bulk) | ✅ | ✅ | ❌ |
| GET /api/items/export | ✅ | ✅ | ✅ |
| POST /api/stock-in | ✅ | ✅ | ❌ |
| GET /api/stock-in | ✅ | ✅ | ✅ |
| POST /api/stock-out | ✅ | ✅ | ❌ |
| GET /api/stock-out | ✅ | ✅ | ✅ |
| POST /api/stock-adjustment | ✅ | ✅ | ❌ |
| GET /api/stock-adjustment | ✅ | ✅ | ✅ |
| POST /api/opname | ✅ | ✅ | ❌ |
| GET /api/opname | ✅ | ✅ | ✅ |
| PUT /api/opname/:id | ✅ | ✅ | ❌ |
| DELETE /api/opname/:id | ✅ | ✅ | ❌ |
| POST /api/opname/:id/reconcile | ✅ | ❌ | ❌ |
| GET /api/dashboard/* | ✅ | ✅ | ✅ |
| GET /api/reports/* | ✅ | ✅ | ✅ |

### Auth Helpers

```typescript
// lib/auth.ts

// Returns user object or null (used in routes)
async function getCurrentUser(): Promise<User | null>

// Returns { user, error } tuple (used in requireAuth pattern)
function requireAuth(allowedRoles?: string[]): () => Promise<{ user: User | null; error: string | null }>
```

### Middleware Protection

The Next.js middleware (`src/middleware.ts`) protects all routes except:
- `/login`
- `/register` (if exists)
- `/api/auth/login`
- `/api/auth/register` (if exists)

Middleware injects user headers for server components:
- `x-user-id`
- `x-user-role`
- `x-user-email`

---

## 4. Security Layer

### CSRF Protection

**Library**: Custom JWT-based CSRF token

**Cookie Name**: `csrf-token`
**Header Name**: `x-csrf-token`
**Expiry**: 1 hour
**Secret**: `CSRF_SECRET` env var (falls back to `JWT_SECRET`)

**Protected Methods**: POST, PUT, DELETE (all non-safe HTTP methods)
**Exempt Methods**: GET, HEAD, OPTIONS

**Flow**:
1. Login sets `csrf-token` cookie + returns token in `x-csrf-token` header
2. Client includes token in `x-csrf-token` header for mutations
3. Server verifies token matches user session ID

### Rate Limiting

**Backend**: Redis ZSET-based sliding window

**Config**:
```typescript
interface RateLimitConfig {
  windowMs: number      // Window duration in ms
  maxRequests: number   // Max requests per window
  keyPrefix?: string    // Redis key prefix
}
```

**Applied Endpoints**:
| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| POST /api/auth/login | 60s | 5 |

**Response Headers** (when rate limited):
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

**Fail-open Behavior**: If Redis is unavailable, request is allowed (availability over consistency).

### Password Security

- Hash algorithm: bcrypt (cost factor 12)
- Plaintext passwords are never stored
- Password hashes are never returned in API responses
- Passwords are never logged

---

## 5. Input Validation

### Schema Location

All Zod schemas for API request bodies are defined inline in route files. Frontend validation schemas are in `src/lib/schemas.ts`.

### Common Patterns

**Query Parameter Validation**:
```typescript
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['field1', 'field2']).default('field1'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})
```

**Body Validation**:
```typescript
const createSchema = z.object({
  field: z.string().min(1).max(255),
  requiredField: z.number().int().positive(),
  optionalField: z.string().optional(),
})
```

**Bulk ID Validation**:
```typescript
const { ids } = z.object({ ids: z.array(z.string()).min(1) }).parse(body)
```

### Validation Error Format

```json
{
  "message": "Validasi gagal",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "nan",
      "path": ["field"],
      "message": "Expected string, received nan"
    }
  ]
}
```

---

## 6. API Contract

### Standard Response Shape

**Success Response**:
```json
{
  "data": <T>,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "summary": {} // Optional, varies by endpoint
}
```

**Error Response**:
```json
{
  "message": "Error description",
  "errors": [] // Optional, for validation errors
}
```

### Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid session) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## 7. API Routes Reference

### Auth Endpoints

#### `POST /api/auth/login`

See [Authentication & Session](#2-authentication--session) for full details.

#### `POST /api/auth/logout`

See [Authentication & Session](#2-authentication--session) for full details.

#### `GET /api/auth/me`

See [Authentication & Session](#2-authentication--session) for full details.

---

### Items API

#### `GET /api/items`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page (max 100) |
| search | string | No | - | Search by code or name (case-insensitive) |
| isActive | boolean | No | - | Filter by active status |
| sortBy | string | No | createdAt | Sort field: code, name, unit, currentStock, minStock, createdAt |
| sortOrder | string | No | desc | asc or desc |

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "code": "SP-001",
      "name": "Component A",
      "unit": "PCS",
      "minStock": 10,
      "currentStock": 50,
      "description": "Main component",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

#### `POST /api/items`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  code: string (required, max 50 chars)
  name: string (required, max 255 chars)
  unit: string (required, max 50 chars)
  minStock: number (optional, default 0, >= 0)
  currentStock: number (optional, default 0, >= 0)
  description: string (optional)
}
```

**Response** (201):
```json
{
  "data": {
    "id": "cuid-string",
    "code": "SP-001",
    "name": "Component A",
    "unit": "PCS",
    "minStock": 10,
    "currentStock": 50,
    "description": "Main component",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Business Logic**:
- If `currentStock > 0` on creation, a STOCK_IN transaction is automatically created
- Duplicate `code` returns 400

---

#### `PUT /api/items/:id`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  code?: string (optional, max 50 chars)
  name?: string (optional, max 255 chars)
  unit?: string (optional, max 50 chars)
  minStock?: number (optional, >= 0)
  description?: string (optional)
  isActive?: boolean (optional)
}
```

**Response** (200):
```json
{
  "data": { /* updated item */ }
}
```

**Notes**:
- `currentStock` is intentionally NOT accepted via this endpoint
- Stock changes must go through STOCK_IN, STOCK_OUT, ADJUSTMENT, or OPNAME RECONCILIATION
- Duplicate `code` check excludes the current item

---

#### `DELETE /api/items/:id`

**Authorization**: ADMIN only

**CSRF**: Required

**Response** (200):
```json
{
  "data": { /* updated item with isActive: false */ }
}
```

**Note**: This is a **SOFT DELETE** — sets `isActive` to `false`. Does NOT cascade delete related transactions or opnames.

---

---

#### `DELETE /api/items` (Bulk Delete)

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  ids: string[] (required, at least 1)
}
```

**Response** (200):
```json
{
  "data": { "deletedCount": 2 }
}
```

**Note**: This is a **HARD DELETE** with cascade — deletes items, their stock transactions, and opnames permanently. Use with caution.

---

#### `GET /api/items/export`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| ids | string | No | - | Comma-separated item IDs (if provided, ignores search/isActive) |
| search | string | No | - | Search by code or name |
| isActive | boolean | No | - | Filter by active status |
| sortBy | string | No | createdAt | Sort field |
| sortOrder | string | No | desc | asc or desc |

**Response** (200):
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="items-export-YYYY-MM-DD.csv"`

**CSV Columns**:
```
Kode,Nama,Satuan,Stok Saat Ini,Stok Minimum,Deskripsi,Status,Dibuat Pada,Diperbarui Pada
```

---

### Stock In API

#### `GET /api/stock-in`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Per page (max 100) |
| itemId | string | No | - | Filter by item ID |
| startDate | string | No | - | ISO datetime filter (gte) |
| endDate | string | No | - | ISO datetime filter (lte) |
| sortBy | string | No | transactionDate | transactionDate, quantity, createdAt |
| sortOrder | string | No | desc | asc or desc |

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "itemId": "cuid-string",
      "type": "STOCK_IN",
      "quantity": 100,
      "reference": "PO-2024-001",
      "notes": "Regular restock",
      "transactionDate": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "item": {
        "id": "cuid-string",
        "code": "SP-001",
        "name": "Component A",
        "unit": "PCS"
      },
      "createdBy": {
        "id": "cuid-string",
        "username": "admin",
        "fullName": "Admin User"
      }
    }
  ],
  "pagination": { ... }
}
```

---

#### `POST /api/stock-in`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  itemId: string (required, valid CUID)
  quantity: number (required, positive integer)
  reference?: string (optional, max 100 chars)
  notes?: string (optional)
  transactionDate?: string (optional, ISO datetime)
}
```

**Response** (201):
```json
{
  "data": { /* created transaction with item relation */ }
}
```

**Business Logic** (Atomic Transaction):
1. Verify item exists and is active
2. Create StockTransaction record
3. Update item.currentStock with optimistic locking:
   ```sql
   UPDATE items SET currentStock = currentStock + :quantity
   WHERE id = :itemId AND currentStock = :expectedStock
   ```
4. If update count != 1 → throw StockConcurrencyError (400)
5. Create audit log

---

### Stock Out API

#### `GET /api/stock-out`

**Authorization**: Authenticated (all roles)

**Query Parameters**: Same as Stock In API.

**Response**: Same structure as Stock In, filtered by `type: 'STOCK_OUT'`.

---

#### `POST /api/stock-out`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**: Same as Stock In.

**Response** (201):
```json
{
  "data": { /* created transaction with item relation */ }
}
```

**Business Logic** (Atomic Transaction):
1. Verify item exists and is active
2. Pre-check: `currentStock >= quantity` (non-atomic, informational)
3. Create StockTransaction record
4. Update item.currentStock with optimistic locking:
   ```sql
   UPDATE items SET currentStock = currentStock - :quantity
   WHERE id = :itemId AND currentStock >= :quantity
   ```
5. If update count != 1 → throw StockUnavailableError (400) or StockConcurrencyError (400)
6. Create audit log

---

### Stock Adjustment API

#### `GET /api/stock-adjustment`

**Authorization**: Authenticated (all roles)

**Query Parameters**: Same as Stock In API.

**Response**: Same structure, filtered by `type: 'ADJUSTMENT'`.

---

#### `POST /api/stock-adjustment`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  itemId: string (required, valid CUID)
  quantity: number (required, non-zero integer, can be negative)
  reference?: string (optional, max 100 chars)
  notes: string (required, min 1 char)
  transactionDate?: string (optional, ISO datetime)
}
```

**Response** (201):
```json
{
  "data": { /* created transaction */ }
}
```

**Business Logic**:
- Positive quantity increases stock
- Negative quantity decreases stock
- For negative adjustments: `currentStock >= abs(quantity)` check
- Transaction stores signed value directly (not absolute value)
- Audit log includes `adjustmentDirection: 'INCREASE' | 'DECREASE'`

---

### Stock Opname API

#### `GET /api/opname`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Per page |
| search | string | No | - | Search by item code/name or notes |
| status | string | No | - | PENDING, RECONCILED, CANCELLED |
| startDate | string | No | - | ISO datetime filter (gte) |
| endDate | string | No | - | ISO datetime filter (lte) |

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "itemId": "cuid-string",
      "systemStock": 50,
      "physicalStock": 48,
      "difference": -2,
      "notes": "Broken items",
      "status": "PENDING",
      "opnameDate": "2024-01-15T10:00:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "item": {
        "id": "cuid-string",
        "code": "SP-001",
        "name": "Component A",
        "unit": "PCS",
        "currentStock": 50
      },
      "createdBy": {
        "id": "cuid-string",
        "username": "admin",
        "fullName": "Admin User"
      },
      "reconciliation": null
    }
  ],
  "pagination": { ... }
}
```

---

#### `POST /api/opname`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  itemId: string (required)
  physicalStock: number (required, >= 0)
  notes?: string (optional)
  opnameDate: string (required, ISO datetime)
}
```

**Response** (201):
```json
{
  "data": { /* created opname with item and createdBy relations */ }
}
```

**Business Logic**:
1. Validate item exists and is active
2. Check no PENDING opname exists for same item
3. Calculate: `systemStock = item.currentStock`, `difference = physicalStock - systemStock`
4. Create opname with status `PENDING`
5. Create audit log

---

#### `PUT /api/opname/:id`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Request Body**:
```typescript
{
  physicalStock?: number (optional, >= 0)
  notes?: string (optional)
}
```

**Response** (200):
```json
{
  "data": { /* updated opname */ }
}
```

**Validation**: Only PENDING opnames can be updated.

---

#### `DELETE /api/opname/:id`

**Authorization**: ADMIN, WAREHOUSE_STAFF

**CSRF**: Required

**Response** (200):
```json
{
  "data": { /* updated opname with status: CANCELLED */ }
}
```

**Note**: CANCELS the pending opname (sets status to CANCELLED). Only PENDING opnames can be cancelled. This is a soft delete, not a hard deletion.

---

#### `POST /api/opname/:id/reconcile`

**Authorization**: ADMIN only

**CSRF**: Required

**Request Body**:
```typescript
{
  notes?: string (optional)
}
```

**Response** (200):
```json
{
  "data": { /* updated opname with RECONCILED status */ }
}
```

**Business Logic** (Atomic Transaction):
1. Verify opname exists and is PENDING
2. **Snapshot consistency check**: Verify item.currentStock still equals systemStock (optimistic locking)
   - If stock changed since opname created → throw `StaleOpnameError` (400)
3. Update item.currentStock to physicalStock
4. Update opname status to RECONCILED
5. Create StockReconciliation record
6. If difference != 0, create ADJUSTMENT transaction automatically with signed `difference` value (positive = increase, negative = decrease)
7. Create audit logs: ADJUST (item stock change) + RECONCILE (opname status change)

**Important**: Reconciliation fails if stock changed since opname was created (stale data protection).

---

### Dashboard API

#### `GET /api/dashboard/stats`

**Authorization**: Authenticated (all roles)

**Response** (200):
```json
{
  "data": {
    "totalItems": 150,
    "lowStockItems": 12,
    "outOfStockItems": 3,
    "recentStockIn": 45,
    "recentStockOut": 30,
    "pendingOpnames": 2
  }
}
```

**Metrics**:
- `totalItems`: Active items count
- `lowStockItems`: Items where `0 < currentStock <= minStock`
- `outOfStockItems`: Items where `currentStock <= 0`
- `recentStockIn`: STOCK_IN count in last 7 days
- `recentStockOut`: STOCK_OUT count in last 7 days
- `pendingOpnames`: Opnames with status PENDING

---

#### `GET /api/dashboard/low-stock-items`

**Authorization**: Authenticated (all roles)

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "code": "SP-001",
      "name": "Component A",
      "currentStock": 5,
      "minStock": 10,
      "unit": "PCS"
    }
  ]
}
```

Returns top 5 low stock items sorted by currentStock ASC.

---

#### `GET /api/dashboard/recent-transactions`

**Authorization**: Authenticated (all roles)

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "type": "STOCK_IN",
      "quantity": 100,
      "transactionDate": "2024-01-15T10:00:00Z",
      "item": {
        "name": "Component A",
        "code": "SP-001"
      }
    }
  ]
}
```

Returns most recent 5 transactions across all types.

---

### Reports API

#### `GET /api/reports/stock`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Per page |
| search | string | No | - | Search by code or name |
| lowStockOnly | boolean | No | false | Show only low/out of stock items |
| isActive | boolean | No | true | Filter by active status |

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "code": "SP-001",
      "name": "Component A",
      "unit": "PCS",
      "currentStock": 5,
      "minStock": 10,
      "description": "...",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "...",
      "stockStatus": "LOW_STOCK",
      "stockPercentage": 50
    }
  ],
  "pagination": { ... },
  "summary": {
    "totalItems": 150,
    "lowStockCount": 12,
    "outOfStockCount": 3,
    "normalCount": 135
  }
}
```

**stockStatus Values**: `NORMAL`, `LOW_STOCK`, `OUT_OF_STOCK`

---

#### `GET /api/reports/stock/export`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| ids | string | No | - | Comma-separated item IDs |
| search | string | No | - | Search by code or name |
| lowStockOnly | boolean | No | false | Show only low/out of stock items |
| isActive | boolean | No | - | Filter by active status |
| sortBy | string | No | name | Sort field |
| sortOrder | string | No | asc | asc or desc |

**Response** (200):
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="stock-report-export-YYYY-MM-DD.csv"`

---

#### `GET /api/reports/low-stock`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Per page |
| search | string | No | - | Search by code or name |
| includeZeroStock | boolean | No | false | Include out-of-stock items |

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "code": "SP-001",
      "name": "Component A",
      "unit": "PCS",
      "currentStock": 5,
      "minStock": 10,
      "stockStatus": "LOW_STOCK",
      "shortage": 5,
      "stockPercentage": 50
    }
  ],
  "pagination": { ... },
  "summary": {
    "totalLowStock": 10,
    "totalOutOfStock": 3,
    "totalItems": 13
  }
}
```

---

#### `GET /api/reports/low-stock/export`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| ids | string | No | - | Comma-separated item IDs |
| search | string | No | - | Search by code or name |
| includeZeroStock | boolean | No | false | Include out-of-stock items |
| sortBy | string | No | currentStock | Sort field |
| sortOrder | string | No | asc | asc or desc |

**Response** (200):
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="low-stock-report-export-YYYY-MM-DD.csv"`

---

#### `GET /api/reports/mutation`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Per page |
| search | string | No | - | Search by item code/name, reference, or notes |
| type | string | No | - | Filter by transaction type |
| startDate | string | No | - | ISO datetime filter (gte) |
| endDate | string | No | - | ISO datetime filter (lte) |
| itemId | string | No | - | Filter by item ID |

**Response** (200):
```json
{
  "data": [
    {
      "id": "cuid-string",
      "itemId": "cuid-string",
      "type": "STOCK_IN",
      "quantity": 100,
      "reference": "PO-2024-001",
      "notes": "...",
      "transactionDate": "...",
      "item": { "id": "...", "code": "...", "name": "...", "unit": "..." },
      "createdBy": { "id": "...", "username": "...", "fullName": "..." }
    }
  ],
  "pagination": { ... },
  "summary": {
    "STOCK_IN": { "totalQuantity": 500, "transactionCount": 5 },
    "STOCK_OUT": { "totalQuantity": 300, "transactionCount": 3 },
    "ADJUSTMENT": { "totalQuantity": 10, "transactionCount": 1 }
  }
}
```

---

#### `GET /api/reports/mutation/export`

**Authorization**: Authenticated (all roles)

**Query Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| ids | string | No | - | Comma-separated transaction IDs |
| search | string | No | - | Search by item code/name, reference, or notes |
| type | string | No | - | Filter by transaction type |
| startDate | string | No | - | ISO datetime filter (gte) |
| endDate | string | No | - | ISO datetime filter (lte) |
| itemId | string | No | - | Filter by item ID |
| sortBy | string | No | transactionDate | Sort field |
| sortOrder | string | No | desc | asc or desc |

**Response** (200):
- Content-Type: `text/csv; charset=utf-8`
- Content-Disposition: `attachment; filename="mutation-report-export-YYYY-MM-DD.csv"`

---

### 7.2. Pola Route dengan Parameter

Untuk endpoint dengan parameter path (seperti `[id]`), Next.js App Router menggunakan objek `params` yang di-*await*. Pola yang digunakan dalam project ini adalah inline type:

```typescript
// src/app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```

Alternatif dengan interface (jika preferensi tim):

```typescript
interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  // ...
}
```

Untuk endpoint nested (seperti `opname/[id]/reconcile`), struktur folder sama dengan `[id]/`:

```text
src/app/api/
└── opname/
    └── [id]/
        ├── route.ts          # PUT, DELETE
        └── reconcile/
            └── route.ts      # POST
```

---

### 7.3. Best Practices Penulisan API di Next.js

Berikut adalah best practices yang harus diikuti saat menulis API route di Next.js App Router:

#### 1. Gunakan HTTP Status Code yang Benar

| Status Code | Penggunaan |
|-------------|------------|
| `200` | Success (GET, PUT, DELETE) |
| `201` | Created (POST berhasil) |
| `400` | Bad Request (validasi gagal, business logic error) |
| `401` | Unauthorized (tidak ada/invalid session) |
| `403` | Forbidden (role tidak cukup) |
| `404` | Not Found (resource tidak ditemukan) |
| `429` | Too Many Requests (rate limit exceeded) |
| `500` | Internal Server Error |

```typescript
// ✅ Good: Gunakan status code yang sesuai
return NextResponse.json(successResponse(data), { status: 201 })
return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
return NextResponse.json({ message: 'Validasi gagal' }, { status: 400 })
```

#### 2. Gunakan Zod untuk Validasi Input

Selalu validasi request body dan query parameters menggunakan Zod sebelum memproses data:

```typescript
import { z } from 'zod'

const createSchema = z.object({
  itemId: z.string().cuid(),
  quantity: z.number().int().positive(),
  reference: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createSchema.parse(body) // throws on invalid input
  // ... proceed with parsed data
}
```

#### 3. Gunakan Try-Catch untuk Error Handling

Selalu bungkus logika bisnis dalam try-catch dan gunakan `handleApiError` untuk response yang konsisten:

```typescript
import { handleApiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    // ... business logic
    return NextResponse.json(successResponse(data))
  } catch (error) {
    return handleApiError(error)
  }
}
```

#### 4. Security: Middleware, JWT, dan Auth

- Gunakan middleware untuk proteksi route global
- Verifikasi JWT di setiap route yang membutuhkan auth
- Gunakan CSRF token untuk semua mutation (POST/PUT/DELETE)
- Jangan pernah trust client-side role atau ownership

```typescript
// middleware.ts
import { getCurrentUser } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const user = await getCurrentUser(request)
  if (!user && !isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  // Inject user into headers for server components
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', user.role)
  return response
}
```

---

## 8. Data Models

### Users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| email | VARCHAR(255) | UK, NOT NULL | Unique email |
| username | VARCHAR(100) | UK, NOT NULL | Unique username |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash (cost 12) |
| full_name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM | NOT NULL, DEFAULT 'VIEWER' | ADMIN, WAREHOUSE_STAFF, VIEWER |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | DATETIME | NOT NULL, ON UPDATE NOW() | Update timestamp |
| last_login_at | DATETIME | NULLABLE | Last login tracking |

### Items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| code | VARCHAR(50) | UK, NOT NULL | Business code (e.g., SP-001) |
| name | VARCHAR(255) | NOT NULL | Item name |
| unit | VARCHAR(50) | NOT NULL | Unit of measure |
| min_stock | INT | NOT NULL, DEFAULT 0 | Minimum stock threshold |
| current_stock | INT | NOT NULL, DEFAULT 0 | Real-time quantity |
| description | TEXT | NULLABLE | Optional details |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Soft delete |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | DATETIME | NOT NULL, ON UPDATE NOW() | Update timestamp |

**Indexes**: `idx_items_code`, `idx_items_name`, `idx_items_is_active_current_min`

### Stock Transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| item_id | CHAR(25) | FK, NOT NULL | References items.id |
| type | ENUM | NOT NULL | STOCK_IN, STOCK_OUT, ADJUSTMENT |
| quantity | INT | NOT NULL, > 0 | Always stored as positive |
| reference | VARCHAR(100) | NULLABLE | PO/SO/Reference number |
| notes | TEXT | NULLABLE | Additional info |
| transaction_date | DATETIME | NOT NULL, DEFAULT NOW() | When transaction occurred |
| created_by_id | CHAR(25) | FK, NOT NULL | References users.id |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | Record creation time |

**Foreign Keys**: item_id → items.id (RESTRICT), created_by_id → users.id (RESTRICT)

**Indexes**: `idx_stock_transactions_item_id`, `idx_stock_transactions_type`, `idx_stock_transactions_date`

### Stock Opnames

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| item_id | CHAR(25) | FK, NOT NULL | References items.id |
| system_stock | INT | NOT NULL | Snapshot of current_stock at opname time |
| physical_stock | INT | NOT NULL | Actual counted quantity |
| difference | INT | NOT NULL | Computed: physical - system |
| notes | TEXT | NULLABLE | Reason for difference |
| status | ENUM | NOT NULL, DEFAULT 'PENDING' | PENDING, RECONCILED, CANCELLED |
| opname_date | DATETIME | NOT NULL, DEFAULT NOW() | When count was performed |
| created_by_id | CHAR(25) | FK, NOT NULL | References users.id |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | Record creation time |

### Stock Reconciliations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| opname_id | CHAR(25) | FK, UK, NOT NULL | One-to-one with opname |
| adjusted_by_id | CHAR(25) | FK, NOT NULL | Admin who approved |
| adjusted_at | DATETIME | NOT NULL, DEFAULT NOW() | When reconciled |
| notes | TEXT | NULLABLE | Approval notes |

**Foreign Keys**: opname_id → stock_opnames.id (CASCADE), adjusted_by_id → users.id (RESTRICT)

### Audit Logs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(25) | PK, CUID | Primary key |
| user_id | CHAR(25) | FK, NULLABLE | Null for system actions |
| action | VARCHAR(50) | NOT NULL | CREATE, UPDATE, DELETE, LOGIN, RECONCILE |
| entity | VARCHAR(50) | NOT NULL | ITEM, STOCK_TRANSACTION, StockOpname |
| entity_id | CHAR(25) | NOT NULL | Affected record ID |
| old_data | JSON | NULLABLE | Previous state |
| new_data | JSON | NULLABLE | New state |
| ip_address | VARCHAR(45) | NULLABLE | IPv4/IPv6 |
| user_agent | TEXT | NULLABLE | Browser info |
| created_at | DATETIME | NOT NULL, DEFAULT NOW() | Timestamp |

---

## 9. Error Handling

### Standard Error Format

```json
{
  "message": "Error description in Indonesian",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["field"],
      "message": "Expected string, received number"
    }
  ]
}
```

### Error Classes

| Class | Status | Message |
|-------|--------|---------|
| `StockConcurrencyError` | 400 | "Stok sudah berubah oleh proses lain. Silakan coba lagi." |
| `StockUnavailableError` | 400 | "Stok tidak mencukupi atau barang sudah tidak aktif." |

### Error Handling Flow

```typescript
// lib/api-response.ts
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return handleZodError(error)        // 400 with validation errors
  }
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.code)
  }
  // Log in dev, return generic 500
  return errorResponse('Terjadi kesalahan server', 500)
}
```

---

## 10. Pagination Convention

All list endpoints follow this pagination format:

**Query Parameters**:
- `page`: Integer >= 1 (default: 1)
- `limit`: Integer 1-100 (default: 10)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Calculation**:
```typescript
skip = (page - 1) * limit
totalPages = Math.ceil(total / limit)
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `CSRF_SECRET` | No | CSRF token secret (falls back to JWT_SECRET) |
| `REDIS_URL` | No | Redis connection string (default: redis://localhost:6379) |
| `NODE_ENV` | Yes | Environment (development/production) |
