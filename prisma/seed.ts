import { PrismaClient, GlobalRole, TenantRole, PlanTier, SubscriptionStatus, ContentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding data Multi-Tenant Website Desa...');

  // 1. Bersihkan data sebelumnya jika ada
  await prisma.auditLog.deleteMany();
  await prisma.apbdesItem.deleteMany();
  await prisma.publicDocument.deleteMany();
  await prisma.villageOfficial.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tenantModule.deleteMany();
  await prisma.tenantThemeConfig.deleteMany();
  await prisma.tenantMembership.deleteMany();
  await prisma.domain.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.module.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const sukamajuPasswordHash = await bcrypt.hash('sukamaju123', 10);
  const salupangkangPasswordHash = await bcrypt.hash('salupangkang123', 10);

  // 3. Subscription Plans (SaaS)
  const basicPlan = await prisma.subscriptionPlan.create({
    data: {
      code: PlanTier.BASIC,
      name: 'Paket Starter',
      description: 'Cocok untuk desa perintis yang baru memulai digitalisasi informasi publik.',
      priceMonthly: 150000,
      maxArticles: 30,
      maxStorageMb: 250,
      customDomain: false,
      allowedModules: ['profile', 'news', 'announcements', 'gallery', 'ppid'],
    },
  });

  const proPlan = await prisma.subscriptionPlan.create({
    data: {
      code: PlanTier.PROFESSIONAL,
      name: 'Paket Pro Desa Mandiri',
      description: 'Fitur lengkap termasuk transparansi APBDes, direktori UMKM, potensi wisata, dan custom domain.',
      priceMonthly: 350000,
      maxArticles: 200,
      maxStorageMb: 1500,
      customDomain: true,
      allowedModules: [
        'profile', 'news', 'announcements', 'events', 'gallery', 
        'documents', 'tourism', 'umkm', 'apbdes', 'complaints', 
        'services', 'statistics', 'ppid', 'seo', 'analytics'
      ],
    },
  });

  const enterprisePlan = await prisma.subscriptionPlan.create({
    data: {
      code: PlanTier.ENTERPRISE,
      name: 'Paket Enterprise Smart Village',
      description: 'Kapasitas tak terbatas, prioritas SLA bantuan teknis, dan dukungan multi-domain.',
      priceMonthly: 750000,
      maxArticles: 1000,
      maxStorageMb: 10000,
      customDomain: true,
      allowedModules: [
        'profile', 'news', 'announcements', 'events', 'gallery', 
        'documents', 'tourism', 'umkm', 'apbdes', 'complaints', 
        'services', 'statistics', 'ppid', 'seo', 'analytics'
      ],
    },
  });

  // 4. Registry 3 Tema Perdana
  await prisma.theme.createMany({
    data: [
      {
        id: 'modern-government',
        name: 'Modern Government',
        version: '1.0.0',
        description: 'Tampilan resmi dan berwibawa dengan palet hijau zamrud & biru navy khas instansi pemerintahan modern.',
        previewImageUrl: '/themes/modern-government-preview.jpg',
        isSystem: true,
      },
      {
        id: 'traditional-village',
        name: 'Traditional Village',
        version: '1.0.0',
        description: 'Sentuhan kehangatan alam pedesaan, aksen kayu nusantara, dan ornamen kearifan lokal.',
        previewImageUrl: '/themes/traditional-village-preview.jpg',
        isSystem: true,
      },
      {
        id: 'modern-editorial',
        name: 'Modern Editorial',
        version: '1.0.0',
        description: 'Tipografi berita yang tegas dengan layout berbasis kartu cerita dan publikasi jurnalisme warga.',
        previewImageUrl: '/themes/modern-editorial-preview.jpg',
        isSystem: true,
      },
    ],
  });

  // 5. Registry 15 Modul Plugin
  const moduleList = [
    { key: 'profile', name: 'Profil & Struktur Desa', description: 'Visi misi, sejarah, demografi, dan struktur aparatur desa.', isCore: true },
    { key: 'news', name: 'Berita & Artikel Desa', description: 'Publikasi warta kegiatan, kabar warga, dan liputan desa.', isCore: true },
    { key: 'announcements', name: 'Papan Pengumuman', description: 'Pengumuman resmi surat edaran, imbauan, dan kerja bakti.', isCore: true },
    { key: 'events', name: 'Agenda & Kalender Kegiatan', description: 'Jadwal musrenbang, posyandu, dan festival desa.', isCore: false },
    { key: 'gallery', name: 'Galeri Foto & Dokumentasi', description: 'Dokumentasi visual foto dan album kegiatan kemasyarakatan.', isCore: false },
    { key: 'documents', name: 'Dokumen & Peraturan Desa', description: 'Publikasi Perdes, SK Kades, dan arsip publik.', isCore: false },
    { key: 'tourism', name: 'Potensi & Wisata Desa', description: 'Destinasi wisata alam, budaya, dan sentra kerajinan.', isCore: false },
    { key: 'umkm', name: 'Direktori UMKM Warga', description: 'Katalog etalase produk lokal binaan desa.', isCore: false },
    { key: 'apbdes', name: 'Transparansi APBDes', description: 'Grafik infografis pendapatan dan realisasi belanja anggaran desa.', isCore: false },
    { key: 'complaints', name: 'Layanan Pengaduan Warga', description: 'Kanal aspirasi dan pelaporan keluhan fasilitas umum.', isCore: false },
    { key: 'services', name: 'Layanan Mandiri Surat', description: 'Permohonan surat pengantar administrasi kependudukan online.', isCore: false },
    { key: 'statistics', name: 'Statistik Kependudukan', description: 'Visualisasi piramida usia, pekerjaan, dan pendidikan warga.', isCore: false },
    { key: 'ppid', name: 'Keterbukaan Informasi PPID', description: 'Standar regulasi UU Keterbukaan Informasi Publik.', isCore: true },
    { key: 'seo', name: 'Optimasi Mesin Pencari (SEO)', description: 'Pengaturan meta tag, sitemap XML, dan OpenGraph per desa.', isCore: false },
    { key: 'analytics', name: 'Statistik Pengunjung', description: 'Metrik statistik pembaca berita dan lalu lintas situs.', isCore: false },
  ];

  for (const m of moduleList) {
    await prisma.module.create({
      data: {
        key: m.key,
        name: m.name,
        description: m.description,
        isCore: m.isCore,
        requiredRole: TenantRole.EDITOR,
      },
    });
  }

  // 6. Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Administrator',
      email: 'superadmin@platform.desa.id',
      passwordHash: defaultPasswordHash,
      globalRole: GlobalRole.SUPER_ADMIN,
    },
  });

  // 7. Demo Tenant 1: DESA SUKAMAJU (Tema: Modern Government)
  const tenantSukamaju = await prisma.tenant.create({
    data: {
      slug: 'sukamaju',
      kodeDesa: '32.05.11.2001',
      namaDesa: 'Sukamaju',
      kecamatan: 'Cilawu',
      kabupaten: 'Garut',
      provinsi: 'Jawa Barat',
      kodePos: '44181',
      alamatKantor: 'Jl. Raya Garut-Tasik KM 12 No. 45, Desa Sukamaju',
      email: 'kontak@desasukamaju.id',
      telepon: '0262-234567',
      kepalaDesa: 'H. Ahmad Suryadi, S.Sos.',
      visi: 'Mewujudkan Desa Sukamaju yang Maju, Mandiri, Agamis, dan Sejahtera Berbasis Teknologi.',
      misi: [
        'Meningkatkan tata kelola pemerintahan desa yang transparan, akuntabel, dan melayani.',
        'Mendorong hilirisasi pertanian dan penguatan UMKM unggulan desa.',
        'Mengoptimalkan digitalisasi layanan publik untuk mempermudah administrasi warga.',
      ],
      logoUrl: '/images/logo-desa.png',
      activeThemeId: 'modern-government',
      planId: proPlan.id,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  // Domain Sukamaju
  await prisma.domain.createMany({
    data: [
      { tenantId: tenantSukamaju.id, domain: 'sukamaju.localhost:3000', isPrimary: true, isVerified: true },
      { tenantId: tenantSukamaju.id, domain: 'sukamaju.desaku.id', isPrimary: false, isVerified: true },
      { tenantId: tenantSukamaju.id, domain: 'www.desasukamaju.id', isPrimary: false, isVerified: true },
    ],
  });

  // Admin Desa Sukamaju
  const adminSukamaju = await prisma.user.create({
    data: {
      name: 'Budi Raharjo',
      email: 'admin@sukamaju.desa.id',
      passwordHash: sukamajuPasswordHash,
      globalRole: GlobalRole.USER,
    },
  });

  await prisma.tenantMembership.create({
    data: {
      tenantId: tenantSukamaju.id,
      userId: adminSukamaju.id,
      role: TenantRole.VILLAGE_ADMIN,
    },
  });

  // Konfigurasi Tema Sukamaju
  await prisma.tenantThemeConfig.create({
    data: {
      tenantId: tenantSukamaju.id,
      themeId: 'modern-government',
      isPublished: true,
      settings: {
        primaryColor: '#047857', // emerald-700
        accentColor: '#0f766e',  // teal-700
        headerStyle: 'standard',
        heroStyle: 'carousel',
        showStats: true,
        showApbdes: true,
      },
    },
  });

  // Pamong Desa Sukamaju
  await prisma.villageOfficial.createMany({
    data: [
      { tenantId: tenantSukamaju.id, name: 'H. Ahmad Suryadi, S.Sos.', position: 'Kepala Desa', orderIndex: 1, isActive: true },
      { tenantId: tenantSukamaju.id, name: 'Siti Rahmawati, S.AP.', position: 'Sekretaris Desa', orderIndex: 2, isActive: true },
      { tenantId: tenantSukamaju.id, name: 'Bambang Irawan', position: 'Kaur Keuangan', orderIndex: 3, isActive: true },
      { tenantId: tenantSukamaju.id, name: 'Asep Kusnadi', position: 'Kasi Pemerintahan', orderIndex: 4, isActive: true },
    ],
  });

  // Kategori & Artikel Sukamaju
  const catPembangunan = await prisma.category.create({
    data: { tenantId: tenantSukamaju.id, name: 'Pembangunan', slug: 'pembangunan' },
  });
  const catEkonomi = await prisma.category.create({
    data: { tenantId: tenantSukamaju.id, name: 'Ekonomi Warga', slug: 'ekonomi-warga' },
  });

  await prisma.article.createMany({
    data: [
      {
        tenantId: tenantSukamaju.id,
        authorId: adminSukamaju.id,
        categoryId: catPembangunan.id,
        title: 'Pembangunan Saluran Irigasi Blok Cikadu Selesai 100%',
        slug: 'pembangunan-saluran-irigasi-blok-cikadu-selesai-100',
        summary: 'Proyek padat karya tunai saluran irigasi seluas 250 meter kini mengalirkan air ke 40 hektare sawah warga.',
        content: '<p>Pemerintah Desa Sukamaju bersama warga telah merampungkan pembangunan irigasi tersier di Blok Cikadu. Program ini didanai oleh Dana Desa tahun anggaran 2026 dan menyerap tenaga kerja lokal sebanyak 45 orang.</p>',
        status: ContentStatus.PUBLISHED,
        viewCount: 142,
      },
      {
        tenantId: tenantSukamaju.id,
        authorId: adminSukamaju.id,
        categoryId: catEkonomi.id,
        title: 'Pelatihan Digital Marketing UMKM Keripik Pisang Sukamaju',
        slug: 'pelatihan-digital-marketing-umkm-keripik-pisang-sukamaju',
        summary: 'Puluhan pelaku usaha rumahan dilatih memasarkan produk lokal ke marketplace nasional.',
        content: '<p>Mendorong daya saing produk lokal, Desa Sukamaju mengadakan workshop packaging dan pemasaran online bekerja sama dengan dinas koperasi setempat.</p>',
        status: ContentStatus.PUBLISHED,
        viewCount: 89,
      },
    ],
  });

  // Pengumuman Sukamaju
  await prisma.announcement.create({
    data: {
      tenantId: tenantSukamaju.id,
      title: 'Jadwal Kerja Bakti Kebersihan Lingkungan dan Saluran Air',
      content: 'Diimbau kepada seluruh Ketua RT/RW dan warga untuk melaksanakan kerja bakti serentak pada hari Minggu pukul 07.00 WIB.',
      isPinned: true,
      status: ContentStatus.PUBLISHED,
    },
  });

  // APBDes Sukamaju
  await prisma.apbdesItem.createMany({
    data: [
      { tenantId: tenantSukamaju.id, year: 2026, category: 'Pendapatan', accountCode: '4.1', accountName: 'Pendapatan Asli Desa (PADes)', budget: BigInt(85000000), realization: BigInt(62000000) },
      { tenantId: tenantSukamaju.id, year: 2026, category: 'Pendapatan', accountCode: '4.2', accountName: 'Transfer Dana Desa (APBN)', budget: BigInt(980000000), realization: BigInt(588000000) },
      { tenantId: tenantSukamaju.id, year: 2026, category: 'Belanja', accountCode: '5.1', accountName: 'Bidang Penyelenggaraan Pemerintahan', budget: BigInt(340000000), realization: BigInt(210000000) },
      { tenantId: tenantSukamaju.id, year: 2026, category: 'Belanja', accountCode: '5.2', accountName: 'Bidang Pembangunan Desa', budget: BigInt(680000000), realization: BigInt(490000000) },
    ],
  });

  // 8. Demo Tenant 2: DESA SALUPANGKANG (Tema: Traditional Village)
  const tenantSalupangkang = await prisma.tenant.create({
    data: {
      slug: 'salupangkang',
      kodeDesa: '76.06.04.2009',
      namaDesa: 'Salupangkang',
      kecamatan: 'Topoyo',
      kabupaten: 'Mamuju Tengah',
      provinsi: 'Sulawesi Barat',
      kodePos: '91563',
      alamatKantor: 'Jl. Poros Trans Sulawesi No. 18, Desa Salupangkang',
      email: 'kantor@desasalupangkang.id',
      telepon: '0426-876543',
      kepalaDesa: 'I Nyoman Sukerta, S.Pd.',
      visi: 'Terwujudnya Desa Salupangkang yang Harmonis, Unggul di Sektor Perkebunan, dan Berdaya Saing.',
      misi: [
        'Memperkokoh kerukunan masyarakat yang majemuk dan berbudaya luhur.',
        'Meningkatkan produktivitas sektor kelapa sawit dan kakao berkelanjutan.',
        'Membangun infrastruktur jalan sentra produksi pedesaan.',
      ],
      logoUrl: '/images/logo-desa.png',
      activeThemeId: 'traditional-village',
      planId: proPlan.id,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
  });

  // Domain Salupangkang
  await prisma.domain.createMany({
    data: [
      { tenantId: tenantSalupangkang.id, domain: 'salupangkang.localhost:3000', isPrimary: true, isVerified: true },
      { tenantId: tenantSalupangkang.id, domain: 'salupangkang.desaku.id', isPrimary: false, isVerified: true },
    ],
  });

  // Admin Desa Salupangkang
  const adminSalupangkang = await prisma.user.create({
    data: {
      name: 'Ketut Ardana',
      email: 'admin@salupangkang.desa.id',
      passwordHash: salupangkangPasswordHash,
      globalRole: GlobalRole.USER,
    },
  });

  await prisma.tenantMembership.create({
    data: {
      tenantId: tenantSalupangkang.id,
      userId: adminSalupangkang.id,
      role: TenantRole.VILLAGE_ADMIN,
    },
  });

  // Konfigurasi Tema Salupangkang
  await prisma.tenantThemeConfig.create({
    data: {
      tenantId: tenantSalupangkang.id,
      themeId: 'traditional-village',
      isPublished: true,
      settings: {
        primaryColor: '#92400e', // amber-800 / cokelat kayu alam
        accentColor: '#78350f',
        headerStyle: 'warm',
        heroStyle: 'cultural-banner',
        showStats: true,
        showApbdes: true,
      },
    },
  });

  // Pamong Salupangkang
  await prisma.villageOfficial.createMany({
    data: [
      { tenantId: tenantSalupangkang.id, name: 'I Nyoman Sukerta, S.Pd.', position: 'Kepala Desa', orderIndex: 1, isActive: true },
      { tenantId: tenantSalupangkang.id, name: 'Ketut Ardana', position: 'Sekretaris Desa', orderIndex: 2, isActive: true },
      { tenantId: tenantSalupangkang.id, name: 'Made Suastika', position: 'Kaur Keuangan', orderIndex: 3, isActive: true },
    ],
  });

  // Artikel Salupangkang
  const catBudaya = await prisma.category.create({
    data: { tenantId: tenantSalupangkang.id, name: 'Seni & Budaya', slug: 'seni-dan-budaya' },
  });

  await prisma.article.create({
    data: {
      tenantId: tenantSalupangkang.id,
      authorId: adminSalupangkang.id,
      categoryId: catBudaya.id,
      title: 'Kemeriahan Festival Panen Raya Budaya Nusantara di Desa Salupangkang',
      slug: 'kemeriahan-festival-panen-raya-budaya-nusantara-desa-salupangkang',
      summary: 'Warga lintas etnis berbaur menyukseskan gelaran syukuran panen raya dengan parade kesenian daerah.',
      content: '<p>Salupangkang kembali menegaskan diri sebagai teladan desa bhinneka tunggal ika melalui Festival Panen Raya tahunan yang dihadiri ribuan masyarakat dan pejabat kabupaten.</p>',
      status: ContentStatus.PUBLISHED,
      viewCount: 230,
    },
  });

  // APBDes Salupangkang
  await prisma.apbdesItem.createMany({
    data: [
      { tenantId: tenantSalupangkang.id, year: 2026, category: 'Pendapatan', accountCode: '4.1', accountName: 'Pendapatan Asli Desa', budget: BigInt(50000000), realization: BigInt(35000000) },
      { tenantId: tenantSalupangkang.id, year: 2026, category: 'Pendapatan', accountCode: '4.2', accountName: 'Dana Desa (APBN)', budget: BigInt(920000000), realization: BigInt(610000000) },
      { tenantId: tenantSalupangkang.id, year: 2026, category: 'Belanja', accountCode: '5.2', accountName: 'Pembangunan Jalan Tani', budget: BigInt(550000000), realization: BigInt(410000000) },
    ],
  });

  // 9. Aktifkan modul-modul awal untuk kedua tenant
  for (const m of moduleList) {
    await prisma.tenantModule.createMany({
      data: [
        { tenantId: tenantSukamaju.id, moduleKey: m.key, isEnabled: true },
        { tenantId: tenantSalupangkang.id, moduleKey: m.key, isEnabled: true },
      ],
      skipDuplicates: true,
    });
  }

  console.log('✅ Seeding berhasil diselesaikan!');
  console.log('--------------------------------------------------');
  console.log('Super Admin       : superadmin@platform.desa.id (admin123)');
  console.log('Admin Sukamaju    : admin@sukamaju.desa.id (sukamaju123)');
  console.log('Admin Salupangkang: admin@salupangkang.desa.id (salupangkang123)');
  console.log('Tenant 1          : Desa Sukamaju (Tema: modern-government)');
  console.log('Tenant 2          : Desa Salupangkang (Tema: traditional-village)');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
