# Documentation — Pointer & Historis

Dokumentasi project telah dimigrasikan ke **`.trae/rules/`** (project rules TRAE IDE) agar dimuat otomatis oleh AI sesuai konteks task (frontmatter: `alwaysApply` / `globs` / `description`).

`AGENTS.md` tetap berisi aturan kerja yang selalu berlaku (workspace rule).

## Peta Rules — `.trae/rules/`

| Rule | Digunakan ketika |
|------|-----------------|
| `.trae/rules/product/prd.md` | memahami requirement produk, gap & roadmap |
| `.trae/rules/product/user-story.md` | memahami user story & acceptance criteria |
| `.trae/rules/product/erd.md` | memahami data model & relasi entitas |
| `.trae/rules/architecture/architecture.md` | memahami struktur aplikasi (HLD) |
| `.trae/rules/architecture/low-level-design.md` | memahami desain detail sistem (LLD/SDD) |
| `.trae/rules/backend/api-standards.md` | mengubah atau menambah API |
| `.trae/rules/backend/api-nextjs-reference.md` | referensi pola penulisan API Next.js |
| `.trae/rules/frontend/ui-guidelines.md` | mengembangkan komponen UI & styling |
| `.trae/rules/backend/inventory-rules.md` | mengubah inventory/stock |
| `.trae/rules/backend/security.md` | mengubah auth/RBAC/security |
| `.trae/skills/dev-workflow/SKILL.md` | setup & workflow development (skill — aktifkan manual) |
| `.trae/skills/test-verification/SKILL.md` | testing & verification (skill — aktifkan manual) |
| `.trae/skills/api-nextjs-reference/SKILL.md` | referensi penulisan API Next.js (skill — aktifkan manual) |
| `.trae/skills/shadcn-ui/SKILL.md` | standar shadcn/ui + Tailwind v3 (skill — aktifkan manual) |
| `.trae/rules/database/database-safety.md` | Prisma/database/migration |

## Yang Tetap di `docs/`

Folder ini hanya menyimpan materi historis (bukan rule):

- `audits/` — laporan audit (source of truth status temuan)
- `decisions/` — architecture decision records (ADR)
- `README.md` — pointer ini

Jangan menambahkan rule/dokumentasi teknis baru di sini — tempatkan di `.trae/rules/<domain>/` sesuai fungsinya.

## Important Rule

Dokumentasi adalah evidence, bukan pengganti verifikasi.

Jika dokumentasi berbeda dengan implementation aktual, lakukan audit dan dokumentasikan discrepancy.
