# Project Documentation

Dokumentasi ini melengkapi `AGENTS.md`.

`AGENTS.md` berisi aturan kerja yang selalu berlaku untuk coding agent.

Dokumen di bawah berisi pengetahuan project yang dibaca sesuai kebutuhan task.

## Documentation Map

| Document | Digunakan ketika |
|----------|-----------------|
| `product/PRD.md` | memahami requirement produk, fitur as-is, gap & roadmap |
| `architecture/ARCHITECTURE.md` | memahami struktur aplikasi (HLD) |
| `architecture/LOW-LEVEL-DESIGN.md` | memahami desain detail sistem (LLD/SDD) |
| `business/INVENTORY-RULES.md` | mengubah inventory/stock |
| `security/SECURITY.md` | mengubah auth/RBAC/security |
| `development/DEVELOPMENT.md` | setup dan development workflow |
| `development/TESTING.md` | testing dan verification |
| `operations/DATABASE-SAFETY.md` | Prisma/database/migration |
| `decisions/` | memahami keputusan arsitektur |
| `audits/` | membaca atau menyimpan hasil audit |

## Core Requirement Documents

Requirement utama berada di `docs/product/`:

- `docs/product/ERD.md`
- `docs/product/USER_STORY.md`
- `docs/product/PRD.md` — PRD resmi (requirement, spesifikasi, HLD/LLD summary, gap & roadmap)

Dokumen tersebut harus dibaca ketika task menyentuh business requirement atau data model.

## Important Rule

Dokumentasi adalah evidence, bukan pengganti verifikasi.

Jika dokumentasi berbeda dengan implementation aktual, lakukan audit dan dokumentasikan discrepancy.
