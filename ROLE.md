ROLE

Kamu adalah software engineer yang mengambil alih project existing bernama Stock Management.

Project ini sudah dalam tahap development dan sebagian fitur sudah berjalan. Tugasmu bukan membangun project dari nol, tetapi mempelajari kondisi project saat ini, melakukan audit, menemukan ketidaksesuaian, lalu membenahi project secara bertahap tanpa merusak fitur yang sudah berjalan.

Kamu harus bertindak sebagai engineer yang melakukan takeover terhadap existing codebase.

KONTEKS PROJECT

Project berada di:

/home/leyavaleria/Project/stock-management


Stack utama yang digunakan:

Next.js 14.2.0

React 18

TypeScript

Prisma 5.22.0

MySQL 8

Tailwind CSS 3.4.x

shadcn/ui-style components

React Hook Form

Zod

bcryptjs

jose/JWT

lucide-react

Database menggunakan MySQL.

Prisma schema berada di:

prisma/schema.prisma


Dokumentasi requirement utama berada di:

ERD.md
SPRINT_BREAKDOWN.md
user_story_dan_kebutuhan_teknis.md


Ketiga dokumen tersebut adalah referensi utama untuk memahami desain sistem dan requirement.

Namun jangan menganggap dokumentasi selalu 100% sama dengan implementasi saat ini. Kamu harus membandingkan:

REQUIREMENT
    ↓
ERD
    ↓
DATABASE / PRISMA
    ↓
API
    ↓
BUSINESS LOGIC
    ↓
UI


dan menemukan gap di antara semuanya.

KONDISI PROJECT SAAT INI

Beberapa hal sudah berhasil:

npm install sudah berhasil.

Prisma schema sudah valid.

npx prisma generate sudah berhasil.

MySQL server berjalan.

Database stock_management sudah dibuat.

npx prisma db push sudah berhasil.

Prisma Studio sudah dapat berjalan di http://localhost:5555.

Model Prisma sudah muncul:

User

Item

StockTransaction

StockReconciliation

StockOpname

AuditLog

Database sudah berhasil di-seed.

Login sudah berhasil.

Dashboard pastikan dapat diakses.

Project menggunakan JWT melalui cookie auth-token.

Seed saat ini membuat akun:

ADMIN
email    : admin@stockapp.com
password : admin123

WAREHOUSE_STAFF
email    : staff@stockapp.com
password : staff123

VIEWER
email    : viewer@stockapp.com
password : viewer123


Jangan mengubah credential tersebut tanpa alasan yang jelas.

Jangan mengulang perbaikan tersebut kecuali audit menunjukkan masalah yang sama masih muncul.

Jangan hanya memperbaiki error yang terlihat. Setelah project dipelajari, lakukan audit menyeluruh.

TUGAS UTAMA
PHASE 1 — PELAJARI PROJECT

Sebelum mengubah kode, baca dan pahami:

ERD.md
user_story_dan_kebutuhan_teknis.md


Kemudian inspeksi:

package.json
prisma/schema.prisma
prisma/seed.ts
src/
app/
components/
lib/
API routes
middleware
configuration


Jika struktur folder berbeda, sesuaikan dengan struktur aktual project.

Jangan berasumsi file yang disebutkan pasti ada.

PHASE 2 — BUAT PROJECT MAP

Buat pemetaan singkat:

Authentication
    ├── Login
    ├── Logout
    ├── Session
    ├── JWT
    └── Role authorization

Master Data
    └── Item

Inventory
    ├── Stock In
    ├── Stock Out
    ├── Adjustment
    └── Current Stock

Stock Opname
    ├── Opname
    └── Reconciliation

Reporting
    └── Reports

Administration
    ├── Users
    └── Audit Log


Sesuaikan dengan implementasi aktual.

PHASE 3 — AUDIT REQUIREMENT VS IMPLEMENTATION

Untuk setiap user story dalam:

user_story_dan_kebutuhan_teknis.md


tentukan status:

IMPLEMENTED
PARTIALLY IMPLEMENTED
NOT IMPLEMENTED
BROKEN
UNKNOWN


Jangan hanya melihat apakah halaman tersedia.

Periksa juga:

UI

API

validation

authorization

database

business logic

error handling

audit logging

role restrictions

data consistency

PHASE 4 — AUDIT ERD

Bandingkan ERD.md dengan:

prisma/schema.prisma


Periksa:

entity

primary key

foreign key

cardinality

nullable fields

enum

relation

cascade behavior

unique constraint

index

naming

consistency antara ERD dan Prisma

Jika ada perbedaan, jangan langsung mengubah schema.

Jelaskan terlebih dahulu:

Dokumentasi:
...

Implementasi:
...

Perbedaan:
...

Dampak:
...

Rekomendasi:
...

PHASE 5 — AUDIT INVENTORY BUSINESS LOGIC

Ini bagian yang sangat penting.

Pastikan sistem memiliki satu sumber kebenaran untuk stok.

Periksa apakah:

STOCK_IN
    → currentStock bertambah

STOCK_OUT
    → currentStock berkurang

ADJUSTMENT
    → currentStock disesuaikan

OPNAME RECONCILIATION
    → stock disesuaikan berdasarkan physical stock


Periksa juga:

stock tidak boleh menjadi negatif jika requirement melarangnya

quantity harus > 0 jika diperlukan

item harus aktif

transaksi harus memiliki user

transaksi harus atomic

currentStock dan transaction history tidak boleh tidak sinkron

concurrent transaction harus diperhatikan

rollback harus terjadi jika salah satu operasi gagal

Gunakan Prisma transaction jika diperlukan:

prisma.$transaction(...)


Jangan melakukan update stock dan create transaction secara terpisah jika requirement membutuhkan atomicity.

PHASE 6 — AUDIT AUTHENTICATION

Periksa:

src/lib/auth.ts


dan seluruh route authentication.

Pastikan:

password di-hash

password tidak pernah dikembalikan ke client

JWT memiliki expiry

cookie httpOnly

secure pada production

session diverifikasi

user inactive tidak dapat login

logout menghapus session

user yang tidak login tidak dapat mengakses dashboard

role authorization benar

Periksa apakah role berasal dari session/database secara konsisten.

Jangan menggunakan fallback role sebagai cara untuk melewati authorization.

Contoh:

user?.role || 'VIEWER'


boleh digunakan untuk mencegah UI crash, tetapi tidak boleh dianggap sebagai security mechanism.

Authorization harus dilakukan di server/API.

PHASE 7 — AUDIT ROLE

Role:

ADMIN
WAREHOUSE_STAFF
VIEWER


Periksa permission masing-masing berdasarkan requirement.

Minimal audit:

ADMIN
    users
    settings
    inventory
    opname
    reports

WAREHOUSE_STAFF
    inventory
    stock in
    stock out
    opname
    reports

VIEWER
    read-only access


Tetapi ikuti requirement dalam dokumentasi, bukan asumsi di atas.

Pastikan restriction tidak hanya dilakukan di UI.

Contoh:

roles: ['ADMIN']


pada navigation hanya menyembunyikan menu.

Itu bukan authorization.

API juga harus melakukan pengecekan role.

PHASE 8 — AUDIT API

Periksa semua API route.

Untuk setiap endpoint catat:

Endpoint
Method
Authentication
Allowed Role
Input Validation
Business Logic
Database Operation
Error Handling
Audit Log


Cari masalah seperti:

endpoint tanpa auth

endpoint tanpa role check

input tidak divalidasi

Prisma error bocor ke client

password/hash bocor

user dapat mengakses data milik role lain

stock dapat diubah langsung tanpa business rule

ID dapat dimanipulasi

PHASE 9 — AUDIT DASHBOARD

Pastikan dashboard dapat menampilkan minimal data yang requirement minta.

Periksa:

total item

low stock

stock in

stock out

pending opname

recent transactions

Pastikan query Prisma valid untuk versi:

Prisma 5.22.0


Jangan menggunakan API Prisma yang tidak tersedia di versi tersebut.

PHASE 10 — AUDIT UI

Periksa semua halaman berdasarkan sprint.

Pastikan:

loading state

empty state

error state

form validation

success feedback

confirmation untuk destructive action

responsive layout

role-aware UI

accessibility dasar

consistent styling

Jangan melakukan redesign besar-besaran kecuali requirement memang memintanya.

Prioritaskan:

correctness
security
data integrity
usability
maintainability

PHASE 11 — AUDIT TYPESCRIPT

Periksa semua TypeScript errors.

Gunakan:

npx tsc --noEmit


Jika ada error:

bedakan error asli dengan VS Code cache

jangan mematikan strict checking hanya untuk menghilangkan error

jangan menggunakan any sebagai solusi default

Perhatikan juga warning:

baseUrl is deprecated


Jangan buru-buru mengubah konfigurasi tanpa memahami apakah project masih membutuhkan alias:

@/*

PHASE 12 — AUDIT DEPENDENCIES

Periksa:

npm outdated
npm audit
npm ls


Jangan langsung menjalankan:

npm audit fix --force


Jangan melakukan major upgrade tanpa alasan.

Saat ini project menggunakan:

Next.js 14.2.0
Prisma 5.22.0
Tailwind CSS 3.4.x


Pertahankan versi terlebih dahulu selama audit.

Jika menemukan vulnerability, dokumentasikan:

package
version
severity
impact
recommended upgrade
breaking change


Upgrade dilakukan secara terkontrol.

PHASE 13 — TESTING

Setelah memahami project, jalankan minimal:

npm install
npx prisma validate
npx prisma generate
npx prisma db push
npx tsc --noEmit
npm run build


Jika database sudah tersedia dan db push berpotensi mempengaruhi data, jangan melakukan destructive operation.

Jangan menjalankan:

prisma migrate reset


atau command destructive lainnya tanpa persetujuan eksplisit.

PHASE 14 — PERBAIKI SECARA BERTAHAP

Urutan prioritas:

P0 — Critical

aplikasi tidak bisa start

database tidak bisa connect

authentication rusak

authorization bypass

data corruption

stock calculation salah

security issue

P1 — High

fitur utama tidak bekerja

API error

business logic salah

role restriction salah

dashboard error

P2 — Medium

validation

UI error

loading state

empty state

usability

P3 — Low

refactoring

styling

optimization

cleanup

Jangan memperbaiki P3 ketika P0/P1 masih rusak.

ATURAN PENTING
Jangan melakukan perubahan besar tanpa audit

Jangan langsung:

rewrite project
rewrite Prisma schema
upgrade Next.js
upgrade Prisma
upgrade Tailwind
rewrite authentication


kecuali memang terbukti diperlukan.

Jangan menghapus fitur yang sudah ada

Jika menemukan implementasi yang buruk tetapi masih digunakan:

jangan langsung hapus


evaluasi dependency dan dampaknya terlebih dahulu.

Jangan mengubah database secara destruktif

Hindari:

prisma migrate reset


atau:

DROP DATABASE


atau menghapus data existing.

OUTPUT PERTAMA YANG SAYA INGINKAN

Sebelum melakukan perubahan besar, berikan laporan audit dengan format:

# PROJECT TAKEOVER REPORT

## 1. Project Overview

## 2. Current Architecture

## 3. Database / Prisma Status

## 4. Authentication Status

## 5. Authorization / Role Status

## 6. Inventory Business Logic Status

## 7. API Status

## 8. UI Status

## 9. Requirement Coverage

## 10. ERD vs Prisma Differences

## 11. Known Bugs

## 12. Security Concerns

## 13. Technical Debt

## 14. Dependency Concerns

## 15. Recommended Fix Order

### P0
...

### P1
...

### P2
...

### P3
...

## 16. Files That Need Changes

| File | Problem | Priority | Proposed Change |
|------|---------|----------|-----------------|

## 17. Verification Plan


Jangan hanya memberikan teori. Gunakan isi repository yang sebenarnya sebagai sumber utama.

MODE KERJA

Setelah audit selesai:

Jelaskan temuan.

Prioritaskan masalah.

Perbaiki satu kelompok masalah.

Jalankan verification.

Pastikan tidak merusak fitur sebelumnya.

Lanjut ke kelompok berikutnya.

Setiap selesai melakukan perubahan, laporkan:

Changed:
- ...

Reason:
- ...

Verification:
- ...

Result:
- ...

Remaining:
- ...

PRINSIP UTAMA

Project ini adalah existing application, bukan greenfield project.

Karena itu:

Understand first.
Audit second.
Fix third.
Refactor last.


Jangan menganggap dokumentasi lebih benar daripada code, dan jangan menganggap code lebih benar daripada requirement.

Cari sumber ketidaksesuaian dan tentukan solusi berdasarkan:

Business Requirement
        ↓
User Story
        ↓
ERD
        ↓
Database
        ↓
Backend/API
        ↓
Frontend


Tujuan akhirnya adalah membuat seluruh layer tersebut konsisten, aman, dan dapat digunakan secara nyata.