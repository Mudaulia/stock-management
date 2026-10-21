---
description: Aturan inventory — atomicity, optimistic locking, soft delete, audit trail. WAJIB dibaca sebelum mengubah stock calculation, stock transaction, stock opname, reconciliation, atau current stock
alwaysApply: false
---

# Inventory Business Rules

## Purpose

Dokumen ini berisi business rules untuk inventory dan stock management.

Sebelum mengubah stock calculation atau inventory transaction, baca dokumen ini.

## Core Principle

Stock harus konsisten dengan transaction history.

Perubahan stock harus memiliki alasan bisnis yang dapat ditelusuri.

## Stock In

Konsep:

```
STOCK_IN
↓
currentStock += quantity
```

Validasi minimal:

- item valid;
- item aktif jika requirement mengharuskannya;
- quantity valid;
- quantity > 0;
- transaction memiliki user;
- transaction memiliki timestamp.

## Stock Out

Konsep:

```
STOCK_OUT
↓
currentStock -= quantity
```

Validasi minimal:

- item valid;
- item aktif jika requirement mengharuskannya;
- quantity valid;
- quantity > 0;
- stock mencukupi;
- transaction memiliki user;
- transaction memiliki timestamp.

Jika requirement melarang negative stock:

```
quantity <= currentStock
```

harus dipastikan pada server.

## Adjustment

Konsep:

```
ADJUSTMENT
↓
currentStock disesuaikan
```

Adjustment harus memiliki alasan dan dapat ditelusuri.

Jangan mengubah stock secara langsung tanpa business event jika sistem membutuhkan audit trail.

## Stock Opname

Stock opname membandingkan:

```
systemStock
vs
physicalStock
```

Selisih:

```
difference = physicalStock - systemStock
```

Pastikan formula aktual konsisten dengan requirement dan implementasi yang disepakati.

## Reconciliation

Reconciliation digunakan untuk menyesuaikan stock sistem berdasarkan hasil stock opname.

Reconciliation harus:

- memiliki user;
- memiliki timestamp;
- menyimpan hasil penyesuaian;
- dapat ditelusuri;
- tidak menghapus histori sebelumnya.

## Atomicity

Jika satu business operation melakukan beberapa database operation yang harus berhasil bersama, gunakan database transaction.

Contoh:

```
Validate
↓
Update Stock
↓
Create Transaction
↓
Create Audit Log
```

Jika salah satu bagian wajib berhasil bersama bagian lain, gunakan transaction.

## Concurrency

Perubahan stock harus mempertimbangkan concurrent requests.

Jangan mengasumsikan:

```
read stock
↓
calculate
↓
write stock
```

selalu aman ketika terdapat concurrent transaction.

Gunakan strategy yang sesuai dengan database dan ORM.

## Current Stock

Tentukan dengan jelas apakah:

```
currentStock
```

merupakan:

- authoritative state;
- cached state;
- derived state.

Keputusan tersebut harus konsisten dengan architecture dan database implementation.

## Transaction History

Transaction history tidak boleh kehilangan informasi hanya karena current stock berubah.

## Auditability

Perubahan stock penting harus dapat ditelusuri ke:

- user;
- waktu;
- action;
- item;
- quantity;
- reason/source/destination jika requirement mengharuskannya.

## Business Rule Changes

Jika business rule berubah secara signifikan, buat decision record di:

`docs/decisions/`

## Implementation Status (As-Is, 2026-10-21)

Bagian ini mendokumentasikan bagaimana setiap aturan di atas diimplementasikan aktual di repository.

### Stock In — implementasi

- Role: ADMIN/WAREHOUSE_STAFF; item wajib aktif; quantity > 0 (Zod).
- **Optimistic locking**: `tx.item.updateMany({ where: { id, isActive: true, currentStock: snapshot } , data: { currentStock: { increment } } })` — jika `count !== 1` → `StockConcurrencyError` → rollback (`src/app/api/stock-in/route.ts`).
- Transaksi + audit log di dalam `$transaction`.

### Stock Out — implementasi

- Pre-check stok di server hanya "friendly check"; jaminan atomik memakai conditional update:
  `updateMany({ where: { id, currentStock: { gte: quantity } }, data: { currentStock: { decrement } } })` — gagal → `StockUnavailableError`.
- Negative stock mustahil terjadi, termasuk pada request paralel.

### Adjustment — implementasi

- Notes **wajib** (Zod); quantity bertanda (boleh negatif, tidak boleh 0).
- Optimistic locking (`updateMany` dengan `currentStock: expectedStock`), bukan direct set tanpa pengecekan.
- Tercatat sebagai StockTransaction ADJUSTMENT + AuditLog dengan `adjustmentDirection`.

### Stock Opname — implementasi

- Snapshot `systemStock = item.currentStock` saat opname dibuat; `difference = physicalStock - systemStock`.
- Satu opname PENDING per item; status PENDING → RECONCILED/CANCELLED (DELETE = cancel, hanya PENDING).

### Reconciliation — implementasi

- **ADMIN-only**; snapshot consistency check: `updateMany({ where: { id, currentStock: opname.systemStock } })` — jika stok sudah berubah → `StaleOpnameError` (overwrite stok lama dicegah).
- Jika difference ≠ 0: buat StockTransaction ADJUSTMENT + record StockReconciliation + 2 audit log (ADJUST pada Item, RECONCILE pada StockOpname).

### Atomicity & Concurrency — implementasi

- Semua jalur mutasi stok atomik dalam `$transaction` dengan pola: validate → conditional `updateMany` → create transaction → create audit log.
- Tidak ditemukan update stok non-atomik pada audit.

### Current Stock — implementasi

- `Item.currentStock` adalah **authoritative state**; tidak pernah negatif (dijamin conditional update).

### Transaction History — implementasi

- Riwayat transaksi bersifat permanen; hapus item tunggal memakai soft delete (`isActive = false`).

> ✅ **Pelanggaran di atas telah diperbaiki (2026-10-21, INV-01 `RESOLVED`):** bulk delete items di `src/app/api/items/route.ts` kini melakukan soft delete (`isActive = false`) — `stock_transactions` dan `stock_opnames` tidak lagi dihapus, dan audit log mencatat `oldData`. Rujuk `docs/audits/2026-10-21-security-and-inventory-audit.md`.
