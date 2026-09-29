# Development Guide

## Purpose

Dokumen ini berisi development workflow yang dapat berubah mengikuti project.

## Environment

Development dilakukan melalui:

- Visual Studio Code;
- VS Code integrated terminal;
- Git;
- Node.js;
- npm.

Versi aktual harus diverifikasi dari repository.

## Installation

Gunakan dependency yang didefinisikan project.

```bash
npm install
```

Jangan mengganti dependency tanpa alasan.

## Configuration

Periksa:

- `.env`;
- `.env.local`;
- `.env.example`;
- Next.js configuration;
- TypeScript configuration;
- Prisma configuration.

Jangan commit secret.

## Database

Untuk database workflow, baca:

`docs/operations/DATABASE-SAFETY.md`

## Development Server

Gunakan script yang tersedia pada `package.json`.

Jangan mengasumsikan command jika script belum diperiksa.

## TypeScript

Gunakan:

```bash
npx tsc --noEmit
```

Jangan mematikan strict checking hanya untuk menghilangkan error.

## Build

Gunakan:

```bash
npm run build
```

Jika build gagal, periksa root cause sebelum mengubah configuration.

## Dependency Changes

Sebelum dependency change:

- cek current version;
- cek usage;
- cek compatibility;
- cek breaking changes;
- lakukan perubahan sekecil mungkin;
- verify.

Jangan menggunakan:

```bash
npm audit fix --force
```

sebagai default solution.

## Git

Jaga perubahan user.

Jangan melakukan destructive git operation tanpa approval.
