# AI Development Rules & Project Instructions

## 1. Core Architecture & Tech Stack
Proyek `stock-management` ini menggunakan arsitektur modern berbasis komponen *headless* dan utilitas CSS. Jangan pernah menginstal atau menggunakan framework UI global lain (seperti Material UI, Bootstrap, atau Flowbite).
* **Component Library Foundation:** Radix UI (Headless primitives untuk aksesibilitas, navigasi keyboard, & logika).
* **Component Distribution:** shadcn/ui (Komponen disuntikkan langsung sebagai kode lokal ke folder komponen).
* **Styling Engine:** Tailwind CSS (Untuk visual, layouting, dan kustomisasi).
* **Design System & Theme Preset:** Nova Preset (Menggunakan Geist Sans untuk tipografi bersih dan Lucide Icons untuk visual minimalis).

---

## 2. Rules for UI Component Development (CRITICAL)

### A. Jangan Membuat Komponen Dasar dari Nol
Jika memerlukan komponen UI standar (seperti *Button, Input, Table, Dialog, Dropdown, Select, Card, Tabs*), **periksa terlebih dahulu folder `@/components/ui/`**. 
Jika komponen belum tersedia, gunakan komponen shadcn/ui yang sesuai dan tambahkan melalui shadcn CLI jika environment mendukungnya. Jangan membuat primitive accessibility dari nol:
```bash
npx shadcn@latest add <nama-komponen>
```
*Jangan pernah menulis logika aksesibilitas keyboard atau state modal dari nol jika Radix UI/shadcn sudah menyediakannya.*

### B. Aturan Penulisan Kode & Modifikasi Komponen
1. **Gunakan Utilitas `cn()`:** Semua penggabungan class Tailwind (termasuk class dinamis atau penggabungan props `className`) wajib dibungkus menggunakan fungsi pembantu `cn(...)` dari `@/lib/utils`.
2. **Manfaatkan Radix State Attributes:** Jangan membuat state manual untuk kondisi UI yang sudah dikelola oleh Radix UI. Manfaatkan atribut `data-state`, `data-disabled`, atau `data-orientation` milik Radix menggunakan kombinasi CSS selektor Tailwind. Contoh:
   * `data-[state=open]:animate-in`
   * `data-[state=active]:bg-primary`
   * `data-[disabled]:pointer-events-none`

---

## 3. Styling & Color Token Rules (Nova Preset)
Untuk menjaga konsistensi estetik dari preset **Nova**, patuhi aturan pewarnaan berbasis *CSS Variables* berikut. **Dilarang keras menggunakan warna hardcoded** (seperti `bg-blue-500`, `text-gray-700`) kecuali untuk visualisasi khusus seperti status indikator stok kritis.

Gunakan token warna resmi berikut di dalam class Tailwind Anda:
* `bg-background` & `text-foreground` (Warna dasar halaman)
* `border-border` (Warna garis pembatas/divider)
* `bg-primary` & `text-primary-foreground` (Warna aksi utama/CTA)
* `bg-muted` & `text-muted-foreground` (Warna elemen sekunder/redup)
* `bg-accent` & `text-accent-foreground` (Warna saat elemen di-hover/sorot)
* `bg-destructive` & `text-destructive-foreground` (Warna untuk aksi berbahaya/hapus)

---

## 4. UI/UX & Design Guidelines for Stock Management Dashboard
* **Data Density:** Aplikasi manajemen stok membutuhkan keterbacaan data yang tinggi. Gunakan `Table` dengan ukuran padding yang pas, tipografi **Geist Sans** yang tajam, dan visualisasi angka yang jelas.
* **Iconography:** Selalu gunakan ikon dari library `lucide-react`. Gunakan ikon secara fungsional dan konsisten (misal: *Trash2* untuk hapus, *Pencil* untuk edit, *Plus* untuk tambah).
* **Loading & Empty States:** Saat memuat data stok atau saat data kosong, selalu sediakan UI *Skeleton* atau *Empty State* menggunakan komponen bawaan yang rapi.

