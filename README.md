# 🏛️ desDig (desa Digital) - Multi-Tenant Website Desa SaaS Platform

Platform SaaS produksi modern untuk membangun, mengelola, mengustomisasi, dan menerbitkan website resmi desa di seluruh Indonesia secara terpusat, modular, aman, dan berdaulat.

Aplikasi ini mendukung arsitektur **multi-tenant** murni di mana setiap desa memiliki identitas, tema visual, data kependudukan, konten warta, modul fitur, domain/subdomain, dan paket langganan yang terisolasi secara ketat.

---

## 🚀 Fitur Unggulan Sistem

### 1. Arsitektur Multi-Tenant Murni (PostgreSQL + Prisma ORM)
- **Hostname Resolution**: Mengenali desa secara otomatis dari subdomain (`sukamaju.desaku.id`, `sukamaju.localhost:3000`) atau domain kustom resmi (`www.desasukamaju.id`).
- **Isolasi Data Ketat**: Seluruh query dan mutasi database terlingkup (*scoped*) secara ketat berdasarkan `tenantId`. Data Desa A dijamin tidak dapat dibaca atau diubah oleh Desa B.
- **Audit Logging**: Mencatat rekam jejak setiap aksi administratif kritis (perubahan tema, aktivasi modul, publikasi artikel).

### 2. Theme Engine & Live Customizer
Memisahkan data konten desa dari lapisan presentasi visual. Dilengkapi 3 tema resmi perdana:
1. **Modern Government**: Tampilan formal dan berwibawa khas institusi kepemerintahan modern (Emerald & Teal).
2. **Traditional Village**: Sentuhan hangat kayu nusantara, ornamen kultural, dan nilai kearifan lokal (Amber & Warm Stone).
3. **Modern Editorial**: Format majalah berita dengan tipografi tegas untuk desa jurnalisme dan publikasi warta (Slate & Indigo).
- **Prinsip *Content Preservation***: Pergantian tema dilakukan dalam 1 klik tanpa pernah menghapus atau merusak artikel, struktur pamong, maupun anggaran yang telah ada.

### 3. Sistem Plugin Modular (15 Modul Registri)
Mendukung siklus hidup aktivasi modul per desa:
- *Modul Inti*: Profil Desa, Berita & Artikel, Papan Pengumuman, PPID.
- *Modul Tambahan*: Agenda Kegiatan, Galeri Foto, Dokumen & Perdes, Potensi Wisata, Direktori UMKM, Transparansi APBDes, Pengaduan Warga, Layanan Mandiri Surat, Statistik Demografi, SEO Generator, Analitik Pengunjung.
- **Subscription Entitlement Guard**: Penegakan hak akses fitur berdasarkan paket langganan desa (*Starter*, *Pro*, *Enterprise*).

### 4. CMS (Content Management System)
- Pengelolaan warta berita dengan pembuatan slug otomatis ramah SEO, status draf/terbit, pencarian, dan penyaringan kategori.
- Pengelolaan papan pengumuman warga dengan fitur sematan prioritas (*pin to top*).
- Pengelolaan aparatur pamong desa dan bagan perangkat kerja pelayan masyarakat.

### 5. SEO & Dynamic Metadata Generator
- Otomatis membuat `sitemap.xml` dinamis per tenant yang mencakup halaman muka dan seluruh artikel terbit.
- `robots.txt` otomatis yang melindungi area administratif dari perayap mesin pencari.
- Dynamic OpenGraph tags untuk pratinjau media sosial per desa dan per berita.

---

## 🛠️ Stack Teknologi

- **Framework**: Next.js 16 (App Router) dengan Partial Prerendering & Server Components
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Database**: PostgreSQL
- **ORM**: Prisma ORM v6 LTS
- **Validasi**: Zod Schema
- **Testing**: Vitest (Unit & Tenant Isolation Tests)
- **Kompilasi**: Turbopack

---

## 📦 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Lingkungan
Pastikan Anda memiliki:
- Node.js LTS (v20+)
- PostgreSQL lokal atau Docker yang berjalan pada port `5432` dengan database `mydb`

### 2. Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
NEXT_PUBLIC_PLATFORM_DOMAIN="localhost:3000"
NEXTAUTH_SECRET="super-secret-desa-saas-platform-key-development-32chars"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Setup Database & Seeding
Jalankan migrasi dan isi database dengan data 2 tenant percontohan (*Desa Sukamaju* dan *Desa Salupangkang*):
```bash
# Sinkronkan skema ke PostgreSQL
npx prisma db push

# Jalankan skrip seeding data awal
npx tsx prisma/seed.ts
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```

Aplikasi dapat diakses di `http://localhost:3000`.

---

## 🌐 Rute Halaman & Navigasi

| Area | URL | Deskripsi |
|---|---|---|
| **Website Publik Desa Sukamaju** | `http://localhost:3000/?tenant=sukamaju` | Website publik desa tema *Modern Government* |
| **Website Publik Desa Salupangkang** | `http://localhost:3000/?tenant=salupangkang` | Website publik desa tema *Traditional Village* |
| **Baca Berita Publik** | `http://localhost:3000/berita/[slug]?tenant=sukamaju` | Halaman baca artikel responsif dengan view counter |
| **Dashboard Admin Desa** | `http://localhost:3000/admin` | Panel ringkasan administrasi desa aktif |
| **CMS Berita Desa** | `http://localhost:3000/admin/berita` | CRUD publikasi warta berita desa |
| **Papan Pengumuman** | `http://localhost:3000/admin/pengumuman` | CRUD pengumuman dan maklumat warga |
| **Pamong Desa** | `http://localhost:3000/admin/pamong` | Kelola struktur aparatur perangkat desa |
| **Tema & Tampilan** | `http://localhost:3000/admin/tampilan` | Switch 3 tema dan Section Builder |
| **Manajemen Modul** | `http://localhost:3000/admin/modul` | Sakelar 15 modul fitur & proteksi paket |
| **Log Audit Keamanan** | `http://localhost:3000/admin/audit` | Rekam audit mutasi data kritis |
| **Master SaaS Multi-Desa** | `http://localhost:3000/saas` | Registrasi desa baru & monitoring MRR |
| **Sitemap XML** | `http://localhost:3000/sitemap.xml` | Generator peta situs otomatis |
| **Robots TXT** | `http://localhost:3000/robots.txt` | Aturan perayapan mesin pencari |

---

## 🧪 Menjalankan Pengujian Otomatis

Untuk memverifikasi isolasi data multi-tenant dan fungsionalitas sistem:
```bash
npx vitest run
```

Seluruh 11 pengujian otomatis mencakup:
- Verifikasi pendaftaran tenant di database
- Resolusi tenant berbasis subdomain dan slug
- Isolasi query artikel lintas desa
- Pencegahan kebocoran slug artikel antar-desa
- Isolasi laporan anggaran keuangan APBDes
- Independensi pergantian tema antar-desa
- Integritas data saat pergantian tema (*Content Preservation*)
- Penonaktifan modul tanpa menghapus data di database
- Pencatatan aktivitas ke Audit Log
- Isolasi pengumuman resmi antar-desa
- Isolasi struktur pamong desa

---

## 🚀 Kompilasi Produksi

Untuk memvalidasi kesiapan deployment produksi:
```bash
npm run build
```
Seluruh 28 rute terkompilasi bersih tanpa peringatan atau kegagalan pengetikan TypeScript.
