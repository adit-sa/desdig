# Changelog - desDig (desa Digital)

Semua perubahan, penambahan fitur, perbaikan bug, dan pembaruan arsitektur pada aplikasi **desDig (desa Digital)** dicatat secara berkala dalam dokumen ini.

Format dokumen ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi standar [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased]

### Fixed
- **Penyempurnaan Pemrosesan Multi-Foto & Album Telegram (`TelegramMediaGroup`, `lib/telegram.ts`, `/api/telegram/webhook`)**:
  - Mengatasi akar masalah kegagalan pengiriman 2 atau lebih foto di mana hanya 1 foto yang tercatat/tampil:
    - **Penyebab Awal**: Timer tunggu 1.2 detik terlalu cepat bagi Telegram yang sering kali mengirimkan foto-foto dalam album dengan jeda 2 hingga 6 detik melalui request webhook paralel, sehingga worker pertama mengklaim status `processed: true` saat foto kedua belum selesai tiba di server.
    - **Solusi Cerdas**: Mengimplementasikan antrean bertahap berkesinambungan (*Incremental Multi-Photo Queue*) pada model `TelegramMediaGroup` (`processedFiles`, `articleId`, `targetType`).
    - Foto susulan pada album yang sama tidak lagi dibatalkan; worker berikutnya otomatis mengenali berkas yang belum diproses (`unprocessedFiles`), mengunggahnya ke Cloudflare R2, dan langsung menyematkannya (*append*) ke dalam album artikel (`galleryUrls`) maupun galeri kegiatan desa.
  - **Penyematan Foto Dokumentasi Susulan Tanpa Caption (Sequential Photo Attachment)**:
    - Pengguna kini dapat memposting foto berita atau galeri secara fleksibel: baik memilih 2-10 foto sekaligus sebagai album di HP, maupun mengirim 1 foto bertuliskan judul berita lalu disusul foto-foto berikutnya tanpa caption dalam waktu 5 menit. Foto susulan otomatis masuk ke album berita tersebut tanpa ditolak sistem.
  - **Penghapusan Tampilan Redundan 1 Foto pada Galeri Artikel (`ArticleGalleryView.tsx`, `app/berita/[slug]/page.tsx`)**:
    - Komponen album dokumentasi di bawah isi berita kini hanya ditampilkan jika artikel memiliki 2 atau lebih foto (`albumPhotos.length > 1`), menghindari duplikasi tampilan foto tunggal yang sudah menjadi cover headline di atasnya.

### Added
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

