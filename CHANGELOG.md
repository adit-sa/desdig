# Changelog - desDig (desa Digital)

Semua perubahan, penambahan fitur, perbaikan bug, dan pembaruan arsitektur pada aplikasi **desDig (desa Digital)** dicatat secara berkala dalam dokumen ini.

Format dokumen ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi standar [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

### Added
- **Dukungan Cloudflare R2 / S3 Object Storage (`lib/storage.ts`)**:
  - Adapter penyimpanan cloud berkas media dan foto (`lib/storage.ts`) menggunakan `@aws-sdk/client-s3`.
  - Otomatis mengunggah ke Cloudflare R2 saat kredensial R2 dikonfigurasi pada env (arsitektur Vercel Serverless), dengan fallback mulus ke penyimpanan disk lokal (`public/uploads`) pada mode development.
  - Integrasi langsung dengan API unggah berkas (`/api/upload`) dan kompresi cerdas WebP via Sharp.
- **Standarisasi & Validasi Kode Wilayah Kemendagri (`PP.KK.CC.DDDD`)**:
  - Utility helper `formatKodeKemendagri`, `maskKodeKemendagriInput`, dan `isValidKodeKemendagri` pada `lib/formatters.ts` untuk konversi otomatis format 10-digit mentah ke format Permendagri standar (`PP.KK.CC.DDDD`).
  - Input Kode Wilayah Kemendagri baru pada halaman Admin Identitas Desa (`/admin/identitas`) lengkap dengan auto-masking dan dukungan simpan pada API `/api/identity`.
  - Suite pengujian otomatis baru `tests/kemendagri-formatter.test.ts` (5 pengujian Vitest).
- **Fitur Manajemen Domain Kustom & Subdomain SaaS (`/saas` & `/api/saas/domains`)**:
  - Endpoint API `/api/saas/domains` (CRUD: GET, POST, PATCH, DELETE) dengan sanitasi domain, validasi hostname, penolakan duplikasi domain lintas tenant, dan otorisasi Super Admin.
  - Tombol modal "Domain" di setiap baris tenant pada dashboard Master SaaS (`/saas`) dan badge visual daftar domain terdaftar di bawah nama desa.
  - Modal interaktif kelola domain: pendaftaran custom domain desa (misal `salupangkang.desa.id`), toggle penetapan domain utama (*primary*), status aktif/verifikasi, dan hapus domain.
  - Generator instruksi DNS & tombol satu-klik "Salin Format WhatsApp" (A Record `@` $\rightarrow$ `76.76.21.21` & CNAME `www` $\rightarrow$ `cname.vercel-dns.com`) untuk dikirim langsung ke pengelola domain desa/Kominfo.
  - Suite pengujian otomatis baru `tests/domain-management.test.ts` (5 uji vitest) yang memvalidasi registrasi domain, resolusi tenant via hostname, pencegahan duplikasi, dan isolasi tenant.
- **Multi-Level Sub-Menu (Level 1, Level 2, Level 3+) di Admin Menu (`/admin/menu`)**:
  - Tombol `+ Sub` kini tersedia untuk semua menu (Menu Utama maupun Sub-menu), memungkinkan pembuatan sub-menu di dalam sub-menu secara bertingkat.
  - Dropdown pemilihan Menu Induk menampilkan pohon hirarki berindentasi (`↳ Sub L1`, `  ↳↳ Sub L2`) dengan pencegahan siklus referensi (*cycle detection*).
  - Tampilan publik tema `ModernGovernment` (`SiteHeader`) mendukung *flyout dropdown* tingkat 3 untuk desktop serta *nested list* berindentasi pada mobile drawer.
- **Sistem Kustomisasi Warna Tema Modern Government (`/admin/tampilan`)**:
  - 8 Palet Preset Resmi: *Emerald Nusantara (Default), Saphire Bahari, Ruby Keraton, Forest Rimba, Royal Violet, Sunset Amber, Sky Terbuka, Slate Modern*.
  - Pemilih Warna Kustom (*Hex Color Picker*) dengan kalkulasi matematis otomatis 11 tingkat spektrum (*tint/shade 50–950*).
  - Integrasi dinamis Tailwind v4 CSS Variables (`--color-emerald-*`, `--color-teal-*`) via komponen `<ThemeColorStyle>` tanpa merusak utilitas Tailwind.
  - Live Interactive Website Preview langsung di tab kustomisasi admin.
- **Pilihan Tata Letak Halaman (Fixed vs Fluid Container)**:
  - Mode **Fixed**: Lebar kontainer terpusat standar 1280px (`max-w-7xl`).
  - Mode **Fluid**: Lebar kontainer adaptif hingga 1760px dengan dynamic padding `clamp(1rem, 3vw, 3.5rem)` untuk layar monitor lebar.
  - Dukungan penuh pada halaman beranda, artikel, galeri, lapak UMKM, dan pembangunan.
- **Suite Pengujian Otomatis (Vitest)**:
  - `tests/theme-colors.test.ts`: Uji unit matematika warna, generasi tint/shade, CSS variables, dan validasi preset (8 uji).
  - `tests/tenant-isolation.test.ts`: Uji integritas isolasi multi-tenant data desa (11 uji).

### Changed
- **Optimalisasi Repositori Git & Persiapan Deployment Vercel**:
  - Mengonfigurasi `.gitignore` ketat untuk mengecualikan berkas berat: folder backup lokal (`backup/`, `*.sql`), direktori upload media besar (`public/uploads/`, `public/desa/upload/`), serta binary engine Prisma (`*.node`, `*.dll`, legacy clients).
  - Ukuran push Git menjadi sangat ramping (~2-3 MB) dan bebas dari batas kuota GitHub 100 MB.
  - Menambahkan script `"postinstall": "prisma generate"` pada `package.json` untuk menjamin otomatisasi generasi Prisma Client Linux saat deploy di Vercel.
- **Normalisasi Format Kode Kemendagri di Database & Master SaaS (`/saas`)**:
  - Menormalkan seluruh rekaman tenant di database PostgreSQL ke standar resmi bertitik: Salupangkang (`76.06.04.2009`), Sukamaju (`32.05.11.2001`), dan Mekarjaya (`32.01.25.2008`).
  - Kolom Kode Kemendagri pada tabel `/saas` kini otomatis terformat konsisten via `formatKodeKemendagri`.
  - Form pendaftaran desa baru di `/saas` dilengkapi auto-masking input dan panduan `PP.KK.CC.2XXX`.
- **Pembaruan Tampilan Admin Modul (`/admin/modul`)**:
  - Mengubah tampilan dari grid kartu 3-kolom menjadi tampilan **Tabel List Terstruktur**.
  - Dilengkapi kolom No, Modul & Deskripsi, Kategori, Versi, Status Lisensi Paket, dan Saklar Toggle Status.
  - Bilah pencarian teks instan, tab filter status (*Semua, Aktif, Nonaktif*), serta dropdown filter kategori.
- **Pembaruan Tampilan Admin Menu (`/admin/menu`) Menjadi Ultra-Compact**:
  - Mengubah tampilan bertingkat kotak kartu menjadi **Tabel List Berhirarki**.
  - Fitur **Collapse/Expand per Menu Induk** (ikon panah putar & badge sub-menu `3 Sub ▾`).
  - Tombol aksi masal **"Ciutkan Semua / Bentangkan Semua"** untuk navigasi cepat.
  - Desain baris ultra-kompak (`py-1.5 px-2.5`) dengan tata letak padat, ringkas, dan efisien ruang.
  - Tombol penata urutan cepat (Naik/Turun) antar-saudara dalam hirarki yang sama.
- **Standardisasi Identitas & Penamaan Resmi Aplikasi (`desDig`)**:
  - Mengganti seluruh referensi nama lama (*opensid / OpenSID*) pada brand antarmuka, metadata, dan dokumentasi menjadi **`desDig` (desa Digital)**.
  - Memperbarui `package.json` (`"name": "desdig"`), `app/layout.tsx` (title: *desDig (desa Digital)*), navbar header (*desDig* & *desDig SaaS*), master SaaS dashboard, dan deployment configuration.
  - Memperbarui `lib/store.ts` dengan fungsi utama `useDesDigStore` (dengan alias `useOpenSIDStore` untuk kompatibilitas mundur), serta sinkronisasi ganda session cookie (`desdig_auth_session` & `opensid_auth_session`) dan localStorage (`desdig_*` & `opensid_*`) agar data pengguna aktif tidak terganggu.
- **Identitas & Aturan Proyek**:
  - Menetapkan nama resmi aplikasi menjadi **`desDig` (desa Digital)**.
  - Menambahkan aturan wajib pembaruan `CHANGELOG.md` pada `AGENTS.md`.

### Fixed
- **Standardisasi Output Prisma Client ke `@prisma/client`**:
  - Menghapus konfigurasi custom output `lib/prisma-client-v4` pada `prisma/schema.prisma` dan mengembalikan generator ke lokasi standar `node_modules/@prisma/client`.
  - Memperbarui `lib/prisma.ts` dan script terkait agar mengimpor langsung dari `@prisma/client`.
  - Menghapus berkas bundle usang `lib/prisma-client-v4` dari tracking Git, merampingkan ukuran repositori dan menghilangkan peringatan tracing filesystem Turbopack.
  - Memperbaiki kegagalan Prisma Client initialization pada saat runner CI GitHub Actions menjalankan `npx tsx prisma/seed.ts` (`@prisma/client did not initialize yet`).
- **Pengecualian Berkas `.env.example` dari Aturan `.gitignore`**:
  - Menambahkan aturan un-ignore `!.env.example` setelah `.env*` pada `.gitignore` agar template environment terunggah ke Git.
  - Memperbaiki kegagalan runner CI GitHub Actions pada langkah `cp .env.example .env` (`cp: cannot stat '.env.example': No such file or directory`).
- **Resolusi Sinkronisasi Package Lock & CI/CD GitHub Actions**:
  - Mengembalikan keselarasan versi `@types/node` antara `package.json` dan `package-lock.json` untuk mencegah kegagalan *lockfile mismatch*.
  - Mengganti eksekusi pada workflow `.github/workflows/ci.yml` menjadi `npm install --legacy-peer-deps` dengan Node.js 20 LTS agar instalasi dependensi di CI berjalan fleksibel dan stabil tanpa hambatan ERESOLVE.
  - Mempertahankan `.npmrc` dengan `legacy-peer-deps=true` untuk kelancaran build otomatis di Vercel.
- **Pembersihan Fallback Kode Hardcode di Tema Publik**:
  - Menghapus fallback kode desa statis (`'32.04.11.2001'` dan `'76.01.03.2005'`) pada komponen `ModernEditorialTheme` dan `TraditionalVillageTheme`, digantikan dengan pemanggilan formatter dinamis `formatKodeKemendagri(tenant.kodeDesa)` guna menjaga kepatuhan isolasi multi-tenant.
- **Hydration Mismatch (React 19 / Next.js 16)**:
  - Memperbaiki perbedaan atribut SSR vs Client hydration (`href="/?tenant="` vs `href="/?tenant=salupangkang"`) akibat pembacaan client store.
  - Menambahkan `suppressHydrationWarning` dan *mounted check* di:
    - `app/admin/menu/page.tsx`
    - `app/admin/tampilan/page.tsx`
    - `app/admin/identitas/page.tsx`
    - `app/admin/absen/page.tsx`
    - `app/admin/pelapak/page.tsx`
    - `app/admin/pembangunan/page.tsx`
    - `app/admin/perangkat/page.tsx`
- **Next.js 16 Turbopack Prerender Incompatibility**:
  - Menghapus segment config yang berkonflik `export const dynamic = 'force-dynamic'` pada `app/api/attendance/report/route.ts` dan `app/api/media/library/route.ts` agar kompatibel dengan konfigurasi `cacheComponents: true`.
  - Memperbaiki konfigurasi `vitest.config.ts` untuk mengabaikan folder build `.next/standalone`.

---

## [0.1.0] - 2026-10-22

### Added
- Rilis fondasi awal arsitektur SaaS multi-tenant desa berbasis Next.js 16, React 19, Tailwind CSS v4, dan PostgreSQL (Prisma ORM).
- Portal publik desa dengan tema *Modern Government* & *Traditional Village*.
- Panel Administrasi Pemerintahan Desa:
  - Manajemen Pamong & Aparatur Desa
  - Absensi Pamong (Kiosk PIN & Rekapitulasi Siltap)
  - Warta, Artikel & Berita Desa
  - Galeri & Dokumentasi Kegiatan
  - Pengumuman & Agenda Desa
  - Lapak & Produk UMKM Warga
  - Monitoring Progres Pembangunan Fisik & APBDes
  - Manajemen Halaman Statis & Identitas Resmi Desa

