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
