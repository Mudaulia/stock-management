# Project Documentation — Single Source of Truth

Dokumentasi ini melengkapi `AGENTS.md`.

`AGENTS.md` berisi aturan kerja yang selalu berlaku untuk coding agent.

Dokumen di bawah berisi pengetahuan project yang dibaca sesuai kebutuhan task.

## Documentation Map

| Document | Digunakan ketika |
|----------|-----------------|
| `product/PRD.md` | memahami requirement produk, fitur as-is, gap & roadmap |
| `product/USER_STORY.md` | memahami user story & acceptance criteria |
| `product/ERD.md` | memahami data model & relasi entitas |
| `architecture/ARCHITECTURE.md` | memahami struktur aplikasi (HLD) |
| `architecture/LOW-LEVEL-DESIGN.md` | memahami desain detail sistem (LLD/SDD) |
| `backend/API-DOCUMENTATION.md` | mengubah atau menambah API |
| `backend/dokumentasi-api-nextjs.md` | referensi pola penulisan API Next.js |
| `frontend/UI-GUIDELINES.md` | mengembangkan komponen UI & styling |
| `business/INVENTORY-RULES.md` | mengubah inventory/stock |
| `security/SECURITY.md` | mengubah auth/RBAC/security |
| `development/DEVELOPMENT.md` | setup dan development workflow |
| `development/TESTING.md` | testing dan verification |
| `operations/DATABASE-SAFETY.md` | Prisma/database/migration |
| `decisions/` | memahami keputusan arsitektur (ADR) |
| `audits/` | membaca atau menyimpan hasil audit |

## Struktur Folder

```
docs/
├── architecture/   → desain sistem (HLD & LLD)
├── audits/         → histori hasil audit
├── backend/        → spesifikasi & dokumentasi API
├── business/       → aturan bisnis (inventory)
├── decisions/      → architecture decision records
├── development/    → workflow development & testing
├── frontend/       → pedoman UI/UX & komponen
├── operations/     → operasional (database safety)
├── product/        → requirement produk (PRD, user story, ERD)
├── security/       → kebijakan keamanan
└── README.md       → peta dokumentasi (file ini)
```

Setiap dokumen ditempatkan pada folder sesuai fungsinya. Jika menambah dokumentasi baru, gunakan folder yang sesuai — jangan menaruh file di root `docs/`.

## Core Requirement Documents

Requirement utama berada di `docs/product/`:

- `docs/product/ERD.md`
- `docs/product/USER_STORY.md`
- `docs/product/PRD.md` — PRD resmi (requirement, spesifikasi, HLD/LLD summary, gap & roadmap)

Dokumen tersebut harus dibaca ketika task menyentuh business requirement atau data model.

## Important Rule

Dokumentasi adalah evidence, bukan pengganti verifikasi.

Jika dokumentasi berbeda dengan implementation aktual, lakukan audit dan dokumentasikan discrepancy.
