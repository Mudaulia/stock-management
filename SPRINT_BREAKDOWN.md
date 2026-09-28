# Task Breakdown per Sprint - Sistem Manajemen Stok Sparepart

## Overview
- **Total Sprint**: 6 Sprint (2 minggu per sprint = 12 minggu)
- **Team**: 2-3 Developer
- **Tech Stack**: Next.js 14, Prisma, MySQL, Tailwind CSS, TypeScript

---

## Sprint 1: Foundation & Authentication (Minggu 1-2)
**Goal**: Setup project, database, authentication system, dan basic layout

### Backend Tasks
- [ ] **BE-01**: Setup Next.js 14 project dengan TypeScript, ESLint, Prettier
- [ ] **BE-02**: Konfigurasi Prisma schema (User, Item, StockTransaction, StockOpname, StockReconciliation, AuditLog)
- [ ] **BE-03**: Setup MySQL database connection & environment variables
- [ ] **BE-04**: Implementasi password hashing dengan bcrypt (cost factor 12)
- [ ] **BE-05**: Implementasi JWT authentication (jose library) dengan HttpOnly cookies
- [ ] **BE-06**: Buat API `/api/auth/login` - validasi kredensial, create session
- [ ] **BE-07**: Buat API `/api/auth/logout` - clear session
- [ ] **BE-08**: Implementasi middleware auth untuk proteksi route
- [ ] **BE-09**: Role-based access control (ADMIN, WAREHOUSE_STAFF, VIEWER)
- [ ] **BE-10**: Seed data: 3 user (admin, staff, viewer) + 10 sample items

### Frontend Tasks
- [ ] **FE-01**: Setup Tailwind CSS + shadcn/ui component library
- [ ] **FE-02**: Buat layout utama: Sidebar collapsible, Header, Mobile drawer
- [ ] **FE-03**: Buat halaman Login dengan validasi form (React Hook Form + Zod)
- [ ] **FE-04**: Integrasi login dengan API, redirect ke dashboard
- [ ] **FE-05**: Buat komponen UI reusable: Button, Input, Label, Card, Alert, Table
- [ ] **FE-06**: Implementasi logout functionality
- [ ] **FE-07**: Protected route wrapper untuk dashboard pages

### Testing & Docs
- [ ] **TEST-01**: Test login/logout flow dengan 3 role berbeda
- [ ] **TEST-02**: Test middleware redirect unauthenticated user
- [ ] **TEST-03**: Test role-based navigation visibility
- [ ] **DOC-01**: Update README dengan setup instructions

**Definition of Done**: User bisa login/logout, role-based navigation works, database seeded

---

## Sprint 2: Manajemen Data Barang (CRUD) (Minggu 3-4)
**Goal**: Complete CRUD untuk master data barang

### Backend Tasks
- [ ] **BE-11**: API `GET /api/items` - list dengan pagination, search, filter
- [ ] **BE-12**: API `POST /api/items` - create item dengan validasi unique code
- [ ] **BE-13**: API `GET /api/items/[id]` - get single item
- [ ] **BE-14**: API `PUT /api/items/[id]` - update item
- [ ] **BE-15**: API `DELETE /api/items/[id]` - soft delete (isActive = false)
- [ ] **BE-16**: Validasi Zod schema untuk Item (code, name, unit, minStock required)
- [ ] **BE-17**: Audit log untuk create/update/delete item

### Frontend Tasks
- [ ] **FE-08**: Halaman List Barang - Table dengan sorting, pagination
- [ ] **FE-09**: Search & Filter: by name, code, unit, status (active/inactive)
- [ ] **FE-10**: Modal/Tambah Form Barang dengan validasi client-side
- [ ] **FE-11**: Modal/Edit Form Barang - prefill data existing
- [ ] **FE-12**: Konfirmasi hapus dengan dialog
- [ ] **FE-13**: Toast notification untuk success/error
- [ ] **FE-14**: Loading states & empty states
- [ ] **FE-15**: Responsive table (horizontal scroll di mobile)

### Testing & Docs
- [ ] **TEST-04**: Test CRUD barang lengkap
- [ ] **TEST-05**: Test validasi unique code
- [ ] **TEST-06**: Test pagination & search
- [ ] **TEST-07**: Test role VIEWER read-only access

**Definition of Done**: CRUD barang fully functional dengan validasi & audit trail

---

## Sprint 3: Transaksi Stok Masuk & Keluar (Minggu 5-6)
**Goal**: Stok masuk/keluar dengan validasi bisnis & auto-update stok

### Backend Tasks
- [ ] **BE-18**: API `GET /api/stock-in` - list transaksi masuk dengan filter tanggal
- [ ] **BE-19**: API `POST /api/stock-in` - create stock in, **auto increment item.currentStock**
- [ ] **BE-20**: API `GET /api/stock-out` - list transaksi keluar dengan filter tanggal
- [ ] **BE-21**: API `POST /api/stock-out` - create stock out, **validasi stok cukup**, auto decrement
- [ ] **BE-22**: Transaksi database (Prisma transaction) untuk konsistensi stok
- [ ] **BE-23**: Validasi: qty > 0, item exists & active, stok cukup untuk keluar
- [ ] **BE-24**: Audit log untuk setiap transaksi stok

### Frontend Tasks
- [ ] **FE-16**: Halaman Stok Masuk - List + Form tambah
- [ ] **FE-17**: Form Stok Masuk: pilih barang (searchable select), qty, tanggal, referensi, catatan
- [ ] **FE-18**: Halaman Stok Keluar - List + Form tambah
- [ ] **FE-19**: Form Stok Keluar: validasi real-time stok tersedia
- [ ] **FE-20**: Badge status stok di tabel (tersedia/habis)
- [ ] **FE-21**: Filter transaksi by periode (minggu/bulan/custom)
- [ ] **FE-22**: Print/Export transaksi (optional)

### Testing & Docs
- [ ] **TEST-08**: Test stok masuk update currentStock
- [ ] **TEST-09**: Test stok keluar validasi stok tidak cukup
- [ ] **TEST-10**: Test concurrent transaksi (race condition)
- [ ] **TEST-11**: Test filter by date range

**Definition of Done**: Transaksi stok masuk/keluar berjalan, stok otomatis update, validasi bisnis works

---

## Sprint 4: Stok Opname & Rekonsiliasi (Minggu 7-8)
**Goal**: Physical count & reconciliation workflow

### Backend Tasks
- [ ] **BE-25**: API `GET /api/opname` - list opname dengan filter status
- [ ] **BE-26**: API `POST /api/opname` - create opname, capture systemStock snapshot
- [ ] **BE-27**: API `PUT /api/opname/[id]` - update physicalStock, hitung difference
- [ ] **BE-28**: API `POST /api/opname/[id]/reconcile` - **ADMIN only**, confirm adjustment
- [ ] **BE-29**: Rekonsiliasi: update item.currentStock = physicalStock, create StockReconciliation record
- [ ] **BE-30**: Status flow: PENDING → RECONCILED / CANCELLED
- [ ] **BE-31**: Audit log untuk opname & rekonsiliasi

### Frontend Tasks
- [ ] **FE-23**: Halaman Stok Opname - List dengan status badge
- [ ] **FE-24**: Form Buat Opname: pilih barang, tampilkan stok sistem (read-only), input stok fisik
- [ ] **FE-25**: Auto-hitung selisih (fisik - sistem) real-time
- [ ] **FE-26**: Detail Opname: tampilkan selisih, catatan, action buttons
- [ ] **FE-27**: Rekonsiliasi Modal (ADMIN): konfirmasi penyesuaian, catatan wajib
- [ ] **FE-28**: History rekonsiliasi per barang
- [ ] **FE-29**: Filter opname by status, date range

### Testing & Docs
- [ ] **TEST-12**: Test opname flow: create → edit fisik → reconcile
- [ ] **TEST-13**: Test stok update setelah rekonsiliasi
- [ ] **TEST-14**: Test VIEWER/STAFF tidak bisa reconcile
- [ ] **TEST-15**: Test cancel opname

**Definition of Done**: Opname & rekonsiliasi workflow complete dengan audit trail

---

## Sprint 5: Laporan & Dashboard (Minggu 9-10)
**Goal**: Comprehensive reporting & real-time dashboard

### Backend Tasks
- [ ] **BE-32**: API `GET /api/reports/stock` - laporan persediaan (current stock, min stock, status)
- [ ] **BE-33**: API `GET /api/reports/mutation` - laporan mutasi dengan filter periode & tipe
- [ ] **BE-34**: API `GET /api/reports/low-stock` - barang di bawah/minimum stok
- [ ] **BE-35**: API `GET /api/reports/summary` - summary cards untuk dashboard
- [ ] **BE-36**: Optimasi query dengan Prisma select/include yang efisien
- [ ] **BE-37**: Real-time data: revalidatePath setelah transaksi

### Frontend Tasks
- [ ] **FE-30**: Dashboard: Stat cards (total items, low stock, in/out 7 hari, pending opname)
- [ ] **FE-31**: Dashboard: Tabel transaksi terbaru (5 terakhir)
- [ ] **FE-32**: Halaman Laporan Stok - Table dengan status badge (Normal/Minimum/Habis)
- [ ] **FE-33**: Halaman Laporan Mutasi - Filter periode, tipe, barang; tabel detail
- [ ] **FE-34**: Halaman Laporan Stok Minimum - Highlight barang critical
- [ ] **FE-35**: Export laporan ke CSV/Excel (optional: papaparse)
- [ ] **FE-36**: Date range picker component reusable
- [ ] **FE-37**: Loading skeleton untuk laporan

### Testing & Docs
- [ ] **TEST-16**: Test laporan stok real-time setelah transaksi
- [ ] **TEST-17**: Test filter periode laporan mutasi
- [ ] **TEST-18**: Test low stock detection accuracy
- [ ] **TEST-19**: Test export CSV format

**Definition of Done**: Semua laporan functional, real-time update, export works

---

## Sprint 6: Manajemen User, Settings & Polish (Minggu 11-12)
**Goal**: User management, settings, UI polish, production ready

### Backend Tasks
- [ ] **BE-38**: API `GET /api/users` - list users (ADMIN only)
- [ ] **BE-39**: API `POST /api/users` - create user dengan hash password
- [ ] **BE-40**: API `PUT /api/users/[id]` - update user (role, active status, fullName)
- [ ] **BE-41**: API `DELETE /api/users/[id]` - deactivate user (soft delete)
- [ ] **BE-42**: API `PUT /api/users/[id]/password` - reset password (ADMIN)
- [ ] **BE-43**: API `GET /api/settings` / `PUT /api/settings` - app settings
- [ ] **BE-44**: Rate limiting untuk auth endpoints
- [ ] **BE-45**: Input sanitization & XSS protection

### Frontend Tasks
- [ ] **FE-38**: Halaman Manajemen User (ADMIN) - Table CRUD
- [ ] **FE-39**: Modal Tambah/Edit User: email, username, fullName, role, password
- [ ] **FE-40**: Toggle active/inactive user
- [ ] **FE-41**: Reset password modal
- [ ] **FE-42**: Halaman Pengaturan: app name, items per page, default min stock
- [ ] **FE-43**: Profile dropdown: ganti password, logout
- [ ] **FE-44**: Global loading states, error boundaries
- [ ] **FE-45**: Responsive polish: mobile table, touch targets
- [ ] **FE-46**: Dark mode support (optional)
- [ ] **FE-47**: Keyboard navigation & accessibility (ARIA labels)

### Testing & Docs
- [ ] **TEST-20**: Test user management CRUD
- [ ] **TEST-21**: Test role assignment & permission enforcement
- [ ] **TEST-22**: E2E test critical flows (login → barang → transaksi → opname → laporan)
- [ ] **TEST-23**: Performance test: large dataset pagination
- [ ] **TEST-24**: Security test: SQL injection, XSS, auth bypass
- [ ] **DOC-02**: User manual / panduan pengguna
- [ ] **DOC-03**: API documentation (optional: Swagger)
- [ ] **DOC-04**: Deployment guide (Vercel + MySQL)

**Definition of Done**: Production-ready app dengan full user management, polished UI, documented

---

## 📊 Sprint Summary

| Sprint | Focus | Key Deliverables |
|--------|-------|------------------|
| 1 | Foundation & Auth | Project setup, DB, Login/Logout, RBAC, Layout |
| 2 | Master Data Barang | CRUD Items, Search/Filter, Audit Log |
| 3 | Transaksi Stok | Stock In/Out, Auto Stock Update, Validation |
| 4 | Stok Opname | Physical Count, Difference, Reconciliation |
| 5 | Laporan & Dashboard | Stock Report, Mutation, Low Stock, Real-time |
| 6 | User Mgmt & Polish | User CRUD, Settings, Export, Accessibility |

---

## 🎯 Milestone Checkpoints

| Milestone | Target Sprint | Criteria |
|-----------|---------------|----------|
| **M1: Auth Ready** | Sprint 1 | Login/logout works, 3 roles functional |
| **M2: Core CRUD** | Sprint 2 | Item management complete |
| **M3: Transaction Ready** | Sprint 3 | Stock in/out with validation |
| **M4: Opname Flow** | Sprint 4 | Full opname → reconcile cycle |
| **M5: Reporting Ready** | Sprint 5 | All reports functional |
| **M6: Production Ready** | Sprint 6 | Full feature complete, tested, documented |

---

## 🔧 Technical Debt & Risks

| Risk | Mitigation |
|------|------------|
| Race condition pada update stok | Prisma transaction + row-level locking |
| Large dataset performance | Indexing, pagination, selective include |
| JWT secret management | Environment variable, rotation strategy |
| Mobile UX | Test early, responsive-first design |
| Browser compatibility | Test Chrome, Firefox, Safari, Edge |

---

## 📝 Notes untuk Implementasi

1. **Linier & Bertahap**: Setiap sprint build di atas sprint sebelumnya
2. **Test-Driven**: Tulis test case sebelum implementasi fitur kompleks
3. **Component First**: Buat UI components reusable di Sprint 1
4. **API First**: Design API contract sebelum frontend consume
5. **Database First**: Prisma schema sebagai single source of truth
6. **Security by Default**: Validasi di client & server, auth di middleware