# User Story & Technical Requirements

---

## Epic 1 — Manajemen Data Barang

### US-01 — Menambahkan Data Barang
> **Sebagai** admin,  
> **saya ingin** menambahkan data sparepart baru,  
> **sehingga** data sparepart dapat disimpan dan dikelola dalam sistem.

**Acceptance Criteria:**
- Admin dapat membuka form tambah barang.
- Admin dapat mengisi nama barang.
- Admin dapat mengisi kode barang.
- Admin dapat memilih atau mengisi satuan barang.
- Admin dapat mengisi stok minimum.
- Admin dapat menyimpan data barang.
- Sistem melakukan validasi terhadap data yang wajib diisi.
- Sistem menolak kode barang yang sudah digunakan.

---

### US-02 — Melihat Data Barang
> **Sebagai** admin atau pengguna yang memiliki akses,  
> **saya ingin** melihat daftar barang,  
> **sehingga** saya dapat mengetahui data sparepart yang tersedia.

**Acceptance Criteria:**
- Sistem menampilkan daftar barang.
- Sistem menampilkan nama, kode, satuan, stok, dan stok minimum.
- Pengguna dapat mencari barang berdasarkan nama atau kode.
- Pengguna dapat memfilter data jika diperlukan.

---

### US-03 — Mengubah Data Barang
> **Sebagai** admin,  
> **saya ingin** mengubah data barang,  
> **sehingga** informasi barang tetap sesuai dengan kondisi sebenarnya.

**Acceptance Criteria:**
- Admin dapat memilih barang yang akan diubah.
- Sistem menampilkan data barang yang dipilih.
- Admin dapat mengubah informasi barang.
- Sistem menyimpan perubahan data.

---

### US-04 — Menghapus Data Barang
> **Sebagai** admin,  
> **saya ingin** menghapus data barang yang tidak digunakan,  
> **sehingga** data dalam sistem tetap terorganisasi.

**Acceptance Criteria:**
- Admin dapat memilih barang yang akan dihapus.
- Sistem meminta konfirmasi sebelum menghapus.
- Sistem tidak menghapus data tanpa konfirmasi.
- Sistem memberikan notifikasi setelah proses berhasil.

---

## Epic 2 — Transaksi Stok Masuk

### US-05 — Mencatat Stok Masuk
> **Sebagai** admin atau petugas gudang,  
> **saya ingin** mencatat barang yang masuk,  
> **sehingga** jumlah stok dalam sistem bertambah sesuai dengan barang yang diterima.

**Acceptance Criteria:**
- Pengguna dapat memilih barang.
- Pengguna dapat memasukkan jumlah barang masuk.
- Pengguna dapat memasukkan tanggal transaksi.
- Pengguna dapat memasukkan sumber atau keterangan transaksi.
- Sistem menyimpan transaksi stok masuk.
- Sistem otomatis menambah jumlah stok barang.

---

## Epic 3 — Transaksi Stok Keluar

### US-06 — Mencatat Stok Keluar
> **Sebagai** admin atau petugas gudang,  
> **saya ingin** mencatat barang yang keluar,  
> **sehingga** jumlah stok dalam sistem berkurang sesuai dengan barang yang digunakan atau dijual.

**Acceptance Criteria:**
- Pengguna dapat memilih barang.
- Pengguna dapat memasukkan jumlah barang keluar.
- Pengguna dapat memasukkan tanggal transaksi.
- Pengguna dapat memasukkan tujuan atau keterangan transaksi.
- Sistem memeriksa ketersediaan stok.
- Sistem tidak mengizinkan jumlah barang keluar melebihi stok tersedia.
- Sistem otomatis mengurangi jumlah stok barang.

---

## Epic 4 — Stok Opname

### US-07 — Melakukan Stok Opname
> **Sebagai** admin atau petugas gudang,  
> **saya ingin** mencatat hasil penghitungan fisik barang,  
> **sehingga** saya dapat membandingkan stok fisik dengan stok yang tercatat dalam sistem.

**Acceptance Criteria:**
- Pengguna dapat memilih barang untuk stok opname.
- Sistem menampilkan jumlah stok berdasarkan sistem.
- Pengguna dapat memasukkan jumlah stok fisik.
- Sistem menghitung selisih antara stok sistem dan stok fisik.
- Pengguna dapat memasukkan keterangan selisih.
- Sistem menyimpan hasil stok opname.

---

### US-08 — Melakukan Rekonsiliasi Stok
> **Sebagai** admin,  
> **saya ingin** menyesuaikan stok sistem berdasarkan hasil stok opname,  
> **sehingga** jumlah stok dalam sistem sesuai dengan kondisi fisik.

**Acceptance Criteria:**
- Sistem menampilkan selisih stok.
- Admin dapat melakukan konfirmasi penyesuaian.
- Sistem mencatat perubahan stok.
- Sistem menyimpan riwayat penyesuaian.
- Sistem mencatat waktu dan pengguna yang melakukan penyesuaian.

---

## Epic 5 — Laporan Persediaan

### US-09 — Melihat Laporan Stok
> **Sebagai** admin atau pengguna yang memiliki akses,  
> **saya ingin** melihat laporan persediaan barang,  
> **sehingga** saya dapat mengetahui kondisi stok saat ini.

**Acceptance Criteria:**
- Sistem menampilkan daftar stok barang.
- Sistem menampilkan stok tersedia.
- Sistem menampilkan stok minimum.
- Sistem dapat menampilkan status stok.

---

### US-10 — Melihat Laporan Mutasi Stok
> **Sebagai** admin,  
> **saya ingin** melihat riwayat pergerakan stok,  
> **sehingga** saya dapat mengetahui perubahan stok barang.

**Acceptance Criteria:**
- Sistem menampilkan transaksi stok masuk.
- Sistem menampilkan transaksi stok keluar.
- Sistem menampilkan penyesuaian stok.
- Pengguna dapat menentukan periode laporan.
- Sistem dapat menampilkan jumlah stok masuk dan keluar.

---

### US-11 — Melihat Laporan Stok Minimum
> **Sebagai** admin atau petugas gudang,  
> **saya ingin** melihat daftar barang yang mencapai atau berada di bawah stok minimum,  
> **sehingga** saya dapat mengetahui barang yang perlu dilakukan pengadaan.

**Acceptance Criteria:**
- Sistem membandingkan stok saat ini dengan stok minimum.
- Sistem menampilkan barang dengan stok di bawah atau sama dengan stok minimum.
- Sistem menampilkan jumlah stok saat ini.
- Sistem menampilkan batas stok minimum.

---

### US-12 — Melihat Laporan Secara Real-Time
> **Sebagai** pengguna yang memiliki akses,  
> **saya ingin** melihat kondisi stok terbaru,  
> **sehingga** informasi persediaan yang saya gunakan selalu diperbarui setelah transaksi.

**Acceptance Criteria:**
- Stok berubah setelah transaksi berhasil disimpan.
- Data stok yang ditampilkan sesuai dengan transaksi terakhir.
- Sistem menampilkan informasi stok tanpa perlu melakukan pencatatan manual.

---

## Epic 6 — Manajemen Pengguna

### US-13 — Mengelola Pengguna
> **Sebagai** admin,  
> **saya ingin** menambahkan, mengubah, dan menonaktifkan pengguna,  
> **sehingga** akses terhadap sistem dapat dikelola.

**Acceptance Criteria:**
- Admin dapat menambahkan pengguna.
- Admin dapat mengubah data pengguna.
- Admin dapat menonaktifkan pengguna.
- Sistem menyimpan data pengguna.

---

### US-14 — Mengatur Hak Akses
> **Sebagai** admin,  
> **saya ingin** mengatur hak akses berdasarkan peran pengguna,  
> **sehingga** setiap pengguna hanya dapat mengakses fitur yang sesuai dengan tanggung jawabnya.

**Acceptance Criteria:**
- Sistem menyediakan *role* pengguna.
- Admin dapat menentukan *role* pengguna.
- Sistem membatasi akses berdasarkan *role*.
- Pengguna tidak dapat mengakses fitur yang tidak diizinkan.

---

## Epic 7 — Login dan Keamanan

### US-15 — Login ke Sistem
> **Sebagai** pengguna terdaftar,  
> **saya ingin** login menggunakan akun saya,  
> **sehingga** saya dapat mengakses sistem sesuai dengan hak akses saya.

**Acceptance Criteria:**
- Pengguna dapat memasukkan *username*/*email* dan *password*.
- Sistem melakukan validasi kredensial.
- Pengguna dengan kredensial benar dapat masuk ke sistem.
- Pengguna dengan kredensial salah mendapatkan pesan kesalahan.
- Sistem memberikan akses berdasarkan *role* pengguna.

---

### US-16 — Logout
> **Sebagai** pengguna,  
> **saya ingin** keluar dari sistem,  
> **sehingga** akun saya tidak dapat digunakan oleh orang lain pada perangkat yang sama.

**Acceptance Criteria:**
- Pengguna dapat melakukan *logout*.
- *Session* pengguna diakhiri.
- Pengguna diarahkan ke halaman *login*.

---

## Epic 8 — Antarmuka Pengguna

### US-17 — Menggunakan Sistem melalui Antarmuka Responsif
> **Sebagai** pengguna,  
> **saya ingin** menggunakan sistem dengan antarmuka yang mudah dipahami dan responsif,  
> **sehingga** saya dapat menjalankan pekerjaan dengan nyaman melalui *browser*.

**Acceptance Criteria:**
- Sistem dapat digunakan melalui *browser*.
- Tampilan menyesuaikan ukuran layar.
- Navigasi utama mudah ditemukan.
- *Form* memiliki label yang jelas.
- Sistem menampilkan pesan sukses atau kesalahan.
- Pengguna dapat berpindah antarfitur dengan mudah.

---

# Technical Requirements

## TR-01 — Frontend

### Teknologi
- **Framework:** Next.js dengan **App Router**.
- **Bahasa:** JavaScript/TypeScript.
- **Styling:** HTML, CSS/Tailwind CSS.

### Implementasi
- Menggunakan **Next.js (App Router)** sebagai framework dasar aplikasi.
- Membuat komponen UI yang **responsif dan interaktif** menggunakan **Client Components**.
- Menggunakan **Zod** untuk validasi skema form secara real-time di sisi client sebelum data dikirim ke server.
- Mengintegrasikan **Zod** dengan form management library seperti **React Hook Form** untuk menangani `error state` pada tampilan secara dinamis.

---

## TR-02 — Backend

### Teknologi
- **API:** Next.js API Routes atau Next.js Server Actions.
- **Validation:** Zod.

### Implementasi
- Menyediakan **API Routes** atau **Next.js Server Actions** untuk menangani:
  - Logika bisnis.
  - Manipulasi data.
- Menerapkan **Isomorphic Validation**, yaitu menggunakan skema **Zod yang sama dengan frontend** untuk memvalidasi ulang seluruh data yang masuk di sisi server sebelum dieksekusi.
- Menangani pengembalian format error **Zod (`ZodError`)** secara konsisten dari server agar dapat diterjemahkan dengan baik oleh komponen UI.

---

## TR-03 — Database & ORM

### Teknologi
- **Database:** MySQL.
- **ORM:** Prisma ORM.
- **Database Access Layer:** Prisma Client.

### Implementasi
- Menggunakan **MySQL** sebagai sistem manajemen database utama.
- Menggunakan **Prisma ORM** sebagai database access layer.
- Mengonfigurasi Prisma menggunakan pola **Singleton** untuk mencegah kebocoran connection pool di lingkungan Next.js.
- Menyusun skema relasi data yang ketat melalui `schema.prisma` untuk entitas:
  - Pengguna.
  - Barang.
  - Transaksi Stok.
  - Stok Opname.
- Memanfaatkan **Prisma Client** untuk menjamin keamanan tipe data (**type-safety**) yang mengalir ke seluruh aplikasi.

---

## TR-04 — Keamanan

### Implementasi
- Mengamankan variabel lingkungan database, khususnya `DATABASE_URL`, di sisi server dan memastikan variabel tersebut **tidak terekspos ke browser/client**.
- Melakukan **enkripsi/hashing password pengguna** menggunakan algoritma yang kuat seperti:
  - `bcrypt`
  - `argon2`
- Proses hashing password harus dilakukan di **sisi server** sebelum password disimpan melalui Prisma ke MySQL.
- Mengimplementasikan proteksi hak akses pengguna (**Authorization**) pada dua level:
  1. **Level navigasi** — menggunakan Next.js Middleware.
  2. **Level eksekusi data** — menggunakan Server Actions atau API Routes.

---

## Ringkasan Struktur Epic (Backlog High-Level)

Berikut adalah struktur *backlog* yang disederhanakan (cocok untuk skripsi, proposal, atau *Sprint Backlog* Agile/Scrum):

1. **Autentikasi & Manajemen Pengguna**
   - Login & Logout
   - Manajemen pengguna
   - Role dan hak akses

2. **Manajemen Data Barang**
   - Tambah, lihat, edit, dan hapus barang
   - Pencarian dan filter barang

3. **Manajemen Stok**
   - Stok masuk & stok keluar
   - Perhitungan & validasi ketersediaan stok

4. **Stok Opname**
   - Pencatatan stok fisik & perhitungan selisih
   - Rekonsiliasi stok & riwayat penyesuaian

5. **Laporan**
   - Laporan persediaan & mutasi stok
   - Laporan stok minimum & laporan berdasarkan periode

6. **Antarmuka Sistem**
   - Dashboard, Navigasi, Form input, Tabel data, Responsive design

7. **Technical Infrastructure**
   - Next.js, MySQL, ORM, Authentication, Authorization, API/server-side logic