# Sistem Manajemen Stok Sparepart

Aplikasi manajemen persediaan sparepart berbasis web menggunakan **Next.js 14**, **Prisma ORM**, **MySQL**, dan **React** dengan **Tailwind CSS**, **Shadcn/UI**, preset  **Nova**.

## 🚀 Fitur Utama

### 1. Autentikasi & Manajemen Pengguna
- Login/Logout dengan JWT + HttpOnly cookies
- Password hashing dengan bcrypt (cost factor 12)
- Role-based Access Control (ADMIN, WAREHOUSE_STAFF, VIEWER)
- Manajemen pengguna (CRUD) - hanya ADMIN

### 2. Manajemen Data Barang (CRUD)
- Tambah, lihat, edit, hapus barang
- Validasi kode barang unik
- Pencarian & filter barang
- Stok minimum per barang

### 3. Transaksi Stok
- **Stok Masuk**: Pencatatan barang masuk dengan referensi PO
- **Stok Keluar**: Pencatatan barang keluar dengan validasi ketersediaan stok
- Otomatis update stok current pada tabel Item

### 4. Stok Opname & Rekonsiliasi
- Pencatatan stok fisik vs stok sistem
- Perhitungan selisih otomatis
- Rekonsiliasi stok dengan audit trail

### 5. Laporan
- Laporan persediaan stok real-time
- Laporan mutasi stok (masuk/keluar/penyesuaian)
- Laporan stok minimum (barang di bawah batas minimum)
- Filter berdasarkan periode

### 6. Antarmuka Responsif
- Sidebar navigation collapsible
- Mobile-friendly dengan drawer sidebar
- Component UI reusable (shadcn/ui style)
- Toast notifications

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | MySQL 8.0+ |
| ORM | Prisma 5.x |
| Auth | JWT (jose) + bcryptjs |
| Styling | Tailwind CSS + shadcn/ui components |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Date | date-fns |

## 📦 Instalasi

### Prasyarat
- Node.js 18.17+
- MySQL 8.0+
- npm/yarn/pnpm

### Setup

```bash
# Clone & install dependencies
cd stock-management
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

# Setup database
npm run db:generate
npm run db:push
# atau untuk migration
npm run db:migrate

# Seed data awal
npm run db:seed

# Development
npm run dev
```

Buka http://localhost:3000

### Akun Default (setelah seed)
| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@stockapp.com | admin123 |
| WAREHOUSE_STAFF | staff@stockapp.com | staff123 |
| VIEWER | viewer@stockapp.com | viewer123 |

## 📁 Struktur Project

```
stock-management/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/
│   │   ├── (auth)/        # Auth pages (login, register)
│   │   ├── (dashboard)/   # Protected dashboard pages
│   │   │   ├── dashboard/ # Dashboard utama
│   │   │   ├── items/     # Manajemen barang
│   │   │   ├── stock-in/  # Stok masuk
│   │   │   ├── stock-out/ # Stok keluar
│   │   │   ├── opname/    # Stok opname
│   │   │   ├── reports/   # Laporan
│   │   │   ├── users/     # Manajemen pengguna
│   │   │   └── settings/  # Pengaturan
│   │   ├── api/           # API routes
│   │   │   └── auth/      # Auth endpoints
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Redirect to dashboard
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   └── ui/            # Reusable UI components
│   ├── lib/
│   │   ├── auth.ts        # Auth utilities
│   │   ├── prisma.ts      # Prisma client singleton
│   │   └── utils.ts       # Helper functions
│   └── middleware.ts      # Auth middleware
├── .env                   # Environment variables
├── .env.example           # Example env
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🗄 Database Schema (ERD)

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    User     │       │  StockTransaction│       │    Item     │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ id (PK)          │──────►│ id (PK)     │
│ email (UK)  │       │ itemId (FK)      │       │ code (UK)   │
│ username    │       │ type (ENUM)      │       │ name        │
│ passwordHash│       │ quantity         │       │ unit        │
│ fullName    │       │ reference        │       │ minStock    │
│ role (ENUM) │       │ notes            │       │ currentStock│
│ isActive    │       │ transactionDate  │       │ description │
│ createdAt   │       │ createdById (FK) │       │ isActive    │
│ updatedAt   │       └──────────────────┘       │ createdAt   │
└─────────────┘                                  └─────────────┘
       ▲                                                ▲
       │                                                │
       │         ┌──────────────────┐                   │
       └────────►│  StockOpname     │◄──────────────────┘
                 ├──────────────────┤
                 │ id (PK)          │
                 │ itemId (FK)      │
                 │ systemStock      │
                 │ physicalStock    │
                 │ difference       │
                 │ status (ENUM)    │
                 │ opnameDate       │
                 │ createdById (FK) │
                 └────────┬─────────┘
                          │
                 ┌────────▼─────────┐
                 │StockReconciliation│
                 ├──────────────────┤
                 │ id (PK)          │
                 │ opnameId (FK,UK) │
                 │ adjustedById(FK) │
                 │ adjustedAt       │
                 │ notes            │
                 └──────────────────┘
```

## 🔐 Role Permissions

| Feature | ADMIN | WAREHOUSE_STAFF | VIEWER |
|---------|-------|-----------------|--------|
| Dashboard | ✅ | ✅ | ✅ |
| Data Barang (CRUD) | ✅ | ✅ | 👁 Read only |
| Stok Masuk | ✅ | ✅ | ❌ |
| Stok Keluar | ✅ | ✅ | ❌ |
| Stok Opname | ✅ | ✅ | 👁 Read only |
| Rekonsiliasi | ✅ | ❌ | ❌ |
| Laporan | ✅ | ✅ | ✅ |
| Manajemen User | ✅ | ❌ | ❌ |
| Pengaturan | ✅ | ❌ | ❌ |

## 📝 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (dev)
npm run db:migrate   # Create migration
npm run db:studio    # Prisma Studio
npm run db:seed      # Seed database
```

## 🔒 Keamanan

- Password di-hash dengan bcrypt (cost 12)
- JWT dengan HS256, expiry 7 hari
- HttpOnly, Secure, SameSite=Lax cookies
- Server-side role validation
- Input validation dengan Zod
- SQL injection protection via Prisma

## 📄 License

MIT License - untuk keperluan skripsi/pembelajaran.