---
name: api-nextjs-reference
description: Referensi & tutorial penulisan REST API Next.js (App Router & Pages Router): struktur route handler, dynamic params, middleware. Aktifkan saat membuat atau mempelajari pola API Next.js baru.
---

# Dokumentasi Penulisan API di Next.js (App Router & Pages Router)

Dokumentasi ini menjelaskan standar penulisan **REST API** pada framework [Next.js](https://nextjs.org/) menggunakan dua metode routing yang tersedia: **App Router** (rekomendasi versi terbaru) dan **Pages Router** (versi legacy).

---

## 1. Menggunakan App Router (Rekomendasi)

Pada App Router, API dibuat menggunakan file bernama `route.js` atau `route.ts`. Setiap metode HTTP didefinisikan sebagai fungsi yang diekspor (*named exports*).

### Struktur Folder
```text
src/app/
└── api/
    └── users/
        ├── route.ts          # Mengelola kumpulan data (GET, POST)
        └── [id]/
            └── route.ts      # Mengelola data spesifik berdasarkan ID (GET, PUT, DELETE)
```

### Contoh Kode: `src/app/api/users/route.ts`
Menangani permintaan untuk mengambil seluruh data user (`GET`) dan membuat data user baru (`POST`).

```typescript
import { NextResponse } from 'next/server';

// GET: Mengambil data users
export async function GET() {
  const users = [
    { id: 1, name: 'Budi Santoso' },
    { id: 2, name: 'Siti Aminah' }
  ];

  return NextResponse.json({ success: true, data: users }, { status: 200 });
}

// POST: Membuat user baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Nama wajib diisi' }, { status: 400 });
    }

    const newUser = { id: Date.now(), name: body.name };
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Gagal memproses data' }, { status: 500 });
  }
}
```

### Contoh Kode: `src/app/api/users/[id]/route.ts`
Menangani parameter dinamis berbasis ID untuk `GET` (detail), `PUT` (perubahan), dan `DELETE` (penghapusan).

```typescript
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Ambil detail user berdasarkan ID
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const user = { id: Number(id), name: 'Budi Santoso' }; // Contoh data dummy

  return NextResponse.json({ success: true, data: user }, { status: 200 });
}

// PUT: Perbarui data user berdasarkan ID
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  return NextResponse.json({
    success: true,
    message: `User dengan ID ${id} berhasil diperbarui`,
    data: { id, ...body }
  }, { status: 200 });
}

// DELETE: Hapus user berdasarkan ID
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  return NextResponse.json({
    success: true,
    message: `User dengan ID ${id} berhasil dihapus`
  }, { status: 200 });
}
```

---

## 2. Menggunakan Pages Router (Legacy)

Pada Pages Router, setiap file di dalam folder `pages/api/` otomatis dipetakan sebagai API endpoint. Anda menggunakan satu fungsi *default export* (handler) yang membedakan metode HTTP lewat properti `req.method`.

### Struktur Folder
```text
pages/
└── api/
    └── products/
        ├── index.ts          # Mengelola data kumpulan (GET, POST)
        └── [id].ts           # Mengelola data spesifik berdasarkan ID (GET, PUT, DELETE)
```

### Contoh Kode: `pages/api/products/index.ts`
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      const products = [{ id: 101, title: 'Laptop Pro' }];
      return res.status(200).json({ success: true, data: products });

    case 'POST':
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ success: false, error: 'Title wajib diisi' });
      }
      return res.status(201).json({ success: true, data: { id: 102, title } });

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

### Contoh Kode: `pages/api/products/[id].ts`
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { id } = query;

  switch (method) {
    case 'GET':
      return res.status(200).json({ success: true, data: { id: Number(id), title: 'Laptop Pro' } });

    case 'PUT':
      return res.status(200).json({ success: true, message: `Product ${id} diperbarui`, data: req.body });

    case 'DELETE':
      return res.status(200).json({ success: true, message: `Product ${id} dihapus` });

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}
```

---

## 3. Best Practices Penulisan API di Next.js

1. **Gunakan HTTP Status Code yang Tepat**:
   * `200 OK` untuk keberhasilan request data.
   * `201 Created` untuk sukses membuat data baru.
   * `400 Bad Request` untuk kesalahan input dari klien.
   * `401 Unauthorized` jika membutuhkan autentikasi.
   * `404 Not Found` jika resource tidak ditemukan.
   * `500 Internal Server Error` untuk kesalahan tak terduga pada server.
2. **Validasi Skema Data**: Selalu gunakan pustaka seperti [Zod](https://zod.dev/) untuk memvalidasi *body request* sebelum memprosesnya ke database.
3. **Gunakan Try-Catch**: Bungkus logika database atau proses eksternal dalam blok `try-catch` untuk menghindari aplikasi mengalami crash dan pastikan error terkelola dengan baik.
4. **Keamanan**: Lindungi endpoint sensitif menggunakan middleware, JWT, atau pustaka autentikasi terintegrasi seperti Auth.js ([NextAuth](https://next-auth.js.org/)).