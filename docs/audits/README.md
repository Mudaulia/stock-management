# Audit Records

Folder ini menyimpan histori audit project.

Audit record adalah snapshot kondisi project pada waktu tertentu.

## Naming

Gunakan format:

```
YYYY-MM-DD-<purpose>.md
```

Contoh:

- `2026-09-29-initial-takeover.md`
- `2026-10-05-security-audit.md`
- `2026-10-12-inventory-audit.md`

## Initial Takeover

Audit pertama menggunakan struktur:

```
PROJECT TAKEOVER REPORT

1. Project Overview
2. Current Architecture
3. Database / Prisma Status
4. Authentication Status
5. Authorization / Role Status
6. Inventory Business Logic Status
7. API Status
8. UI Status
9. Requirement Coverage
10. ERD vs Prisma Differences
11. Known Bugs
12. Security Concerns
13. Technical Debt
14. Dependency Concerns
15. Recommended Fix Order
    P0
    ...

    P1
    ...

    P2
    ...

    P3
    ...

16. Files That Need Changes
    | File | Problem | Priority | Proposed Change |
    |------|---------|----------|-----------------|
    |      |         |          |                 |

17. Verification Plan
    ...
```

## Audit Status

Gunakan status:

- `OPEN`
- `IN PROGRESS`
- `RESOLVED`
- `WONT FIX`
- `NOT REPRODUCIBLE`
- `SUPERSEDED`

## Important Rule

Audit lama adalah evidence, bukan current truth.

Setelah perubahan besar, finding yang terdampak harus diverifikasi kembali.

Jangan menghapus audit history hanya karena masalah sudah diperbaiki.
