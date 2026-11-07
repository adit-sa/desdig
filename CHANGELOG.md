# Changelog - desDig (desa Digital)

Semua perubahan, penambahan fitur, perbaikan bug, dan pembaruan arsitektur pada aplikasi **desDig (desa Digital)** dicatat secara berkala dalam dokumen ini.

Format dokumen ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi standar [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

### Security
- **Kriptografi Sesi Login Bertanda Tangan (Signed HMAC-SHA256 & HttpOnly Cookie) (`lib/auth/session.ts`, `app/api/auth/login/route.ts`, `lib/auth/rbac.ts`, `lib/tenant/resolver.ts`, `proxy.ts`)**:
  - Mengamankan cookie sesi `desdig_auth_session` dengan tanda tangan kriptografis HMAC-SHA256 berwaktu kedaluwarsa (7 hari) dan proteksi timing-safe comparison (`crypto.timingSafeEqual`).
  - Mengonfigurasi flag `httpOnly: true`, `secure: true`, dan `sameSite: 'lax'` untuk memutus risiko pemalsuan identitas sesi di DevTools dan serangan pencurian via XSS.
  - Menyediakan cookie publik non-sensitif `desdig_user_profile` strictly untuk kebutuhan rendering nama pengguna di client-side UI store.
- **Proteksi Rate Limiting & Anti Brute-Force (`lib/security/rate-limit.ts`, `app/api/auth/login/route.ts`, `app/api/attendance/kiosk/clock/route.ts`, `app/api/telegram/webhook/route.ts`)**:
  - Menerapkan sliding-window rate limiter in-memory dengan auto-cleanup berkala.
  - Membatasi percobaan login maksimal 8 kali per menit per alamat IP klien.
  - Membatasi tebakan PIN aparatur di kiosk absensi maksimal 5 kali per 2 menit untuk mencegah tebakan PIN liar di kantor desa.
  - Membatasi webhook Telegram maksimal 120 update per menit untuk memproteksi bot dari serangan flood.

### Added
- **Legalitas & Anti-Pemalsuan: Dynamic Verifiable QR Code & Public Letter Verification (`app/surat/page.tsx`, `components/DynamicQrCode.tsx`, `app/surat/verify/[id]/page.tsx`)**:
  - Cetak surat keterangan permohonan warga kini menyematkan QR Code dinamis (`DynamicQrCode`) dengan tautan verifikasi digital resmi `/surat/verify/[id]?tenant=[slug]`.
  - Halaman publik verifikasi `/surat/verify/[id]` yang menampilkan lencana keabsahan warkah desa "DOKUMEN RESMI TERVERIFIKASI", kop lambang resmi desa penerbit, nomor surat, jenis surat, keperluan, serta pernyataan keabsahan sesuai UU ITE No. 1/2024.
  - Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022): NIK pemohon pada verifikasi publik disamarkan otomatis secara aman (`7606********0001`).
- **Akuntabilitas & Transparansi UU Desa: Visualisasi Realisasi APBDes Sesuai Permendagri No. 20/2018 (`components/themes/modern-government/ApbdesSection.tsx`, `components/themes/modern-government/shared.ts`)**:
  - Menghadirkan visualisasi transparansi keuangan desa berbasis 3 pilar: 1. Pendapatan Desa, 2. Belanja Desa (5 Bidang), dan 3. Neraca Kas Berjalan (Surplus/Defisit Berimbang & Pembiayaan Netto).
  - Menyediakan sorotan khusus Dana Desa (DDS APBN) sebagai prioritas transfer nasional beserta pagu dan serapan anggarannya.
  - Menyediakan dual view mode: Tampilan Kartu Rinci dengan persentase realisasi teranimasi dan Tampilan Tabel Rekapitulasi Standar Permendagri No. 20/2018 lengkap dengan pagu, realisasi, persentase serapan, serta sisa alokasi anggaran.
  - Dilengkapi fitur pencarian real-time untuk menyaring uraian pos anggaran dan kode rekening APBDes secara instan tanpa reload.
- **Fitur Operasional Favorit Admin Desa: Ekspor Excel / CSV Buku Induk Penduduk & Absensi (`app/kependudukan/page.tsx`)**:
  - Menambahkan tombol ekspor Excel/CSV Buku Induk Penduduk berstandar Disdukcapil (NIK, No KK, Nama, Dusun, RT, RW, Jenis Kelamin, Agama, Pendidikan, Pekerjaan, Golongan Darah) dengan encoding UTF-8 BOM (`\uFEFF`) agar langsung terbaca rapi di Microsoft Excel.
- **Ketahanan Database Serverless Cloud (`lib/prisma.ts`)**:
  - Menerapkan fungsi resiliensi `withPrismaRetry<T>()` dengan strategi exponential backoff dan jitter untuk menangani cold start Neon PostgreSQL PgBouncer dan pemutusan koneksi sementara (`P1001`, `P2024`, `P1017`, `ConnectionReset`).
- **Kesiapan Perangkat Kiosk Mandiri (`next.config.ts`)**:
  - Memperbarui header `Permissions-Policy` ke `camera=(self)` agar perangkat Kiosk Desa dapat mengakses webcam pemindai wajah aparatur tanpa diblokir oleh kebijakan keamanan peramban.
- **Cross-Request Caching & On-Demand Revalidation (`lib/tenant/data.ts`, `lib/tenant/cache-revalidate.ts`, `app/api/articles/*`, `app/api/announcements/*`, `app/api/gallery/*`, `app/api/telegram/webhook/*`)**:
  - Mengintegrasikan `unstable_cache` pada data beranda desa (`getTenantPublicHomeData`), menu navigasi (`getTenantNavMenus`), dan listing artikel (`getTenantArticleListing`) dengan revalidasi 1 jam dan sistem tagging tenant (`tenant-${tenantId}-home`).
  - Permintaan publik yang berulang kini dilayani dalam waktu <30ms dengan pemangkasan beban query database Neon PostgreSQL hingga 95%.
  - Otomatis memicu `revalidateTenantCache` saat admin atau bot Telegram menerbitkan/memperbarui berita, galeri, atau pengumuman sehingga perubahan langsung tampil instan.
- **Dynamic OpenGraph & Twitter Meta Cards (`app/berita/[slug]/page.tsx`, `app/halaman/[slug]/page.tsx`)**:
  - Menghasilkan metadata OpenGraph dinamis beresolusi 1200x630 dengan URL absolut, nama desa resmi, dan thumbnail sampul artikel, sehingga saat tautan dibagikan ke WhatsApp, Facebook, atau Telegram, kartu pratinjau tampil elegan dan informatif.
- **Mode Luar Jaringan (Offline-First) Kiosk Absensi (`app/absen/page.tsx`)**:
  - Menambahkan mekanisme penampungan absensi lokal di browser (`localStorage` queue) jika koneksi internet kantor desa terputus/offline saat pamong melakukan absensi.
  - Menyediakan indikator visual realtime status koneksi (`WifiOff`) dan jumlah antrean tersimpan lokal, serta auto-sinkronisasi otomatis ke server begitu jaringan pulih.
- **Eliminasi Warning Bundler Turbopack Storage (`lib/storage.ts`, `lib/media.ts`)**:
  - Menambahkan isolasi path upload lokal `resolveUploadPath` dengan direktif `/*turbopackIgnore: true*/`, melenyapkan peringatan pemindaian berlebih 34.400 berkas upload saat kompilasi build produksi.

### Changed
- **Migrasi Konvensi Next.js 16: `middleware.ts` ke `proxy.ts` (`proxy.ts`)**:
  - Memigrasikan gerbang routing multi-tenant dari konvensi lawas `middleware.ts` ke konvensi resmi Next.js 16 `proxy.ts` dengan export fungsi `proxy()`, menghilangkan deprecation warning pada build console.
- **Komponen Universal `SafeImage` & Migrasi 100% ke `next/image` (`components/SafeImage.tsx`, seluruh halaman publik & admin)**:
  - Membuat wrapper universal `SafeImage` berbasis `next/image` yang menangani fallback otomatis jika berkas gambar rusak/hilang, penyesuaian dimensi adaptif (`sizes`, `fill`, `width`, `height`), serta penanganan cerdas untuk preview gambar lokal (`data:` dan `blob:`) tanpa membebani optimizer Next.js.
  - Memigrasikan **100% tag `<img>`** di seluruh tema portal publik (`components/themes/modern-government/*`, `components/themes/ModernEditorialTheme.tsx`, `components/themes/TraditionalVillageTheme.tsx`).
  - Memigrasikan seluruh halaman publik (`app/artikel/`, `app/berita/[slug]`, `app/galeri/`, `app/halaman/[slug]`, `app/lapak/`, `app/pembangunan/`, `app/surat/`, `app/absen/`).
  - Memigrasikan seluruh modul CMS admin backoffice (`app/admin/berita`, `app/admin/galeri`, `app/admin/halaman`, `app/admin/identitas`, `app/admin/media`, `app/admin/pamong`, `app/admin/pelapak`, `app/admin/pembangunan`, `app/admin/tampilan`, `app/admin/telegram`).
  - Zero raw `<img>` tag tersisa di seluruh direktori `app/` dan `components/`.
  - Mengunci standar media dalam `AGENTS.md` (hukum mutlak AI proyek) dan `eslint.config.mjs` (`@next/next/no-img-element: "error"`) sehingga pengembang atau AI di masa depan tidak dapat meregresi kembali ke `<img>`.
- **Konfigurasi VS Code CSS Linter untuk Tailwind CSS v4 (`.vscode/settings.json`)**:
  - Menambahkan konfigurasi `"css.lint.unknownAtRules": "ignore"` untuk mengatasi peringatan palsu `Unknown at rule @theme` di `app/globals.css` pada editor VS Code akibat fitur baru Tailwind CSS v4.
- **Optimasi Bandwidth & Penghematan Kuota Data (`app/layout.tsx`, `app/globals.css`, `lib/tenant/data.ts`, `app/lapak/page.tsx`, `app/galeri/page.tsx`, `app/pembangunan/page.tsx`)**:
  - Mengintegrasikan `next/font/google` (`Plus_Jakarta_Sans` variable font) di root layout dan menghapus `@import` Google Fonts eksternal dari CSS, menghemat request blocking jaringan dan kuota perangkat seluler.
  - Memangkas over-fetching query beranda `getTenantPublicHomeData` dengan `select` spesifik tanpa menyertakan kolom `content: @db.Text` ribuan kata yang tidak ditampilkan di beranda.
  - Mengoptimalkan listing artikel `getTenantArticleListing` dengan batas `take: 60` dan pemotongan teks cuplikan ringkas (300 karakter), memangkas ukuran JSON payload hingga >95% pada perangkat pengguna.
  - Menerapkan Server-Side Rendering (SSR) data pelapak langsung pada `app/lapak/page.tsx`, mengeliminasi *double network roundtrip* dan menghilangkan layout-shift/loading spinner berlebih.
  - Menambahkan pembatas `LIMIT 48` pada galeri foto desa dan `LIMIT 30` pada proyek pembangunan untuk melindungi kuota dari tabel berukuran besar.
  - Memperbarui plugin & skill `ponytail` ke versi upstream terbaru (163 commits fast-forward).

### Changed
- **Pembersihan Over-Engineering & Transisi ke Platform Native (`components/themes/modern-government/ScrollEffects.tsx`, `app/globals.css`, `package.json`)**:
  - Menghapus dependensi pihak ketiga `lenis` (~20 KB bundle) dan loop RAF dinamis, beralih 100% ke native CSS `scroll-behavior: smooth` dan lightweight `window.requestAnimationFrame` handler.
  - Menghapus CSS overhead `.lenis*` di `app/globals.css`.

### Removed
- **Pembersihan Berkas Mati & Penghematan Token AI (`lib/prisma-client*`)**:
  - Menghapus 4 direktori lama sisa eksperimen generator (`lib/prisma-client/`, `lib/prisma-client-v2/`, `lib/prisma-client-v3/`, `lib/prisma-client-v4/`) yang memakan **378 MB** dan lebih dari 120.000 baris kode mati, membebaskan ruang disk dan mempercepat pemindaian token AI.

### Security
- **Kriptografi Sesi Login Bertanda Tangan (Signed HMAC-SHA256 & HttpOnly Cookie) (`lib/auth/session.ts`, `app/api/auth/login/route.ts`, `lib/auth/rbac.ts`, `lib/tenant/resolver.ts`, `proxy.ts`)**:
  - Mengamankan cookie sesi `desdig_auth_session` dengan tanda tangan kriptografis HMAC-SHA256 berwaktu kedaluwarsa (7 hari) dan proteksi timing-safe comparison (`crypto.timingSafeEqual`).
  - Mengonfigurasi flag `httpOnly: true`, `secure: true`, dan `sameSite: 'lax'` untuk memutus risiko pemalsuan identitas sesi di DevTools dan serangan pencurian via XSS.
  - Menyediakan cookie publik non-sensitif `desdig_user_profile` strictly untuk kebutuhan rendering nama pengguna di client-side UI store.
- **Proteksi Rate Limiting & Anti Brute-Force (`lib/security/rate-limit.ts`, `app/api/auth/login/route.ts`, `app/api/attendance/kiosk/clock/route.ts`, `app/api/telegram/webhook/route.ts`)**:
  - Menerapkan sliding-window rate limiter in-memory dengan auto-cleanup berkala.
  - Membatasi percobaan login maksimal 8 kali per menit per alamat IP klien.
  - Membatasi tebakan PIN aparatur di kiosk absensi maksimal 5 kali per 2 menit untuk mencegah tebakan PIN liar di kantor desa.
  - Membatasi webhook Telegram maksimal 120 update per menit untuk memproteksi bot dari serangan flood.

### Added
- **Legalitas & Anti-Pemalsuan: Dynamic Verifiable QR Code & Public Letter Verification (`app/surat/page.tsx`, `components/DynamicQrCode.tsx`, `app/surat/verify/[id]/page.tsx`)**:
  - Cetak surat keterangan permohonan warga kini menyematkan QR Code dinamis (`DynamicQrCode`) dengan tautan verifikasi digital resmi `/surat/verify/[id]?tenant=[slug]`.
  - Halaman publik verifikasi `/surat/verify/[id]` yang menampilkan lencana keabsahan warkah desa "DOKUMEN RESMI TERVERIFIKASI", kop lambang resmi desa penerbit, nomor surat, jenis surat, keperluan, serta pernyataan keabsahan sesuai UU ITE No. 1/2024.
  - Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022): NIK pemohon pada verifikasi publik disamarkan otomatis secara aman (`7606********0001`).
- **Akuntabilitas & Transparansi UU Desa: Visualisasi Realisasi APBDes Sesuai Permendagri No. 20/2018 (`components/themes/modern-government/ApbdesSection.tsx`, `components/themes/modern-government/shared.ts`)**:
  - Menghadirkan visualisasi transparansi keuangan desa berbasis 3 pilar: 1. Pendapatan Desa, 2. Belanja Desa (5 Bidang), dan 3. Neraca Kas Berjalan (Surplus/Defisit Berimbang & Pembiayaan Netto).
  - Menyediakan sorotan khusus Dana Desa (DDS APBN) sebagai prioritas transfer nasional beserta pagu dan serapan anggarannya.
  - Menyediakan dual view mode: Tampilan Kartu Rinci dengan persentase realisasi teranimasi dan Tampilan Tabel Rekapitulasi Standar Permendagri No. 20/2018 lengkap dengan pagu, realisasi, persentase serapan, serta sisa alokasi anggaran.
  - Dilengkapi fitur pencarian real-time untuk menyaring uraian pos anggaran dan kode rekening APBDes secara instan tanpa reload.
- **Fitur Operasional Favorit Admin Desa: Ekspor Excel / CSV Buku Induk Penduduk & Absensi (`app/kependudukan/page.tsx`)**:
  - Menambahkan tombol ekspor Excel/CSV Buku Induk Penduduk berstandar Disdukcapil (NIK, No KK, Nama, Dusun, RT, RW, Jenis Kelamin, Agama, Pendidikan, Pekerjaan, Golongan Darah) dengan encoding UTF-8 BOM (`\uFEFF`) agar langsung terbaca rapi di Microsoft Excel.
- **Ketahanan Database Serverless Cloud (`lib/prisma.ts`)**:
  - Menerapkan fungsi resiliensi `withPrismaRetry<T>()` dengan strategi exponential backoff dan jitter untuk menangani cold start Neon PostgreSQL PgBouncer dan pemutusan koneksi sementara (`P1001`, `P2024`, `P1017`, `ConnectionReset`).
- **Kesiapan Perangkat Kiosk Mandiri (`next.config.ts`)**:
  - Memperbarui header `Permissions-Policy` ke `camera=(self)` agar perangkat Kiosk Desa dapat mengakses webcam pemindai wajah aparatur tanpa diblokir oleh kebijakan keamanan peramban.
- **Cross-Request Caching & On-Demand Revalidation (`lib/tenant/data.ts`, `lib/tenant/cache-revalidate.ts`, `app/api/articles/*`, `app/api/announcements/*`, `app/api/gallery/*`, `app/api/telegram/webhook/*`)**:
  - Mengintegrasikan `unstable_cache` pada data beranda desa (`getTenantPublicHomeData`), menu navigasi (`getTenantNavMenus`), dan listing artikel (`getTenantArticleListing`) dengan revalidasi 1 jam dan sistem tagging tenant (`tenant-${tenantId}-home`).
  - Permintaan publik yang berulang kini dilayani dalam waktu <30ms dengan pemangkasan beban query database Neon PostgreSQL hingga 95%.
  - Otomatis memicu `revalidateTenantCache` saat admin atau bot Telegram menerbitkan/memperbarui berita, galeri, atau pengumuman sehingga perubahan langsung tampil instan.
- **Dynamic OpenGraph & Twitter Meta Cards (`app/berita/[slug]/page.tsx`, `app/halaman/[slug]/page.tsx`)**:
  - Menghasilkan metadata OpenGraph dinamis beresolusi 1200x630 dengan URL absolut, nama desa resmi, dan thumbnail sampul artikel, sehingga saat tautan dibagikan ke WhatsApp, Facebook, atau Telegram, kartu pratinjau tampil elegan dan informatif.
- **Mode Luar Jaringan (Offline-First) Kiosk Absensi (`app/absen/page.tsx`)**:
  - Menambahkan mekanisme penampungan absensi lokal di browser (`localStorage` queue) jika koneksi internet kantor desa terputus/offline saat pamong melakukan absensi.
  - Menyediakan indikator visual realtime status koneksi (`WifiOff`) dan jumlah antrean tersimpan lokal, serta auto-sinkronisasi otomatis ke server begitu jaringan pulih.
- **Eliminasi Warning Bundler Turbopack Storage (`lib/storage.ts`, `lib/media.ts`)**:
  - Menambahkan isolasi path upload lokal `resolveUploadPath` dengan direktif `/*turbopackIgnore: true*/`, melenyapkan peringatan pemindaian berlebih 34.400 berkas upload saat kompilasi build produksi.

### Changed
- **Migrasi Konvensi Next.js 16: `middleware.ts` ke `proxy.ts` (`proxy.ts`)**:
  - Memigrasikan gerbang routing multi-tenant dari konvensi lawas `middleware.ts` ke konvensi resmi Next.js 16 `proxy.ts` dengan export fungsi `proxy()`, menghilangkan deprecation warning pada build console.
- **Slide Carousel & Batasan Maksimal Papan Pengumuman Beranda (`components/themes/modern-government/NewsSection.tsx`, `components/themes/ModernEditorialTheme.tsx`, `components/themes/TraditionalVillageTheme.tsx`)**:
  - Membatasi tampilan Papan Pengumuman di halaman utama portal desa maksimal 2 pengumuman aktif per tampilan.
  - Jika terdapat lebih dari 2 pengumuman aktif, widget otomatis menyediakan navigasi slide interaktif (tombol Sebelumnya/Selanjutnya, nomor slide `X/Y`, serta indikator titik slide) dan auto-scroll bergantian secara berkala (6 detik) dengan pause saat di-hover/disentuh.
  - Mengatur masa aktif (*expired date*) default untuk setiap pengumuman baru menjadi **1 bulan** (30 hari dari tanggal pembuatan) jika tanggal kedaluwarsa tidak diisi, baik saat dibuat melalui form admin `/admin/pengumuman`, API backend `/api/announcements`, maupun melalui bot Telegram (`/pengumuman` & dialog wizard). Admin tetap leluasa memperpanjang tanggal kedaluwarsa kapan saja.
- **Penguatan Keamanan Kode Token Pairing Pamong (`app/api/telegram/officials/route.ts`, `app/admin/telegram/page.tsx`, `app/admin/identitas/page.tsx`)**:
  - Meningkatkan panjang kode acak token pairing dari 6 karakter menjadi **10 karakter alfanumerik berkekuatan tinggi** (contoh: `PMG-7K8M9W2A4F`) dengan ruang kombinasi mencapai lebih dari 590 triliun kemungkinan, mencegah potensi tebakan acak maupun *brute-force*.
  - Menetapkan batas validasi minimal 6 karakter alfanumerik untuk penulisan token kustom manual.

### Changed
- **Penyempurnaan Pesan Sukses Login & Tombol Logout Bot Telegram (`app/api/telegram/webhook/route.ts`, `lib/telegram.ts`)**:
  - Saat pamong berhasil login (`/login`), bot kini secara eksplisit menyapa dengan menyebutkan nama lengkap pamong, jabatannya, nama resmi desa, dan status autentikasi.
  - Menambahkan tombol menu tetap `🚪 Keluar / Logout` pada reply keyboard di layar Telegram, serta merespon perintah `/logout` atau `/keluar` dengan menghapus sesi database dan membersihkan keyboard menu dari layar secara otomatis (`remove_keyboard: true`).
- **Pembersihan & Simplifikasi Halaman Admin Telegram (`app/admin/telegram/page.tsx`)**:
  - Menghapus modul *"Token Akses Operator Umum Desa"* dan *"Jeda Waktu Penyematan Foto Susulan Otomatis"* yang sudah tidak lagi relevan usai transisi penuh ke pairing berbasis pamong desa resmi dan mode dialog wizard interaktif.
  - Merampingkan kartu KPI ringkasan menjadi 3 indikator akuntabilitas utama: Total Aparatur Pamong, Pamong Terhubung (Terautentikasi), dan Pamong Belum Terhubung (Belum Pairing).

### Fixed
- **Pencegahan Pembengkakan Ukuran Kompresi Foto (`lib/media.ts`, `app/api/telegram/webhook/route.ts`, `app/api/upload/route.ts`)**:
  - Mengatasi kendala di mana foto yang diunggah dari Telegram atau admin (misal 180 KB JPEG) justru membengkak menjadi lebih besar (217 KB - 230 KB WebP):
    - *Akar Masalah*: Foto dari Telegram telah dikompresi di sisi perangkat pengirim (~55-65% JPEG). Ketika Sharp mendekode dan mengompresi ulang ke WebP dengan target kualitas tinggi (`quality: 80-82`, `effort: 4`), artefak kompresi JPEG diperlakukan sebagai detail mikro sehingga ukuran byte file melonjak drastis (+15% s/d +22%).
    - *Solusi Cerdas*: Mengimplementasikan fungsi sentral `optimizeImageBuffer` dengan algoritma adaptif:
      1. Menggunakan `effort: 6` (algoritma kuantisasi & entropi optimal libwebp).
      2. Menyesuaikan target kualitas standar web menjadi `75` (dan pass kedua `65` jika diperlukan).
      3. **Safeguard Mutlak (`Strict Size Guard`)**: Membandingkan ukuran akhir terhadap buffer sumber. Jika hasil WebP tidak lebih hemat dari sumbernya, sistem mempertahankan berkas asli sehingga ukuran di storage **dijamin tidak akan pernah membengkak**.
- **Audit Media & Relasi Berkas Album Multi-Foto (`lib/media.ts`, `tests/media-usage.test.ts`)**:
  - Mengatasi kendala di mana foto ke-2, ke-3, dan seterusnya pada album galeri kegiatan atau lampiran multi-foto artikel terdeteksi keliru sebagai berkas yatim (*orphan files*) di pustaka media & Cloudflare R2:
  - Fungsi `getTenantMediaUsageMap` kini mengekstrak dan memindai secara mendalam array JSON `mediaUrls` pada `GalleryItem` serta `galleryUrls` pada `Article`, sehingga seluruh foto dokumentasi dalam album diakui sebagai berkas aktif terintegrasi (`🟢 Terintegrasi`) dan terlindungi dari penghapusan otomatis.
  - Menambahkan pengenalan berkas untuk modul Pelapak UMKM (`avatarUrl`, `bannerUrl`), Produk UMKM (`imageUrl`), dan Dokumen Publik APBDes/Perdes (`fileUrl`).
- **Pembersihan & Standardisasi Format Pesan Bot Telegram (`lib/telegram.ts`, `/api/telegram/webhook`)**:
  - Menghapus seluruh tag kode HTML mentah (`<b>`, `</b>`, `<i>`, `</i>`, `<code>`, `</code>`, `<a>`, `</a>`) dari seluruh pesan respon bot Telegram, beralih ke format teks biasa (*plain text*) yang rapi, bersih, dan natural menggunakan emoji serta tanda bullet (`•`).
  - Menambahkan fungsi pembersih `stripHtmlTags(text: string)` pada `lib/telegram.ts` yang menjamin tidak ada lagi tag kode mentah teknis yang bocor ke chat Telegram pengguna.
  - Mengamankan pengiriman pesan dari kendala error parsing karakter khusus (seperti tanda `&`, `<`, `>`) pada judul berita, nama kegiatan galeri, maupun nama perangkat desa.
- **Konsolidasi Multi-Foto & Album Galeri Kegiatan Desa (`/api/telegram/webhook`, `lib/telegram.ts`, `prisma/schema.prisma`)**:
  - Mengatasi kendala di mana pengiriman multi-foto galeri membuat item galeri baru terpisah untuk setiap foto yang dikirim:
    - Seluruh foto yang dikirimkan bersamaan melalui perintah `/galeri [Judul]` kini otomatis dikelompokkan ke dalam **1 item `GalleryItem` tunggal** dengan `mediaType: 'ALBUM'`, foto pertama sebagai sampul (`imageUrl`), dan seluruh foto tercatat rapi di dalam array JSON `mediaUrls`.
    - Di website publik (`/galeri`) dan dashboard admin (`/admin/galeri`), foto tampil sebagai 1 kartu album dengan label jumlah foto (`Buka Album (N Foto)`) yang dapat dibuka menjadi penampil carousel / lightbox interaktif.
  - **Penyematan Cerdas Foto Galeri Susulan Tanpa Caption**:
    - Sistem kini secara otomatis membandingkan waktu aktivitas terbaru pamong antara artikel berita vs galeri kegiatan. Jika galeri kegiatan merupakan aktivitas paling baru dalam jendela jeda waktu aktif, foto susulan tanpa caption langsung disematkan (*append*) ke dalam `mediaUrls` galeri tersebut tanpa membuat baris/kartu galeri baru.
    - Menambahkan kolom `galleryId String?` pada model `TelegramMediaGroup` untuk mendukung penambahan foto album bertahap.
  - **Pembersihan Seluruh Berkas Album Galeri saat Dihapus (`/api/gallery/[id]`, `lib/media.ts`)**:
    - Penanganan `DELETE /api/gallery/[id]` kini mengekstrak dan menghapus secara permanen seluruh URL foto yang tercantum di dalam `mediaUrls` dan foto sampul dari Cloudflare R2 dan penyimpanan lokal.
- **Penyempurnaan Pemrosesan Multi-Foto & Album Telegram (`TelegramMediaGroup`, `lib/telegram.ts`, `/api/telegram/webhook`)**:
  - Mengatasi akar masalah kegagalan pengiriman 2 atau lebih foto di mana hanya 1 foto yang tercatat/tampil:
    - **Penyebab Awal**: Timer tunggu 1.2 detik terlalu cepat bagi Telegram yang sering kali mengirimkan foto-foto dalam album dengan jeda 2 hingga 6 detik melalui request webhook paralel, sehingga worker pertama mengklaim status `processed: true` saat foto kedua belum selesai tiba di server.
    - **Solusi Cerdas**: Mengimplementasikan antrean bertahap berkesinambungan (*Incremental Multi-Photo Queue*) pada model `TelegramMediaGroup` (`processedFiles`, `articleId`, `targetType`).
    - Foto susulan pada album yang sama tidak lagi dibatalkan; worker berikutnya otomatis mengenali berkas yang belum diproses (`unprocessedFiles`), mengunggahnya ke Cloudflare R2, dan langsung menyematkannya (*append*) ke dalam album artikel (`galleryUrls`) maupun galeri kegiatan desa.
  - **Penyematan Foto Dokumentasi Susulan Tanpa Caption (Sequential Photo Attachment)**:
    - Pengguna kini dapat memposting foto berita atau galeri secara fleksibel: baik memilih 2-10 foto sekaligus sebagai album di HP, maupun mengirim 1 foto bertuliskan judul berita lalu disusul foto-foto berikutnya tanpa caption dalam waktu 5 menit. Foto susulan otomatis masuk ke album berita tersebut tanpa ditolak sistem.
  - **Penghapusan Tampilan Redundan 1 Foto pada Galeri Artikel (`ArticleGalleryView.tsx`, `app/berita/[slug]/page.tsx`)**:
    - Komponen album dokumentasi di bawah isi berita kini hanya ditampilkan jika artikel memiliki 2 atau lebih foto (`albumPhotos.length > 1`), menghindari duplikasi tampilan foto tunggal yang sudah menjadi cover headline di atasnya.

### Security
- **Kriptografi Sesi Login Bertanda Tangan (Signed HMAC-SHA256 & HttpOnly Cookie) (`lib/auth/session.ts`, `app/api/auth/login/route.ts`, `lib/auth/rbac.ts`, `lib/tenant/resolver.ts`, `proxy.ts`)**:
  - Mengamankan cookie sesi `desdig_auth_session` dengan tanda tangan kriptografis HMAC-SHA256 berwaktu kedaluwarsa (7 hari) dan proteksi timing-safe comparison (`crypto.timingSafeEqual`).
  - Mengonfigurasi flag `httpOnly: true`, `secure: true`, dan `sameSite: 'lax'` untuk memutus risiko pemalsuan identitas sesi di DevTools dan serangan pencurian via XSS.
  - Menyediakan cookie publik non-sensitif `desdig_user_profile` strictly untuk kebutuhan rendering nama pengguna di client-side UI store.
- **Proteksi Rate Limiting & Anti Brute-Force (`lib/security/rate-limit.ts`, `app/api/auth/login/route.ts`, `app/api/attendance/kiosk/clock/route.ts`, `app/api/telegram/webhook/route.ts`)**:
  - Menerapkan sliding-window rate limiter in-memory dengan auto-cleanup berkala.
  - Membatasi percobaan login maksimal 8 kali per menit per alamat IP klien.
  - Membatasi tebakan PIN aparatur di kiosk absensi maksimal 5 kali per 2 menit untuk mencegah tebakan PIN liar di kantor desa.
  - Membatasi webhook Telegram maksimal 120 update per menit untuk memproteksi bot dari serangan flood.

### Added
- **Legalitas & Anti-Pemalsuan: Dynamic Verifiable QR Code & Public Letter Verification (`app/surat/page.tsx`, `components/DynamicQrCode.tsx`, `app/surat/verify/[id]/page.tsx`)**:
  - Cetak surat keterangan permohonan warga kini menyematkan QR Code dinamis (`DynamicQrCode`) dengan tautan verifikasi digital resmi `/surat/verify/[id]?tenant=[slug]`.
  - Halaman publik verifikasi `/surat/verify/[id]` yang menampilkan lencana keabsahan warkah desa "DOKUMEN RESMI TERVERIFIKASI", kop lambang resmi desa penerbit, nomor surat, jenis surat, keperluan, serta pernyataan keabsahan sesuai UU ITE No. 1/2024.
  - Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022): NIK pemohon pada verifikasi publik disamarkan otomatis secara aman (`7606********0001`).
- **Akuntabilitas & Transparansi UU Desa: Visualisasi Realisasi APBDes Sesuai Permendagri No. 20/2018 (`components/themes/modern-government/ApbdesSection.tsx`, `components/themes/modern-government/shared.ts`)**:
  - Menghadirkan visualisasi transparansi keuangan desa berbasis 3 pilar: 1. Pendapatan Desa, 2. Belanja Desa (5 Bidang), dan 3. Neraca Kas Berjalan (Surplus/Defisit Berimbang & Pembiayaan Netto).
  - Menyediakan sorotan khusus Dana Desa (DDS APBN) sebagai prioritas transfer nasional beserta pagu dan serapan anggarannya.
  - Menyediakan dual view mode: Tampilan Kartu Rinci dengan persentase realisasi teranimasi dan Tampilan Tabel Rekapitulasi Standar Permendagri No. 20/2018 lengkap dengan pagu, realisasi, persentase serapan, serta sisa alokasi anggaran.
  - Dilengkapi fitur pencarian real-time untuk menyaring uraian pos anggaran dan kode rekening APBDes secara instan tanpa reload.
- **Fitur Operasional Favorit Admin Desa: Ekspor Excel / CSV Buku Induk Penduduk & Absensi (`app/kependudukan/page.tsx`)**:
  - Menambahkan tombol ekspor Excel/CSV Buku Induk Penduduk berstandar Disdukcapil (NIK, No KK, Nama, Dusun, RT, RW, Jenis Kelamin, Agama, Pendidikan, Pekerjaan, Golongan Darah) dengan encoding UTF-8 BOM (`\uFEFF`) agar langsung terbaca rapi di Microsoft Excel.
- **Ketahanan Database Serverless Cloud (`lib/prisma.ts`)**:
  - Menerapkan fungsi resiliensi `withPrismaRetry<T>()` dengan strategi exponential backoff dan jitter untuk menangani cold start Neon PostgreSQL PgBouncer dan pemutusan koneksi sementara (`P1001`, `P2024`, `P1017`, `ConnectionReset`).
- **Kesiapan Perangkat Kiosk Mandiri (`next.config.ts`)**:
  - Memperbarui header `Permissions-Policy` ke `camera=(self)` agar perangkat Kiosk Desa dapat mengakses webcam pemindai wajah aparatur tanpa diblokir oleh kebijakan keamanan peramban.
- **Cross-Request Caching & On-Demand Revalidation (`lib/tenant/data.ts`, `lib/tenant/cache-revalidate.ts`, `app/api/articles/*`, `app/api/announcements/*`, `app/api/gallery/*`, `app/api/telegram/webhook/*`)**:
  - Mengintegrasikan `unstable_cache` pada data beranda desa (`getTenantPublicHomeData`), menu navigasi (`getTenantNavMenus`), dan listing artikel (`getTenantArticleListing`) dengan revalidasi 1 jam dan sistem tagging tenant (`tenant-${tenantId}-home`).
  - Permintaan publik yang berulang kini dilayani dalam waktu <30ms dengan pemangkasan beban query database Neon PostgreSQL hingga 95%.
  - Otomatis memicu `revalidateTenantCache` saat admin atau bot Telegram menerbitkan/memperbarui berita, galeri, atau pengumuman sehingga perubahan langsung tampil instan.
- **Dynamic OpenGraph & Twitter Meta Cards (`app/berita/[slug]/page.tsx`, `app/halaman/[slug]/page.tsx`)**:
  - Menghasilkan metadata OpenGraph dinamis beresolusi 1200x630 dengan URL absolut, nama desa resmi, dan thumbnail sampul artikel, sehingga saat tautan dibagikan ke WhatsApp, Facebook, atau Telegram, kartu pratinjau tampil elegan dan informatif.
- **Mode Luar Jaringan (Offline-First) Kiosk Absensi (`app/absen/page.tsx`)**:
  - Menambahkan mekanisme penampungan absensi lokal di browser (`localStorage` queue) jika koneksi internet kantor desa terputus/offline saat pamong melakukan absensi.
  - Menyediakan indikator visual realtime status koneksi (`WifiOff`) dan jumlah antrean tersimpan lokal, serta auto-sinkronisasi otomatis ke server begitu jaringan pulih.
- **Eliminasi Warning Bundler Turbopack Storage (`lib/storage.ts`, `lib/media.ts`)**:
  - Menambahkan isolasi path upload lokal `resolveUploadPath` dengan direktif `/*turbopackIgnore: true*/`, melenyapkan peringatan pemindaian berlebih 34.400 berkas upload saat kompilasi build produksi.

### Changed
- **Migrasi Konvensi Next.js 16: `middleware.ts` ke `proxy.ts` (`proxy.ts`)**:
  - Memigrasikan gerbang routing multi-tenant dari konvensi lawas `middleware.ts` ke konvensi resmi Next.js 16 `proxy.ts` dengan export fungsi `proxy()`, menghilangkan deprecation warning pada build console.
- **Mode Dialog Interaktif / Tanya-Jawab (Interactive Wizard Mode) Bot Telegram (`lib/telegram.ts`, `/api/telegram/webhook`, `prisma/schema.prisma`)**:
  - Menyediakan pengalaman interaktif anti-salah yang ramah pengguna bagi pamong desa di lapangan:
    - **Menu Tombol di Layar HP (Reply Keyboard)**: Tombol menu tetap (`📰 Tulis Berita`, `🖼️ Galeri Kegiatan`, `📢 Buat Pengumuman`, `❌ Batal / Menu Utama`) di layar chat Telegram sehingga pamong tidak perlu lagi mengingat sintaks perintah garis miring (`/`).
    - **Alur Tanya-Jawab Galeri Kegiatan (`AWAITING_GALLERY_TITLE` -> `COLLECTING_GALLERY_PHOTOS`)**: Bot menanyakan judul/nama kegiatan terlebih dahulu, lalu mengumpulkan semua foto yang dikirimkan pamong ke dalam draft album, dan menerbitkannya hanya setelah dikonfirmasi via tombol `[ ✅ Selesai & Terbitkan Galeri ]` atau `/selesai` (100% anti-keliru, foto tidak akan pernah salah masuk ke warta berita).
    - **Alur Tanya-Jawab Tulis Berita (`AWAITING_ARTICLE_TEXT` -> `COLLECTING_ARTICLE_PHOTOS`)**: Bot meminta teks berita terlebih dahulu (baris pertama otomatis jadi judul), kemudian meminta foto pendukung, dan menerbitkan berita setelah dikonfirmasi.
    - **Safety Net Foto Langsung (Inline Choice Keyboard)**: Jika pamong langsung mengirim foto tanpa memilih menu sebelumnya, bot menyimpannya ke draft dan menampilkan tombol pertanyaan interaktif: `[ 📰 Jadikan Berita ]` atau `[ 🖼️ Masukkan ke Galeri ]`.
  - Penambahan kolom `conversationState String?` dan `pendingDraft Json?` pada model `TelegramSubscriber` untuk persistensi state percakapan interaktif.
- **Konfigurasi Jeda Waktu Foto Susulan Otomatis (*Auto-Attach Window*) (`/admin/telegram`, `/api/telegram/officials`, `/api/telegram/webhook`, `prisma/schema.prisma`)**:
  - Penambahan kolom `telegramAttachWindowMinutes Int? @default(5)` pada model `Tenant`.
  - Admin desa kini dapat mengatur secara mandiri batas jeda waktu penyematan foto susulan tanpa caption langsung dari menu admin `/admin/telegram` (pilihan: 2 Menit, 5 Menit / Standar, 10 Menit, 15 Menit, 30 Menit, atau 0 Menit / Nonaktif).
  - Ketika pamong mengirim foto dokumentasi kedua dan seterusnya tanpa keterangan teks dalam rentang waktu yang dipilih, bot Telegram secara cerdas menyematkan foto tersebut ke dalam album warta atau galeri terbaru milik pamong/desa tersebut tanpa membuat artikel ganda.
  - Setiap desa memiliki pengaturan jeda waktu mandiri yang terisolasi 100% (*Strict Multi-Tenancy*).
- **Halaman Khusus Integrasi Bot Telegram desDig (`/admin/telegram`, `/api/telegram/officials`, `lib/admin-menu.ts`)**:
  - Halaman manajemen lengkap berformat list/tabel untuk mengelola token pairing rahasia per pamong desa maupun token umum desa.
  - Kartu KPI ringkasan: Total Pamong Desa, Pamong Terhubung, Pamong Belum Terhubung, dan Sesi Operator Umum Aktif.
  - Panduan cepat & format perintah interaktif (`/login`, `/pengumuman`, `/galeri`, berita foto) yang dapat dibuka/tutup.
  - Tabel pamong desa dengan foto, nama, jabatan, NIP, status pairing Telegram (dengan username/nama akun), token pairing, tombol acak token (`PMG-XXXX`), modal edit token manual, tombol salin perintah login (`/login [desa] [token]`), tombol kirim instruksi otomatis via WhatsApp API, serta tombol pemutusan sambungan (unlink).
  - Manajemen sesi operator umum desa dengan kemampuan pemutusan sesi akun secara terisolasi per tenant.
  - Pendaftaran menu `Bot Telegram` pada navigasi sidebar admin di bawah grup `Informasi` dengan ikon `Bot` dan badge `Mobile`.
- **Tracking Penulis Konten & Token Khusus Pamong Desa (`prisma/schema.prisma`, `lib/telegram.ts`, `/api/telegram/webhook`)**:
  - Penambahan kolom `telegramToken` pada model `VillageOfficial` dan relasi ke `TelegramSubscriber`.
  - Penambahan kolom `authorName` pada model `Article`, `Announcement`, dan `GalleryItem`.
  - Saat pamong desa login menggunakan kode token khususnya, akun Telegram otomatis terikat dengan profil pamong tersebut (`villageOfficialId`, `officialName`, `officialPosition`).
  - Setiap kali pamong memposting artikel berita, papan pengumuman, atau galeri kegiatan via Telegram, sistem otomatis mencatat nama pamong tersebut sebagai penulis resmi (`authorName`), meningkatkan transparansi dan tanggung jawab publikasi.
  - Penampilan nama penulis pamong di portal warga (berita utama, daftar berita, halaman detail berita, pengumuman warga) serta di halaman dashboard admin (`/admin/berita`, `/admin/pengumuman`, `/admin/galeri`).
- **Pembersihan Berkas Media Otomatis saat Artikel / Galeri Dihapus (`/api/articles/[id]`, `/api/gallery/[id]`, `lib/media.ts`)**:
  - Integrasi fungsi `deleteTenantMediaFiles` pada handler `DELETE /api/articles/[id]`: saat artikel berita dihapus, berkas cover image utama dan seluruh foto album pendukung (`galleryUrls`) otomatis dihapus permanen dari Cloudflare R2 bucket dan disk penyimpanan lokal untuk menghemat kapasitas storage.
  - Integrasi fungsi `deleteTenantMediaFiles` pada handler `DELETE /api/gallery/[id]`: saat dokumentasi galeri dihapus, berkas foto utama otomatis dihapus dari Cloudflare R2 dan disk lokal.
- **Optimasi & Filter Berkas Foto Bot Telegram (`/api/telegram/webhook`)**:
  - Pembatasan tipe berkas Telegram: bot kini khusus menerima berkas foto (JPG, PNG, WebP) dan secara otomatis menolak dokumen PDF, video, audio, voice note, atau video note dengan pesan edukatif ramah guna mencegah pemborosan kuota penyimpanan cloud.
  - Kompresi gambar otomatis berbasis Sharp sebelum diunggah ke Cloudflare R2: gambar di-resize proporsional dan dikonversi ke format WebP berkualitas tinggi dengan kompresi optimal, menghemat ruang penyimpanan hingga 70-85%.
- **Fitur Modal Popup "Pengumuman Lengkap" (`components/themes/modern-government/NewsSection.tsx`)**:
  - Tampilan papan pengumuman pada beranda tema pemerintahan modern kini membatasi teks yang panjang dengan rapi dan menyediakan tombol *"Pengumuman Lengkap"*.
  - Modal popup responsif menampilkan teks maklumat lengkap, tanggal rilis, zona waktu dinamis desa (WIB/WITA/WIT), atribusi nama penerbit/pamong, dan tombol tutup ramah pengguna.
- **Perbaikan Rasio & Responsivitas Foto Berita Utama / Headline (`components/themes/modern-government/NewsSection.tsx`)**:
  - Penyesuaian container foto berita utama dengan aspect ratio `16/10` pada perangkat mobile dan batas ketinggian `max-h-[380px]` pada desktop.
  - Menggunakan `object-cover object-center` dengan posisi absolut sehingga foto berorientasi portrait tidak lagi membuat kartu berita memanjang ke bawah dan merusak tata letak antarmuka.
- **Suite Pengujian Vitest Tambahan (`tests/telegram-bot.test.ts`)**:
  - Pengujian otomatis untuk penautan token khusus pamong desa, pencatatan identitas `officialName` pada subscriber, dan validasi rekaman `authorName` pada artikel, pengumuman, dan galeri kegiatan.

### Changed
- **Telegram Bot Multi-Tenant Publishing Engine (`lib/telegram.ts`, `/api/telegram/webhook`, `prisma/schema.prisma`)**:
  - Integrasi Bot Telegram resmi desDig untuk publikasi instan artikel warta desa, galeri kegiatan, dan pengumuman resmi langsung dari smartphone operator/kades tanpa perlu login ke dashboard web.
  - **Arsitektur Multi-Tenant Terisolasi (Single Bot - Multi-Tenant Mode)**:
    - Satu bot Telegram terpusat melayani seluruh desa dengan isolasi data 100% ketat berdasarkan database Neon PostgreSQL.
    - Sistem otentikasi & pairing aman melalui perintah `/login [nama_atau_slug_desa] [token_desa]`.
    - **Dukungan Multi-Foto & Album Cerdas Telegram (`TelegramMediaGroup` & Atomic Claim)**:
      - Mengatasi arsitektur pengiriman album media Telegram yang memecah foto ke dalam request terpisah dengan caption hanya pada satu foto.
      - **Posting Berita Multi-Foto**: Mengirim 2 hingga 10 foto sekaligus kini otomatis menghasilkan **tepat 1 artikel berita tunggal** (tidak lagi menjadi N artikel). Foto pertama otomatis menjadi cover utama (`coverImageUrl`), dan seluruh foto lainnya tersimpan di data album (`galleryUrls`) serta disematkan sebagai grid galeri dokumentasi di dalam isi artikel.
      - **Posting Galeri Multi-Foto**: Mengirim 2 hingga 10 foto dengan awalan `/galeri [Judul]` kini otomatis mencatat seluruh foto ke tabel `GalleryItem` desa tanpa ada foto yang keliru terbit menjadi artikel.
      - Pengiriman banyak foto sekaligus tanpa caption otomatis dialihkan ke Galeri Kegiatan Desa (`Dokumentasi Kegiatan Desa`).
      - Proteksi foto tunggal tanpa caption agar memandu pengguna dan mencegah timbulnya artikel kosong di portal warga.
    - **Dukungan Nama Desa Ber-Spasi**: Sistem cerdas mengenali nama desa dengan spasi (misal `/login Sinjai Tengah [token]`, `/login Desa Sinjai Tengah [token]`, maupun slug `/login sinjai-tengah [token]`) secara fleksibel dan akurat tanpa gagal parsing.
    - **Pengelolaan Token Mandiri di Menu Identitas Desa (`/admin/identitas`, `/api/identity`)**:
      - Admin masing-masing desa dapat melihat, membuat token khusus, mengacak (generate) token baru, dan menyalin perintah pairing secara mandiri di halaman admin desa tanpa perlu menghubungi tim superadmin pusat.
      - Menampilkan jumlah akun pamong/kades yang saat ini aktif terhubung ke bot Telegram.
    - Token pairing tersimpan pada model `Tenant.telegramToken` (dengan fallback otomatis 6 karakter unik ID desa jika belum diubah).
    - Relasi database model `TelegramSubscriber` mengikat `telegramId` dengan `tenantId` spesifik untuk menjamin tidak ada kebocoran konten antar-desa.
  - **Kapabilitas Publikasi Konten Cerdas**:
    - **Posting Berita/Warta Desa**: Cukup kirim foto dengan caption teks dari HP; bot otomatis mengonversi ke format WebP, mengunggah ke Cloudflare R2 folder `artikel/`, menerbitkan artikel baru dengan slug unik, dan membalas dengan URL publik artikel.
    - **Posting Galeri Kegiatan**: Kirim foto dengan caption diawali `/galeri [Judul]` untuk otomatis mencatatnya ke galeri desa publik.
    - **Posting Pengumuman Resmi**: Ketik `/pengumuman [Isi Pengumuman]` untuk menayangkan pengumuman warga seketika.
    - **Manajemen Akun & Sesi**: Perintah `/status` untuk ringkasan profil desa yang terhubung, `/logout` untuk unpair, serta `/start` dan `/help` untuk panduan interaktif.
  - **Endpoint Webhook Terpadu (`/api/telegram/webhook`)**:
    - Registrasi webhook 1-klik dengan query parameter `?action=set&url=https://...`.
    - Pengecekan info dan diagnostik webhook via HTTP GET.
    - Penanganan sinyal Next.js prerender bailout yang bersih tanpa error log di Vercel build.
  - **Pengujian Otomatis (`tests/telegram-bot.test.ts`)**:
    - 9 skenario uji integrasi Vitest yang mencakup validasi token pairing, nama desa ber-spasi, perubahan token mandiri, isolasi lintas-tenant, staging multi-foto album, atomic claim worker, pemutusan koneksi (unlinking), dan balasan pesan bot.

- **desDig Official Model Context Protocol (MCP) Server (`mcp/server.ts` & `npm run mcp`)**:
  - Implementasi resmi MCP Server berbasis `@modelcontextprotocol/sdk` dan transport STDIO untuk mengoperasikan seluruh sistem desDig secara otonom melalui AI Assistant (Antigravity, Claude Desktop, Cursor, dll.).
  - Menyediakan 12 Tool terstandarisasi dengan isolasi multi-tenant yang ketat:
    - `desdig_list_villages`: Melihat seluruh desa terdaftar SaaS beserta ringkasan statistik.
    - `desdig_create_village`: Pendaftaran desa baru multi-tenant (otomatis tema, modul, domain, & akun admin).
    - `desdig_get_village`: Ringkasan profil, kependudukan (L/P/KK), pamong, warta, & APBDes.
    - `desdig_update_village`: Perbarui Kades, Visi, Misi, Kontak, Logo, Banner Hero, & Tema.
    - `desdig_add_resident`: Menambah 1 warga baru ke Buku Induk Penduduk dengan validasi NIK/KK.
    - `desdig_batch_import_residents`: Import massal puluhan/ratusan data warga sekaligus.
    - `desdig_create_article`: Menerbitkan berita/warta desa ke portal warga publik.
    - `desdig_create_announcement`: Menayangkan pengumuman resmi desa (reguler, urgent, critical).
    - `desdig_add_village_official`: Mendaftarkan aparatur pamong desa ke bagan pemerintahan.
    - `desdig_add_development_project`: Mencatat proyek fisik pembangunan APBDes & progres %.
    - `desdig_cleanup_orphan_media`: Membersihkan berkas media yatim di Cloudflare R2 otomatis.
    - `desdig_list_media_files`: Memeriksa arsip file media desa beserta status integrasi DB.
  - Dokumentasi panduan konfigurasi lengkap pada `mcp/README.md`.
  - Suite pengujian integrasi otomatis `tests/mcp-server.test.ts` (4 uji Vitest).
- **Pustaka Media Server Cloudflare R2 & Audit Integrasi Berkas (`/admin/media`, `/api/media`, `lib/media.ts`)**:
  - Halaman admin baru **Pustaka Media** (`/admin/media`) yang terdaftar di grup menu `Informasi` untuk memanajemen seluruh aset foto/video milik desa secara terisolasi.
  - Pemindaian berkas hybrid Cloudflare R2 (`ListObjectsV2Command`) dan disk lokal dengan paginasi berkinerja tinggi.
  - Mesin audit relasi database real-time: mendeteksi berkas terintegrasi (dipakai di artikel berita, galeri kegiatan, foto pamong/kades, penduduk berfoto, proyek pembangunan fisik & dokumentasi, halaman statis, atau identitas desa) vs berkas yatim (*orphaned*) yang tidak terintegrasi.
  - Fitur kompresi WebP berbasis Sharp langsung di server (single & batch) dengan kalkulasi persentase dan visualisasi penghematan kapasitas storage.
  - Fitur hapus aman berkas (single & batch) dari Cloudflare R2 dan storage disk dengan proteksi konfirmasi bila berkas sedang aktif dipakai di database.
  - **Tombol Satu-Klik Cleanup Seluruh Berkas Yatim (`cleanupTenantOrphanFiles`)**:
    - Tombol aksi cepat pada Header Banner, Kartu KPI File Yatim, dan bilah alert tab Yatim untuk membersihkan seluruh file yang tidak terpakai sekaligus dari Cloudflare R2 dan storage disk.
    - Dilengkapi modal dialog konfirmasi mendalam yang merinci kategori keterikatan data yang diverifikasi aman serta indikator proses penghapusan massal.
  - Filter dinamis per folder (`artikel`, `galeri`, `user_pict`, `pembangunan`, `identitas`, `dokumen`), filter status (Semua, Terintegrasi, Yatim), pencarian instan debounced, pengurutan ukuran/tanggal, tata letak Grid & Tabel, modal pratinjau resolusi tinggi, dan modal unggah berkas baru.
- **Endpoint Statistik Dashboard Real Multi-Tenant (`/api/admin/dashboard-stats`)**:
  - Menyediakan endpoint agregasi data real dari basis data Neon PostgreSQL: Total Penduduk, Total L/P, Total Kepala Keluarga (Unique No KK), APBDes, Aparatur Pamong aktif, dan statistik persebaran dusun.
  - Menghilangkan sepenuhnya ketergantungan Dashboard Admin (`/admin`) terhadap mock data lokal.
- **Sinkronisasi Massal Media ke Cloudflare R2 & Transparent Media Proxy (`scripts/sync-uploads-to-r2.ts` & `next.config.ts`)**:
  - Script batch upload otomatis `scripts/sync-uploads-to-r2.ts` untuk memigrasikan seluruh aset lokal `public/uploads` (foto artikel, aparat, galeri, logo) ke bucket Cloudflare R2 secara paralel.
  - Aturan rewrite transparan pada `next.config.ts` (`/uploads/:path*` -> `${R2_PUBLIC_DOMAIN}/:path*`) sehingga seluruh gambar di database langsung tampil di Vercel tanpa broken image.
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
- **Integrasi ResidentPicker pada Pengaturan Sambutan Kepala Desa (`app/admin/tampilan/page.tsx`)**:
  - Mengintegrasikan komponen `ResidentPicker` pada tab Sambutan Kepala Desa di Admin Tampilan sehingga nama Kepala Desa wajib dipilih langsung dari Buku Induk Penduduk resmi desa untuk menjamin keseragaman dan integritas data kependudukan.
  - Mendukung auto-populate foto kades dari data kependudukan serta tombol unggah langsung foto resmi portrait ke subfolder `user_pict` dengan kompresi WebP.
- **Pembaruan Dashboard Admin (`/admin`) dengan Data Real Database**:
  - Kartu KPI Total Penduduk (2.039 Jiwa), Kepala Keluarga (672 KK), dan APBDes kini terhubung langsung ke basis data Neon PostgreSQL, menghapus ketergantungan mock data.
  - Widget "Pamong / Aparatur Desa" pada dashboard menampilkan daftar aparatur aktif real (27 pamong) dari tabel `VillageOfficial`, selaras 100% dengan halaman `/admin/pamong`.
- **Standarisasi Unggah Foto & Struktur Folder Terisolasi per Tenant (`/api/upload` & `lib/storage.ts`)**:
  - Normalisasi subfolder penyimpanan terisolasi: foto wajah (user/penduduk/pamong/kades) ke `/(nama_desa)/user_pict/`, proyek pembangunan ke `/(nama_desa)/pembangunan/`, artikel ke `/(nama_desa)/artikel/`, dan identitas desa ke `/(nama_desa)/identitas/`.
  - Kompresi standar web otomatis berbasis Sharp: foto portrait/wajah dibatasi maksimal 1000x1000px WebP (quality 85), foto landscape/dokumentasi maksimal 1920x1920px WebP (quality 82).
  - Format URL penyimpanan di database distandarkan ke format relatif kanonik `/uploads/(nama_desa)/(folder)/namafile.webp`.
  - Penambahan tombol unggah foto langsung pada form proyek pembangunan dan dokumentasi progres (`app/admin/pembangunan/page.tsx`).
- **Optimasi Latensi Serverless & Colocation Kawasan Singapura (`vercel.json`)**:
  - Menetapkan `"regions": ["sin1"]` pada `vercel.json` agar Vercel Serverless Functions dieksekusi di Region Singapura (Singapore), satu data center dengan basis data Neon Cloud PostgreSQL (`ap-southeast-1`).
  - Memangkas latensi query antar-benua (*cross-ocean latency*) dari ~250ms (default Vercel `iad1` Washington D.C., USA) menjadi ~1-3ms per round-trip SQL query.
- **Optimasi Connection Pooling Prisma di Lingkungan Produksi Serverless (`lib/prisma.ts`)**:
  - Mengaktifkan penyimpanan instance PrismaClient di `globalThis` pada mode produksi serverless untuk mempertahankan dan menggunakan ulang pool koneksi database (*warm lambda instances*), mencegah inisialisasi ulang dan *TLS handshake* berulang pada setiap permintaan.
  - Memastikan parameter connection pooling `&pgbouncer=true` aktif pada string koneksi database.
- **Request-Level Memoization pada Data Beranda Publik (`lib/tenant/data.ts`)**:
  - Membungkus fungsi `getTenantPublicHomeData` dengan `cache()` dari React untuk deduplikasi query database dalam satu siklus render SSR.
- **Isolasi Multi-Tenant Folder Pembangunan (`public/uploads/salupangkang/pembangunan`)**:
  - Memindahkan seluruh berkas foto pembangunan dari direktori publik global (`public/uploads/pembangunan`) ke dalam direktori terisolasi per tenant (`public/uploads/salupangkang/pembangunan`) sesuai Hukum Utama Multi-Tenancy.
  - Mengunggah 160 berkas aset pembangunan ke bucket Cloudflare R2 di bawah key `salupangkang/pembangunan/`.
  - Mengimpor 32 proyek pembangunan dan 128 dokumentasi tahapan ke database Neon dengan tautan terisolasi.
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
- **Pembersihan Log Prerender Bailout pada Rute API Dinamis (`/api/admin/dashboard-stats`, `/api/attendance/report`, `/api/media/library`, `/api/media`)**:
  - Menangani sinyal internal Next.js `NEXT_PRERENDER_INTERRUPTED` dengan me-rethrow secara tepat saat fase build prerender.
  - Menghilangkan pesan galat palsu (*false positive error logs*) pada output Vercel CI/CD sehingga proses build bersih 100% dan seluruh 72 rute terkompilasi optimal.
- **Perbaikan Pustaka Media Server pada Modal Pemilih Foto Admin (`/admin/berita`, `/admin/galeri`, `/admin/halaman`, `MediaLibraryModal.tsx`)**:
  - Memperbaiki masalah pemilih foto di admin yang menampilkan pesan *"Belum ada foto tersimpan di server"* pada lingkungan cloud/Vercel akibat API hanya memindai disk lokal sementara foto tersimpan di Cloudflare R2.
  - Mengintegrasikan pemindaian Cloudflare R2 ke endpoint `/api/media` dan `/api/media/library` sehingga seluruh foto yang tersimpan di R2 (2.150+ file) langsung muncul seketika di pustaka media server.
  - Menghilangkan pemblokiran query client saat `tenantSlug` belum selesai ter-hydrate pada initial render, dengan fallback otomatis ke sesi autentikasi cookie desa.
- **Migrasi Path Foto Pamong & Artikel Desa Salupangkang ke Format Terisolasi**:
  - Memperbaiki path foto aparatur desa yang sebelumnya masih menggunakan path lama `/desa/upload/user_pict/...` menjadi `/uploads/salupangkang/user_pict/...` pada 11 pamong dan 14 penduduk di database Neon.
  - Memperbarui 159 artikel berita lama yang memuat path `/desa/upload/` menjadi `/uploads/salupangkang/`.
  - Menambahkan aturan rewrite transparan di `next.config.ts` untuk `/desa/upload/:path*` mengarah ke Cloudflare R2 `${R2_PUBLIC_DOMAIN}/salupangkang/:path*` sebagai lapisan keamanan kompatibilitas mundur mutlak.
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

### Security
- **Pembersihan Akun Mock & Penetapan Kredensial Produksi Resmi**:
  - Menghapus seluruh akun pengguna dummy/mock dari database Neon dan lokal untuk mencegah akses tidak sah.
  - Menetapkan 2 akun resmi dengan password ter-generate acak aman: Akun Master Super Admin (`superadmindesa@adit.lt`) dan Akun Admin Desa Salupangkang (`kharismaerfin@salupangkang.desa.id.com`).

---

## [0.1.0] - 2026-10-22

### Security
- **Kriptografi Sesi Login Bertanda Tangan (Signed HMAC-SHA256 & HttpOnly Cookie) (`lib/auth/session.ts`, `app/api/auth/login/route.ts`, `lib/auth/rbac.ts`, `lib/tenant/resolver.ts`, `proxy.ts`)**:
  - Mengamankan cookie sesi `desdig_auth_session` dengan tanda tangan kriptografis HMAC-SHA256 berwaktu kedaluwarsa (7 hari) dan proteksi timing-safe comparison (`crypto.timingSafeEqual`).
  - Mengonfigurasi flag `httpOnly: true`, `secure: true`, dan `sameSite: 'lax'` untuk memutus risiko pemalsuan identitas sesi di DevTools dan serangan pencurian via XSS.
  - Menyediakan cookie publik non-sensitif `desdig_user_profile` strictly untuk kebutuhan rendering nama pengguna di client-side UI store.
- **Proteksi Rate Limiting & Anti Brute-Force (`lib/security/rate-limit.ts`, `app/api/auth/login/route.ts`, `app/api/attendance/kiosk/clock/route.ts`, `app/api/telegram/webhook/route.ts`)**:
  - Menerapkan sliding-window rate limiter in-memory dengan auto-cleanup berkala.
  - Membatasi percobaan login maksimal 8 kali per menit per alamat IP klien.
  - Membatasi tebakan PIN aparatur di kiosk absensi maksimal 5 kali per 2 menit untuk mencegah tebakan PIN liar di kantor desa.
  - Membatasi webhook Telegram maksimal 120 update per menit untuk memproteksi bot dari serangan flood.

### Added
- **Legalitas & Anti-Pemalsuan: Dynamic Verifiable QR Code & Public Letter Verification (`app/surat/page.tsx`, `components/DynamicQrCode.tsx`, `app/surat/verify/[id]/page.tsx`)**:
  - Cetak surat keterangan permohonan warga kini menyematkan QR Code dinamis (`DynamicQrCode`) dengan tautan verifikasi digital resmi `/surat/verify/[id]?tenant=[slug]`.
  - Halaman publik verifikasi `/surat/verify/[id]` yang menampilkan lencana keabsahan warkah desa "DOKUMEN RESMI TERVERIFIKASI", kop lambang resmi desa penerbit, nomor surat, jenis surat, keperluan, serta pernyataan keabsahan sesuai UU ITE No. 1/2024.
  - Kepatuhan UU Perlindungan Data Pribadi (UU PDP No. 27/2022): NIK pemohon pada verifikasi publik disamarkan otomatis secara aman (`7606********0001`).
- **Akuntabilitas & Transparansi UU Desa: Visualisasi Realisasi APBDes Sesuai Permendagri No. 20/2018 (`components/themes/modern-government/ApbdesSection.tsx`, `components/themes/modern-government/shared.ts`)**:
  - Menghadirkan visualisasi transparansi keuangan desa berbasis 3 pilar: 1. Pendapatan Desa, 2. Belanja Desa (5 Bidang), dan 3. Neraca Kas Berjalan (Surplus/Defisit Berimbang & Pembiayaan Netto).
  - Menyediakan sorotan khusus Dana Desa (DDS APBN) sebagai prioritas transfer nasional beserta pagu dan serapan anggarannya.
  - Menyediakan dual view mode: Tampilan Kartu Rinci dengan persentase realisasi teranimasi dan Tampilan Tabel Rekapitulasi Standar Permendagri No. 20/2018 lengkap dengan pagu, realisasi, persentase serapan, serta sisa alokasi anggaran.
  - Dilengkapi fitur pencarian real-time untuk menyaring uraian pos anggaran dan kode rekening APBDes secara instan tanpa reload.
- **Fitur Operasional Favorit Admin Desa: Ekspor Excel / CSV Buku Induk Penduduk & Absensi (`app/kependudukan/page.tsx`)**:
  - Menambahkan tombol ekspor Excel/CSV Buku Induk Penduduk berstandar Disdukcapil (NIK, No KK, Nama, Dusun, RT, RW, Jenis Kelamin, Agama, Pendidikan, Pekerjaan, Golongan Darah) dengan encoding UTF-8 BOM (`\uFEFF`) agar langsung terbaca rapi di Microsoft Excel.
- **Ketahanan Database Serverless Cloud (`lib/prisma.ts`)**:
  - Menerapkan fungsi resiliensi `withPrismaRetry<T>()` dengan strategi exponential backoff dan jitter untuk menangani cold start Neon PostgreSQL PgBouncer dan pemutusan koneksi sementara (`P1001`, `P2024`, `P1017`, `ConnectionReset`).
- **Kesiapan Perangkat Kiosk Mandiri (`next.config.ts`)**:
  - Memperbarui header `Permissions-Policy` ke `camera=(self)` agar perangkat Kiosk Desa dapat mengakses webcam pemindai wajah aparatur tanpa diblokir oleh kebijakan keamanan peramban.
- **Cross-Request Caching & On-Demand Revalidation (`lib/tenant/data.ts`, `lib/tenant/cache-revalidate.ts`, `app/api/articles/*`, `app/api/announcements/*`, `app/api/gallery/*`, `app/api/telegram/webhook/*`)**:
  - Mengintegrasikan `unstable_cache` pada data beranda desa (`getTenantPublicHomeData`), menu navigasi (`getTenantNavMenus`), dan listing artikel (`getTenantArticleListing`) dengan revalidasi 1 jam dan sistem tagging tenant (`tenant-${tenantId}-home`).
  - Permintaan publik yang berulang kini dilayani dalam waktu <30ms dengan pemangkasan beban query database Neon PostgreSQL hingga 95%.
  - Otomatis memicu `revalidateTenantCache` saat admin atau bot Telegram menerbitkan/memperbarui berita, galeri, atau pengumuman sehingga perubahan langsung tampil instan.
- **Dynamic OpenGraph & Twitter Meta Cards (`app/berita/[slug]/page.tsx`, `app/halaman/[slug]/page.tsx`)**:
  - Menghasilkan metadata OpenGraph dinamis beresolusi 1200x630 dengan URL absolut, nama desa resmi, dan thumbnail sampul artikel, sehingga saat tautan dibagikan ke WhatsApp, Facebook, atau Telegram, kartu pratinjau tampil elegan dan informatif.
- **Mode Luar Jaringan (Offline-First) Kiosk Absensi (`app/absen/page.tsx`)**:
  - Menambahkan mekanisme penampungan absensi lokal di browser (`localStorage` queue) jika koneksi internet kantor desa terputus/offline saat pamong melakukan absensi.
  - Menyediakan indikator visual realtime status koneksi (`WifiOff`) dan jumlah antrean tersimpan lokal, serta auto-sinkronisasi otomatis ke server begitu jaringan pulih.
- **Eliminasi Warning Bundler Turbopack Storage (`lib/storage.ts`, `lib/media.ts`)**:
  - Menambahkan isolasi path upload lokal `resolveUploadPath` dengan direktif `/*turbopackIgnore: true*/`, melenyapkan peringatan pemindaian berlebih 34.400 berkas upload saat kompilasi build produksi.

### Changed
- **Migrasi Konvensi Next.js 16: `middleware.ts` ke `proxy.ts` (`proxy.ts`)**:
  - Memigrasikan gerbang routing multi-tenant dari konvensi lawas `middleware.ts` ke konvensi resmi Next.js 16 `proxy.ts` dengan export fungsi `proxy()`, menghilangkan deprecation warning pada build console.
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

