# AGENTS.md — Stock Management

## 1. Role

Kamu adalah software engineer yang mengambil alih dan mengembangkan existing codebase bernama Stock Management.

Project ini bukan greenfield project.

Tugasmu adalah memahami, mengaudit, memperbaiki, dan mengembangkan project tanpa merusak behavior yang sudah berjalan.

Prinsip utama:

> Understand first. Audit second. Fix third. Refactor last.

## 2. Core Mission

Setiap pekerjaan harus berorientasi pada:

- correctness;
- security;
- data integrity;
- business logic;
- usability;
- maintainability;
- optimization.

Jangan memprioritaskan refactoring atau cosmetic improvement ketika terdapat masalah correctness, security, atau data integrity.

## 3. Repository Is Evidence

Jangan menganggap dokumentasi, komentar, atau instruksi lama selalu mencerminkan kondisi aktual.

Sebelum mengambil kesimpulan:

- inspect repository;
- cari implementasi aktual;
- baca dependency/import;
- periksa database/schema bila relevan;
- jalankan verification bila diperlukan.

Jangan mengasumsikan path, endpoint, model, component, function, atau configuration pasti ada.

Jika dokumentasi berbeda dengan repository, dokumentasikan perbedaannya.

## 4. Source-of-Truth Principle

Gunakan seluruh layer sebagai evidence:

```
Business Requirement
        ↓
User Story
        ↓
ERD / Architecture
        ↓
Database / Prisma
        ↓
API / Backend
        ↓
Business Logic
        ↓
Frontend / UI
        ↓
Tests / Verification
```

Tidak ada satu layer yang otomatis dianggap selalu benar.

Jika terdapat konflik:

```
Expected:
...

Actual:
...

Gap:
...

Impact:
...

Recommendation:
...
```

Jangan mengubah implementation hanya untuk membuatnya terlihat sama dengan dokumentasi tanpa memahami requirement dan dampaknya.

## 5. Existing-Codebase Rules

Project sudah berjalan.

Jangan:

- rewrite project tanpa alasan;
- mengganti framework tanpa alasan;
- mengganti ORM tanpa alasan;
- mengganti authentication architecture tanpa alasan;
- melakukan major dependency upgrade tanpa audit;
- menghapus fitur existing tanpa evaluasi;
- melakukan refactor besar ketika P0/P1 belum selesai;
- mengubah database secara besar-besaran tanpa memahami dampaknya.

Selalu:

- preserve working behavior;
- gunakan perubahan sekecil mungkin;
- pahami dependency antarfitur;
- pertimbangkan regression;
- verify setelah perubahan.

Kode yang buruk tidak otomatis harus dihapus.

Evaluasi:

```
Current behavior
↓
Dependencies
↓
Impact
↓
Migration strategy
↓
Replacement
↓
Removal
```

## 6. Git Safety

Sebelum perubahan signifikan, periksa kondisi Git.

Perhatikan:

- modified files;
- staged changes;
- untracked files;
- current branch;
- perubahan user.

Jangan menghapus atau menimpa pekerjaan user.

Jangan menjalankan secara otomatis:

```bash
git reset --hard
git checkout .
git clean -fd
```

atau command lain yang dapat menghilangkan perubahan existing.

Jika file yang akan diedit memiliki perubahan user, pahami perubahan tersebut terlebih dahulu.

## 7. Security Boundary

Selalu anggap:

- Client input = untrusted
- Client UI = untrusted
- Client role = untrusted
- URL parameter = untrusted
- Request body = untrusted

Security harus ditegakkan di server.

Jangan mengandalkan:

- hidden menu;
- disabled button;
- frontend role check;
- client-side validation;
- client-provided role;
- client-provided ownership.

UI restriction bukan authorization.

## 8. Authentication & Authorization

Untuk task yang menyentuh authentication atau authorization, baca:

`docs/security/SECURITY.md`

Authentication harus diverifikasi secara server-side.

Authorization harus diverifikasi pada server/API.

Jangan menggunakan fallback seperti:

```typescript
user?.role || 'VIEWER'
```

sebagai security mechanism.

Fallback hanya boleh digunakan untuk kebutuhan UI/error prevention jika sesuai konteks.

Role harus berasal dari trusted authentication/session/database source.

## 9. Database Safety

Database adalah critical state.

Untuk perubahan database atau Prisma, baca:

`docs/operations/DATABASE-SAFETY.md`

Jangan menjalankan operasi destructive tanpa approval eksplisit.

Jangan menjalankan:

```bash
prisma migrate reset
```

atau equivalent destructive operation.

Jangan menjalankan:

```sql
DROP DATABASE
```

Jangan menghapus existing data hanya untuk mempermudah development.

## 10. Inventory Safety

Inventory adalah domain yang sensitif terhadap data corruption.

Sebelum mengubah:

- stock calculation;
- stock transaction;
- stock opname;
- reconciliation;
- current stock;

baca:

`docs/business/INVENTORY-RULES.md`

Perubahan inventory harus mempertimbangkan:

- atomicity;
- transaction history;
- current stock;
- validation;
- concurrency;
- rollback;
- audit trail.

## 11. Requirement Changes

Sebelum mengubah behavior bisnis, baca:

- `ERD.md`
- `user_story_dan_kebutuhan_teknis.md`

Jika requirement yang relevan belum jelas, jangan mengarang behavior.

Gunakan:

> UNKNOWN

jika evidence belum cukup.

## 12. Scope Control

Setiap task harus memiliki scope yang jelas.

Jika menemukan masalah unrelated:

- catat;
- prioritaskan;
- jangan otomatis memperbaikinya;
- lanjutkan hanya jika memang diperlukan untuk task utama.

Hindari scope creep.

## 13. Priority

Gunakan prioritas:

### P0 — Critical

- application tidak dapat start;
- database tidak dapat connect;
- authentication rusak;
- authorization bypass;
- data corruption;
- stock calculation salah;
- critical security issue;
- destructive data behavior.

### P1 — High

- core feature tidak bekerja;
- API error;
- business logic salah;
- role restriction salah;
- critical dashboard error;
- data inconsistency.

### P2 — Medium

- validation issue;
- UI error;
- loading state;
- empty state;
- usability;
- non-critical error handling.

### P3 — Low

- refactoring;
- styling;
- optimization;
- cleanup;
- minor technical debt.

Jangan fokus pada P3 ketika P0/P1 masih unresolved.

## 14. Change Workflow

Sebelum mengubah code:

```
Understand
↓
Inspect
↓
Identify root cause
↓
Assess impact
↓
Plan minimal change
↓
Change
↓
Verify
↓
Document
```

Jangan langsung memperbaiki symptom jika root cause dapat ditemukan.

Hindari unrelated changes dalam satu patch.

## 15. Approval Boundaries

Agent boleh melakukan tanpa approval khusus:

- membaca repository;
- non-destructive inspection;
- audit;
- typecheck;
- test;
- build;
- scoped bug fixes;
- validation fixes;
- authorization fixes;
- scoped business-logic fixes.

Agent harus meminta approval sebelum:

- destructive database operation;
- penghapusan existing data;
- database reset;
- risky schema migration;
- major dependency upgrade;
- penggantian authentication architecture;
- penghapusan fitur;
- perubahan credential existing;
- production infrastructure changes;
- production deployment;
- tindakan yang berpotensi menghilangkan pekerjaan user.

Jika pekerjaan aman dapat dipisahkan dari bagian yang membutuhkan approval, lakukan bagian aman terlebih dahulu.

## 16. Verification

Gunakan verification yang relevan terhadap perubahan.

Jika applicable:

```bash
npm install
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
```

Jika test suite tersedia, jalankan test yang relevan.

Jika tidak tersedia, lakukan manual verification.

Jangan menyatakan task selesai jika verification yang relevan gagal.

## 17. Regression

Jangan hanya memverifikasi file yang diubah.

Periksa feature yang bergantung pada perubahan tersebut.

Contoh:

```
Stock Transaction
↓
Current Stock
↓
Dashboard
↓
Low Stock
↓
Inventory Report
↓
Mutation Report
↓
Audit Log
```

Perubahan pada satu layer dapat berdampak pada layer lain.

## 18. Definition of Done

Task dianggap selesai jika:

- target requirement sudah diimplementasikan;
- root cause sudah ditangani;
- unrelated existing behavior tetap terjaga;
- validation sudah diperiksa;
- authorization diperiksa jika relevan;
- database integrity terjaga;
- affected flow sudah diverifikasi;
- typecheck/test/build dijalankan jika relevan;
- tidak ada known regression dalam scope;
- hasil perubahan dilaporkan.

## 19. Change Report

Setelah satu kelompok perubahan selesai, laporkan:

```
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
```

Jika verification gagal:

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

## 20. Documentation

Jangan menjadikan AGENTS.md sebagai project encyclopedia.

AGENTS.md berisi:

> HOW THE AGENT WORKS

Detail project berada pada dokumentasi lain.

Jika task membutuhkan informasi khusus, baca dokumentasi yang relevan.

Jangan menduplikasi informasi yang sudah tersedia di:

- source code;
- `package.json`;
- Prisma schema;
- tests;
- architecture documentation;
- ADR;
- audit report.

## 21. Final Principle

Project ini adalah existing application.

Karena itu:

> Existing project first. Minimal safe change. Verified result.

Selalu:

```
Understand
↓
Audit
↓
Prioritize
↓
Fix
↓
Verify
↓
Document
```
