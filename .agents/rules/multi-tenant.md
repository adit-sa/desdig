# Multi-Tenancy & Code Integrity Rules (HUKUM UTAMA PROYEK)

## 1. Identitas Proyek: 100% Multi-Tenant
Aplikasi ini adalah **Platform Multi-Tenant SaaS Portal Desa**. Satu aplikasi melayani banyak desa dengan database bersama yang terisolasi ketat.

## 2. Larangan Keras Hardcode (Zero Hardcode Policy)
- **DILARANG KERAS** menulis nama desa secara statis (seperti `salupangkang`, `sukamaju`, atau nama desa apa pun) di dalam komponen tema, template, helper, atau API.
- **DILARANG KERAS** meng-hardcode nama Kepala Desa (seperti `H. Sapiil`), NIP, nomor telepon, link aduan (`bit.ly/...`), link Google Drive, atau akun media sosial milik desa tertentu.
- **DILARANG KERAS** meng-hardcode zona waktu (`WITA` atau `WIB` statis). Selalu gunakan helper dinamis:
  `getTimezoneByProvince(tenant.provinsi)`
- **DILARANG KERAS** meng-hardcode angka statistik (jumlah penduduk, KK, IDM, atau APBDes) jika data belum ada. Gunakan konfigurasi tenant `themeConfig.stats` atau nilai riil dari database.

## 3. Database & Prisma Schema Rules
- Setiap tabel model baru yang menyimpan data milik desa (artikel, agenda, pengumuman, lapak, produk, absensi, pembangunan, halaman, dll.) **WAJIB** memiliki kolom:
  `tenantId String`
  `tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)`
- Setiap entitas berslug wajib memiliki unique constraint gabungan:
  `@@unique([tenantId, slug])`
- Setiap query Prisma **WAJIB** menyertakan filter `tenantId` (atau dicari via resolver `resolveTenant`).

## 4. API Routes & Server Actions
- Semua route handler di `/api/...` wajib memvalidasi dan membatasi data hanya untuk tenant yang bersangkutan (`where: { tenantId: tenant.id }`).
- Untuk endpoint publik yang menerima `?tenant=slug`, dukung pencarian ganda:
  `tenant = await prisma.tenant.findFirst({ where: { OR: [{ slug }, { id }] } })`

## 5. Frontend & Tautan Publik
- Seluruh navigasi publik ke halaman internal wajib menyertakan identitas tenant:
  Gunakan `buildTenantHref(url, tenant.slug)` atau tambahkan query `?tenant=${tenant.slug}`.
- Jangan gunakan gambar default bertuliskan nama desa tertentu sebagai fallback permanen. Gunakan logo tenant `tenant.logoUrl`, `tenant.heroImageUrl`, atau foto lanskap netral.

## 6. Standar Terminologi
- Gunakan istilah **"Absensi"** untuk pencatatan kehadiran aparatur/perangkat desa. **JANGAN** gunakan "Presensi".
