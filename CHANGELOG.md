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

### Fixed
- **Sinkronisasi Reorder Posisi Modul Beranda & Cache Revalidation (`app/api/theme/route.ts`, `components/themes/ModernGovernmentTheme.tsx`, `components/themes/modern-government/*`, `app/admin/tampilan/page.tsx`)**:
  - Memperbaiki kendala pengurutan modul beranda yang tidak berubah di portal publik akibat absennya `revalidateTenantCache(tenant.id)` pada endpoint `POST /api/theme`, sehingga peramban menyajikan cache lama selama 1 jam.
  - Mengubah arsitektur penyusunan section di tema utama (`ModernGovernmentTheme.tsx`) agar seluruh modul beranda (`stats`, `quick_links`, `pamong`, `berita`, `apbdes`, `pembangunan`, `galeri`) dirender secara dinamis mengikuti urutan asli array `sectionsOrder` dari database, menghapus ketergantungan rapuh pada CSS flexbox `order`.
  - Menghapus hardcoded `style={{ order: -1 }}` pada `ProfileSection.tsx`, menyesuaikan spacing mengambang dinamis `isFirst` pada `StatsSection.tsx`, dan menambahkan tombol simpan langsung di bawah tabel urutan modul di `app/admin/tampilan/page.tsx`.
- **Hydration Mismatch pada Tautan Beranda Papan Pengumuman Admin (`app/admin/pengumuman/page.tsx`)**:
  - Memperbaiki peringatan/error hidrasi React pada elemen `<a>` shortcut *"Lihat Hasil di Beranda"* dengan menambahkan flag `suppressHydrationWarning`, guard `mounted`, serta fallback rute `#berita` saat slug tenant disinkronisasikan dari client-side store ke peramban.

### Added
- **Penyederhanaan Total Manajemen Modul: Antarmuka Terpadu 1 Halaman dengan Akordeon Kustomisasi per Modul (`app/admin/modul/page.tsx`, `app/admin/tampilan/page.tsx`)**:
  - Menggabungkan pengaturan urutan posisi modul, lisensi paket sistem, status aktif/nonaktif, dan panel kustomisasi ke dalam **satu halaman ringkas tanpa tab terpisah** di [Admin > Modul](file:///c:/app/opensid/app/admin/modul/page.tsx).
  - Mengimplementasikan sistem **Kustomisasi On-Demand (Expandable Accordion)**: Tombol *"Kustomisasi"* pada tiap baris modul hanya akan membuka sub-panel pengaturan khusus untuk modul tersebut saat diklik, menjaga tampilan tetap bersih, rapi, dan tidak memanjang ke bawah.
  - Setiap modul memiliki panel kustomisasi mandirinya sendiri:
    - **Pusat Pelayanan & Informasi Publik (`quick_links`)**: Editor interaktif kartu tautan layanan, ubah teks, ganti ikon Lucide, aksen warna, tambah/hapus tautan, atur urutan kartu, dan reset default.
    - **Maklumat & Pengumuman Desa (`pengumuman`)**: Pengaturan pengumuman per slide (1 atau 2 slide) dan kuota total tayang di beranda beserta tautan langsung ke CMS Pengumuman.
    - **Warta & Berita Desa (`berita`)**: Kuota tayang artikel warta di beranda (3, 4, 5, atau 6 berita) dan tautan ke CMS Berita.
    - **Galeri Foto & Dokumentasi (`galeri`)**: Jumlah foto beranda (3, 4, 6, atau 8 foto) dan tautan ke CMS Galeri.
    - **Statistik Kependudukan & IDM (`stats`)**: Input manual statistik penduduk, keluarga, luas wilayah, serta skor IDM.
    - **Modul Data Master (Pamong, APBDes, Pembangunan, Lapak, Profil Visi Misi)**: Status sinkronisasi otomatis dan tombol pintas 1 klik ke data master masing-masing.
  - Satu tombol simpan global terpadu yang langsung menyinkronkan seluruh perubahan ke database tenant dan merevalidasi cache beranda secara instan.
- **Kustomisasi Penuh Tombol & Tautan Modul Pusat Pelayanan & Informasi Publik Desa (`components/themes/modern-government/QuickLinksSection.tsx`, `components/themes/ModernGovernmentTheme.tsx`, `app/admin/tampilan/page.tsx`)**:
  - Memberikan kebebasan penuh bagi admin desa untuk mengedit setiap tombol/kartu layanan mandiri yang ada di halaman utama (mengubah judul, deskripsi, tautan URL tujuan, ikon, aksen warna, dan target jendela peramban).
  - Menambahkan fitur penambahan tautan baru (`+ Tambah Tautan Baru`), pengaturan urutan naik/turun (`▲` / `▼`), penghapusan kartu, serta opsi pemulihan (`Reset Default`) ke 6 tombol standar sistem di menu [Admin > Tampilan](file:///c:/app/opensid/app/admin/tampilan/page.tsx).
  - Mendukung variabel dinamis `{tenant}` pada kolom URL agar tautan internal desa (seperti `/layanan?tenant={tenant}`) tetap 100% aman dan multi-tenant tanpa hardcode.
  - Menghubungkan konfigurasi `themeConfig.quick_links` dari database tenant secara dinamis ke [QuickLinksSection.tsx](file:///c:/app/opensid/components/themes/modern-government/QuickLinksSection.tsx), lengkap dengan nilai fallback otomatis jika admin belum mengisinya.
  - Memperjelas penamaan label modul pada daftar urutan menjadi *"Pusat Pelayanan & Layanan Mandiri (Akses Cepat)"* agar admin dapat mengenali modul ini dengan mudah saat mengatur urutan dan visibilitas di beranda.
- **Pengaturan Posisi & Visibilitas Modul Visi Pembangunan & Misi Kerja (`app/admin/tampilan/page.tsx`, `components/themes/ModernGovernmentTheme.tsx`)**:
  - Menjadikan modul **Visi Pembangunan & Misi Kerja (`profile`)** sebagai salah satu modul dinamis yang dapat digeser naik/turun dan diaktifkan/dinonaktifkan posisinya di beranda via menu [Admin > Tampilan](file:///c:/app/opensid/app/admin/tampilan/page.tsx).
  - Menyediakan fallback penyisipan alami setelah modul Layanan Mandiri (`quick_links`) untuk konfigurasi tenant eksisting, serta integrasi render dinamis murni di [ModernGovernmentTheme.tsx](file:///c:/app/opensid/components/themes/ModernGovernmentTheme.tsx).
- **Pengaturan Tampilan Slide & Kuota Tayang Pengumuman di Halaman Utama (`app/admin/pengumuman/page.tsx`, `app/api/announcements/route.ts`, `app/admin/tampilan/page.tsx`, `components/themes/*`, `lib/tenant/data.ts`)**:
  - Menambahkan pengaturan jumlah pengumuman yang tampil **per slide** (`announcement_per_slide`: 1 per slide, 2 per slide, dst.) di [app/admin/pengumuman/page.tsx](file:///c:/app/opensid/app/admin/pengumuman/page.tsx) dan [app/admin/tampilan/page.tsx](file:///c:/app/opensid/app/admin/tampilan/page.tsx), sehingga admin desa bebas memilih apakah ingin menampilkan 1 pengumuman besar/fokus per slide atau 2 pengumuman bertingkat berdampingan per slide.
  - Menghubungkan variabel `announcementPerSlide` secara dinamis ke komponen slider maklumat di tema utama ([components/themes/modern-government/NewsSection.tsx](file:///c:/app/opensid/components/themes/modern-government/NewsSection.tsx)), mengatur pembagian halaman slide (`totalAnnouncementPages = Math.ceil(activeAnnouncements.length / perSlide)`), pemotongan data slide (`.slice(page * perSlide, page * perSlide + perSlide)`), serta auto-scroll otomatis.
  - Menambahkan panel kontrol kuota total tayang pengumuman beranda dengan preset instan (2, 3, 4, 6, 8), stepper (+/-) fleksibel 1–20 item, simulasi visual perhitungan slide, serta tautan langsung pratinjau beranda.
  - Mengimplementasikan endpoint `PATCH /api/announcements` untuk menyimpan `announcement_per_slide` dan `homepage_announcement_count` pada `TenantThemeConfig` lengkap dengan audit logging dan `revalidateTenantCache` tanpa jeda.
  - Memperluas query pengumuman beranda di [lib/tenant/data.ts](file:///c:/app/opensid/lib/tenant/data.ts) hingga 20 pengumuman aktif agar mencukupi kuota dinamis yang diatur admin.
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
- **Penyempurnaan Format & Tata Letak Pencetakan Surat Dinas A4 (`app/surat/page.tsx`, `components/AdminLayoutWrapper.tsx`, `components/Navbar.tsx`, `components/Sidebar.tsx`, `app/globals.css`, `lib/formatters.ts`)**:
  - **Eliminasi Elemen UI Saat Cetak**: Menambahkan `print:hidden` pada `Navbar`, `Sidebar`, tombol aksi, dan navigasi tab, serta menghapus padding/background pada `AdminLayoutWrapper` saat pencetakan berlangsung sehingga hanya lembar warkah resmi yang dicetak di atas kertas fisik.
  - **Kepatuhan Tata Naskah Dinas Permendagri No. 1/2023**:
    - **Kop Surat Dinas Resmi**: Lambang/Logo Desa di sisi kiri sejajar dengan hierarki 3 tingkat (Pemerintah Kabupaten, Kecamatan, Kantor Kepala Desa), alamat kantor, kontak, dan website, diakhiri dengan garis ganda naskah dinas resmi (garis tebal 3px dan garis tipis 1px).
    - **Tabel Biodata Aligned**: Menggunakan semantic `<table>` dengan lebar kolom presisi (`w-48`, `w-4`) sehingga tanda titik dua (`:`) pada 9 poin data kependudukan lurus sempurna tanpa geser di seluruh peramban dan PDF printer.
    - **Format Tanggal Bahasa Indonesia Baku**: Menambahkan helper `formatTanggalIndo` di `lib/formatters.ts` untuk menampilkan tanggal surat dan tanggal lahir warga dalam ejaan baku (misal: "18 Oktober 2026").
    - **Standar Kertas A4 & Proteksi Halaman Tunggal**: Menambahkan `@media print { @page { size: A4 portrait; margin: 15mm 20mm; } }` dan class `.print-sheet-a4` dengan `break-inside: avoid` agar surat keterangan pas dalam 1 lembar kertas A4 tanpa tumpah ke halaman kedua.
    - **Quick Selector & Toolbar**: Menyediakan dropdown pemilih surat langsung dari layar pratinjau cetak dan tombol kembali ke daftar arsip.
- **Pembersihan Over-Engineering & Transisi ke Platform Native (`components/themes/modern-government/ScrollEffects.tsx`, `app/globals.css`, `package.json`)**:
  - Menghapus dependensi pihak ketiga `lenis` (~20 KB bundle) dan loop RAF dinamis, beralih 100% ke native CSS `scroll-behavior: smooth` dan lightweight `window.requestAnimationFrame` handler.
  - Menghapus CSS overhead `.lenis*` di `app/globals.css`.

### Removed
- **Pembersihan Berkas Mati & Penghematan Token AI (`lib/prisma-client*`)**:
  - Menghapus 4 direktori lama sisa eksperimen generator (`lib/prisma-client/`, `lib/prisma-client-v2/`, `lib/prisma-client-v3/`, `lib/prisma-client-v4/`) yang memakan **378 MB** dan lebih dari 120.000 baris kode mati, membebaskan ruang disk dan mempercepat pemindaian token AI.

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
