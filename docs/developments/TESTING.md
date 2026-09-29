# Testing and Verification

## Purpose

Dokumen ini mendefinisikan verification workflow.

## Verification Principle

Task tidak dianggap selesai hanya karena code berhasil ditulis.

Harus ada evidence bahwa perubahan bekerja.

## Baseline Checks

Jika relevan:

```bash
npm install
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

Jalankan command sesuai kondisi repository.

## Database Verification

Sebelum menjalankan Prisma command, pahami apakah command tersebut:

- read-only;
- schema-changing;
- destructive;
- mempengaruhi existing data.

Jangan menggunakan database reset untuk verification normal.

## Unit / Integration Tests

Jika test suite tersedia:

- jalankan test yang relevan;
- periksa failure;
- jangan menghapus test hanya agar test pass;
- perbaiki root cause.

## Manual Verification

Jika automated test tidak tersedia, lakukan manual verification terhadap affected flow.

Contoh:

```
Login
↓
Authorization
↓
Create
↓
Read
↓
Update
↓
Delete
```

atau:

```
Stock In
↓
Current Stock
↓
Dashboard
↓
Report
```

## Regression Testing

Setiap perubahan harus mempertimbangkan affected feature.

Jangan hanya mengetes file yang diubah.

## Failed Verification

Jika verification gagal, laporkan:

```
Failure:
...

Likely cause:
...

Impact:
...

Next action:
...
```

Jangan menyatakan task selesai jika verification penting masih gagal.
