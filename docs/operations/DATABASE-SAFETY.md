# Database Safety

## Purpose

Dokumen ini mengatur perubahan database dan Prisma.

Database merupakan critical state.

## General Rule

Prefer:

```
Inspect
↓
Validate
↓
Plan
↓
Apply safely
↓
Verify
```

daripada langsung melakukan perubahan.

## Forbidden Without Explicit Approval

Jangan menjalankan:

```bash
prisma migrate reset
```

Jangan menjalankan destructive database reset.

Jangan menjalankan:

```sql
DROP DATABASE
```

Jangan menghapus existing data untuk menyelesaikan error development.

## Prisma

Sebelum mengubah Prisma schema:

- baca schema;
- pahami relation;
- periksa existing database;
- periksa application usage;
- periksa migration/data impact;
- tentukan verification strategy.

## Schema Changes

Untuk schema change, dokumentasikan:

```
Why:
...

Affected tables:
...

Affected relations:
...

Existing data impact:
...

Migration:
...

Rollback consideration:
...

Verification:
...
```

## Existing Data

Jangan berasumsi database kosong.

Jika database existing digunakan, anggap data penting sampai terbukti sebaliknya.

## Transactions

Gunakan transaction ketika beberapa database operation harus berhasil sebagai satu unit.

Contoh:

```
Update Stock
+
Create Stock Transaction
+
Create Audit Log
```

Jika ketiganya harus konsisten, gunakan transaction strategy yang sesuai.

## Foreign Keys

Periksa:

- cascade;
- restrict;
- orphan records;
- delete behavior.

Jangan mengubah cascade behavior tanpa memahami impact.

## Indexes

Sebelum menambahkan atau menghapus index, pertimbangkan:

- query usage;
- uniqueness;
- performance;
- migration impact.

## Database Verification

Setelah perubahan:

- validate schema;
- generate Prisma client bila diperlukan;
- typecheck;
- test affected queries;
- verify affected business flow.

## Production

Production database harus diperlakukan lebih ketat daripada development database.

Jangan melakukan production migration/deployment tanpa approval yang sesuai.
