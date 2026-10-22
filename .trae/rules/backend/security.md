---
description: Kebijakan keamanan & RBAC — session, CSRF, rate limit, role enforcement server-side. WAJIB dibaca untuk task authentication/authorization
alwaysApply: false
---

# Security Rules

## Purpose

Dokumen ini berisi security requirements untuk Stock Management.

Bagian **Implementation Status** di akhir dokumen mendokumentasikan kondisi implementasi aktual berdasarkan hasil audit repository.

## Trust Boundary

Selalu anggap client sebagai untrusted.

```
Client input      = untrusted
Client role       = untrusted
URL parameter     = untrusted
Request body      = untrusted
Frontend state    = untrusted
```

Server adalah security boundary.

## Authentication

Authentication harus:

- memvalidasi credential;
- menggunakan password hash;
- memiliki session/token expiry;
- menggunakan secure cookie configuration;
- menangani logout;
- menolak inactive user jika requirement mengharuskannya.

Password plaintext tidak boleh disimpan.

Password/hash tidak boleh dikembalikan ke client.

## Password

Password harus menggunakan secure password hashing.

Jangan:

- log password;
- return password;
- store plaintext password;
- expose password hash ke client.

## JWT / Session

Periksa:

- expiry;
- signature verification;
- cookie security;
- invalid/expired token;
- logout behavior;
- inactive user.

Jangan mempercayai claim client tanpa verification.

## Cookie

Authentication cookie harus ditinjau untuk:

- httpOnly;
- secure pada production;
- sameSite;
- expiry/max-age;
- path.

Gunakan configuration yang sesuai dengan environment.

## Authorization

Authorization harus dilakukan di server.

UI visibility bukan authorization.

Contoh:

```
hidden button ≠ permission
hidden menu ≠ permission
disabled button ≠ permission
```

API harus memeriksa role/permission secara independen.

## Role

Role tidak boleh dipercaya hanya karena dikirim oleh client.

Gunakan trusted session/database source.

Jika project memiliki:

- `ADMIN`
- `WAREHOUSE_STAFF`
- `VIEWER`

permission harus mengikuti requirement aktual.

## Input Validation

Semua request input harus divalidasi di server.

Periksa:

- type;
- required field;
- format;
- range;
- enum;
- length;
- business constraints.

Jika menggunakan Zod, gunakan schema validation secara konsisten.

## IDOR / Unauthorized Resource Access

Jangan menganggap user boleh mengakses resource hanya karena mengetahui ID.

Setiap resource-sensitive endpoint harus memeriksa authorization.

## Error Handling

Jangan membocorkan:

- stack trace;
- database credentials;
- SQL details;
- internal secrets;
- password/hash;
- sensitive implementation details.

Client menerima error yang aman dan relevan.

## Secrets

Secret harus berasal dari environment/configuration yang aman.

Jangan commit:

- production password;
- JWT secret;
- private key;
- API secret;
- database password.

Saat mendokumentasikan secret:

```
<redacted>
```

## Audit Log

Audit log tidak boleh menyimpan password atau secret.

Audit log harus mencatat event penting sesuai requirement.

## Security Changes

Perubahan security yang besar harus diverifikasi dengan:

- positive case;
- negative case;
- unauthorized request;
- invalid input;
- expired session/token;
- role restriction.

## Implementation Status (As-Is, 2026-10-21)

Kondisi implementasi aktual berdasarkan audit repository:

### Authentication

- Login via `POST /api/auth/login` — email + password, bcrypt hash comparison di server.
- JWT HS256 (jose), kedaluwarsa 7 hari, secret wajib ≥ 32 karakter dari environment (`JWT_SECRET`), tanpa fallback hardcoded.
- Cookie `auth-token`: httpOnly, sameSite=lax, secure pada production.
- `getCurrentUser()` selalu re-lookup user ke database dan menolak `isActive: false` — role dari database, bukan klaim JWT.
- Rate limiting login: 5 req/menit per IP via Redis (sliding window), **fail-open** jika Redis tidak tersedia.

### Authorization

- Role: ADMIN > WAREHOUSE_STAFF > VIEWER, ditegakkan per endpoint di server.
- Tulis item/transaksi: ADMIN + WAREHOUSE_STAFF; hapus item: ADMIN; rekonsiliasi: ADMIN; baca/ekspor: semua role.
- Middleware Next.js memverifikasi JWT untuk semua halaman dashboard.

### Input Validation

- Isomorphic validation: skema Zod yang sama (`src/lib/schemas.ts`) dipakai client dan server; semua input divalidasi ulang di server.

### Temuan Audit (rujukan: `docs/audits/2026-10-21-security-and-inventory-audit.md`)

| ID | Temuan | Status | Keterangan |
|---|---|---|---|
| SEC-01 | `requireAuth()` diabaikan di 3 endpoint dashboard | `RESOLVED` (2026-10-21) | Endpoint kini return 401 jika sesi tidak valid |
| SEC-02 | `z.coerce.boolean()` di endpoint export | `RESOLVED` (2026-10-21) | Parse eksplisit `val === 'true'` |
| SEC-03 | Middleware redirect HTML untuk API tanpa token | `RESOLVED` (2026-10-21) | Path `/api` kini mendapat 401 JSON |
| SEC-04 | Referensi `/register` yang tidak ada | `RESOLVED` (2026-10-21) | Matcher & link login dibersihkan |
| SEC-05 | Rate limiter fail-open saat Redis down | `RESOLVED` (2026-10-22) | `src/lib/rate-limiter.ts` kini pakai fallback in-memory sliding-window (per-instance) saat Redis down, bukan fail-open |
| TD-01 | Beberapa `where: any` (type safety) | `OPEN` | Cleanup bertahap |
| TD-02 | Efektivitas CSRF lemah (frontend tak kirim token header) | `RESOLVED` (2026-10-22) | Frontend kini kirim token via header `x-csrf-token` (`src/lib/csrf-client.ts`); token segar diambil dari response login/403 |

Status temuan dikelola di `docs/audits/` — dokumen ini hanya merangkum; audit record adalah source of truth status.
