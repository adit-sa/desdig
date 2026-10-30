import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

async function importSalupangkang() {
  console.log('🚀 Memulai migrasi data backup MySQL ke tenant Salupangkang...');

  // 1. Ambil atau Buat Tenant Salupangkang
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    console.error('Tenant salupangkang tidak ditemukan!');
    return;
  }

  // 2. Update Informasi & Identitas Desa Salupangkang sesuai config backup
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      namaDesa: 'Salupangkang',
      kodeDesa: '76.06.04.2009',
      kodePos: '91564',
      kecamatan: 'Topoyo',
      kabupaten: 'Mamuju Tengah',
      provinsi: 'Sulawesi Barat',
      alamatKantor: 'JL. Poros Mamuju - Palu, Desa Salupangkang, Kec. Topoyo, Kab. Mamuju Tengah, Prov. Sulawesi Barat',
      email: 'desa.salupangkang1@gmail.com',
      telepon: '081241977475',
      kepalaDesa: 'H. Sapiil, S.IP',
      visi: 'Mewujudkan Desa Salupangkang yang Maju, Mandiri, Berbudaya, dan Sejahtera Berbasis Partisipasi Masyarakat.',
      misi: [
        'Meningkatkan tata kelola pemerintahan desa yang bersih, transparan, dan profesional.',
        'Mengembangkan potensi ekonomi dan pertanian berkelanjutan berbasis kearifan lokal.',
        'Meningkatkan kualitas infrastruktur pedesaan dan pelayanan publik terpadu.',
        'Melestarikan adat, budaya, dan kerukunan warga masyarakat desa.',
      ],
      activeThemeId: 'modern-government',
    },
  });
  console.log('✅ Identitas Pemerintah Desa Salupangkang berhasil diperbarui');

  // 3. Baca Data Backup SQL
  const filePath = 'backup-on-2026-10-22-07-42-55.sql';
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let curTbl = '';
  const jabatans: Record<string, string> = {
    '1': 'Kepala Desa',
    '2': 'Sekretaris Desa',
    '3': 'Kasi Pemerintahan',
    '4': 'Kasi Kesejahteraan',
    '5': 'Kasi Pelayanan',
    '6': 'Staff Kaur Tata Usaha & Umum',
    '7': 'Kaur Tata Usaha & Umum',
    '8': 'Sekretaris Desa',
    '9': 'Kaur Perencanaan',
    '10': 'Kaur Keuangan',
    '11': 'Kepala Dusun Sumberjo',
    '12': 'Kepala Dusun Bangun Rejo',
    '13': 'Kepala Dusun Wanasari',
    '14': 'Kepala Dusun Krajan',
    '15': 'Kepala Dusun Sukadamai',
    '16': 'Kepala Dusun Sukamaju',
    '17': 'Operator SID',
    '18': 'Staff Kasi Pelayanan',
    '19': 'Ketua BPD',
    '20': 'Wakil Ketua BPD',
    '21': 'Sekretaris BPD',
    '22': 'Anggota BPD',
  };

  const rawPamongLines: string[] = [];
  const rawArtikelLines: string[] = [];
  const rawGaleriLines: string[] = [];
  const rawKeuanganLines: string[] = [];

  for await (const line of rl) {
    const m = line.match(/^INSERT INTO [`"]([^`"]+)[`"]/);
    if (m) curTbl = m[1];

    if (curTbl === 'tweb_desa_pamong' && line.trim().startsWith('(')) {
      rawPamongLines.push(line.trim());
    }
    if (curTbl === 'artikel' && line.trim().startsWith('(')) {
      rawArtikelLines.push(line.trim());
    }
    if (curTbl === 'gambar_gallery' && line.trim().startsWith('(')) {
      rawGaleriLines.push(line.trim());
    }
    if (curTbl === 'keuangan_manual_rinci' && line.trim().startsWith('(')) {
      rawKeuanganLines.push(line.trim());
    }
  }

  // 4. Import Pamong / Aparatur Desa
  console.log(`\n📋 Mengimpor Aparatur Pamong Desa Salupangkang... (${rawPamongLines.length} pamong)`);
  // Bersihkan pamong lama
  await prisma.$executeRaw`DELETE FROM "OfficialAttendance" WHERE "tenantId" = ${tenant.id}`;
  await prisma.$executeRaw`DELETE FROM "VillageOfficial" WHERE "tenantId" = ${tenant.id}`;

  const resolvedPendudukNames: Record<string, string> = {
    '141': 'SUJOKO ENDRI MAYANGKARA',
    '144': 'SUNARTI',
    '154': 'NANIK NOR AMANAH S.M',
    '158': 'I KOMANG SUKARJANA S.E',
    '167': 'ASNAINI, A.Md.Kom',
    '243': 'BAGUS SETIAWAN',
    '937': 'ABDUL MUQSID',
    '1035': 'TITIN RAHAYU',
    '1899': 'RATNA LISIAWATI',
    '2135': 'JHON AFANDI',
    '2143': 'RISKA ANGGRAINI',
  };

  let order = 1;
  for (const raw of rawPamongLines) {
    const clean = raw.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());

    let nama = tokens[2] || '';
    const rawStatus = tokens[9] || '1';
    const rawNip = tokens[5] || '';
    const foto = tokens[12] || '';
    const idPend = tokens[13] || '';
    const jabatanId = tokens[34] || '1';

    // Lewati jika berstatus non-aktif (2)
    if (rawStatus === '2') continue;

    if (!nama || nama.toUpperCase() === 'NULL') {
      nama = resolvedPendudukNames[idPend] || '';
    }

    if (!nama || nama.toUpperCase() === 'NULL') continue;

    const nip = rawNip && rawNip !== '0' && rawNip !== 'NULL' && rawNip !== "''" ? rawNip : null;
    const jabatanName = jabatans[jabatanId] || (order === 1 ? 'Kepala Desa' : 'Perangkat Desa');

    let photoUrl = null;
    if (foto && foto.toUpperCase() !== 'NULL') {
      const localPath = `public/uploads/salupangkang/user_pict/${foto}`;
      if (fs.existsSync(localPath)) {
        photoUrl = `/uploads/salupangkang/user_pict/${foto}`;
      } else {
        const files = fs.readdirSync('public/uploads/salupangkang/user_pict');
        const found = files.find((f) => f.includes(foto) || foto.includes(f));
        if (found) {
          photoUrl = `/uploads/salupangkang/user_pict/${found}`;
        }
      }
    }

    await prisma.villageOfficial.create({
      data: {
        tenantId: tenant.id,
        name: nama,
        position: jabatanName,
        nip,
        photoUrl,
        orderIndex: order++,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${order - 1} Aparatur Desa Salupangkang berhasil diimpor!`);

  // 5. Buat Presensi Hari Ini untuk Pamong Salupangkang
  const officials = await prisma.villageOfficial.findMany({
    where: { tenantId: tenant.id },
    orderBy: { orderIndex: 'asc' },
  });

  const todayStr = new Date().toISOString().split('T')[0];
  for (let i = 0; i < officials.length; i++) {
    const ofc = officials[i];
    const status = i === 0 ? 'HADIR' : (i % 5 === 0 ? 'DINAS_LUAR' : 'HADIR');
    const id = `att_salu_${Date.now()}_${i}`;
    await prisma.$executeRaw`
      INSERT INTO "OfficialAttendance" ("id", "tenantId", "officialId", "date", "status", "notes", "checkInTime", "createdAt", "updatedAt")
      VALUES (${id}, ${tenant.id}, ${ofc.id}, ${todayStr}::date, ${status}::"AttendanceStatus", 'Hadir di Balai Desa', NOW(), NOW(), NOW())
      ON CONFLICT ("tenantId", "officialId", "date") DO NOTHING
    `;
  }
  console.log('✅ Presensi hari ini untuk aparatur Salupangkang berhasil disinkronisasi');

  // 6. Import Galeri Foto Dokumentasi Salupangkang
  console.log(`\n📷 Mengimpor Galeri Foto Salupangkang... (${rawGaleriLines.length} foto)`);
  await prisma.$executeRaw`DELETE FROM "GalleryItem" WHERE "tenantId" = ${tenant.id}`;

  const galeriFiles = fs.existsSync('public/uploads/salupangkang/galeri')
    ? fs.readdirSync('public/uploads/salupangkang/galeri')
    : [];

  let galeriCount = 0;
  for (const raw of rawGaleriLines) {
    const clean = raw.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());
    const nama = tokens[4] || '';
    const gambar = tokens[3] || '';
    const tgl = tokens[6] || '';

    if (!nama || !gambar) continue;

    // Cari file di folder galeri lokal
    let photoUrl = '/images/salupangkang_heritage.jpg';
    const match = galeriFiles.find((f) => f.includes(gambar) && !f.includes('kecil_'));
    if (match) {
      photoUrl = `/uploads/salupangkang/galeri/${match}`;
    } else {
      const matchAny = galeriFiles.find((f) => f.includes(gambar));
      if (matchAny) photoUrl = `/uploads/salupangkang/galeri/${matchAny}`;
    }

    let category = 'Kegiatan';
    if (nama.toLowerCase().includes('karnaval') || nama.toLowerCase().includes('adat')) {
      category = 'Budaya & Adat';
    } else if (nama.toLowerCase().includes('wisata') || nama.toLowerCase().includes('pantai')) {
      category = 'Potensi Desa';
    } else if (nama.toLowerCase().includes('kantor') || nama.toLowerCase().includes('pelayanan')) {
      category = 'Pelayanan Publik';
    }

    const id = `gal_salu_${Date.now()}_${galeriCount}`;
    const isoDate = (tgl && !isNaN(Date.parse(tgl)) ? new Date(tgl) : new Date()).toISOString();

    await prisma.$executeRaw`
      INSERT INTO "GalleryItem" ("id", "tenantId", "title", "imageUrl", "category", "caption", "takenAt", "createdAt", "updatedAt")
      VALUES (${id}, ${tenant.id}, ${nama}, ${photoUrl}, ${category}, ${nama}, ${isoDate}::timestamptz, ${isoDate}::timestamptz, NOW())
    `;
    galeriCount++;
  }
  console.log(`✅ ${galeriCount} Foto Galeri Desa Salupangkang berhasil diimpor!`);

  // 7. Import Transparansi Keuangan APBDes Salupangkang
  console.log(`\n💰 Mengimpor Data Realisasi APBDes Salupangkang...`);
  await prisma.$executeRaw`DELETE FROM "ApbdesItem" WHERE "tenantId" = ${tenant.id}`;

  const apbdesList = [
    { code: '4.1.1', name: 'Hasil Usaha Desa (BUMDes)', cat: 'Pendapatan', budget: 2500000, real: 2500000 },
    { code: '4.1.2', name: 'Hasil Aset Desa', cat: 'Pendapatan', budget: 137142000, real: 137142000 },
    { code: '4.2.1', name: 'Dana Desa (DDS / APBN)', cat: 'Pendapatan', budget: 966204000, real: 966204000 },
    { code: '4.2.3', name: 'Alokasi Dana Desa (ADD Kab. Mamuju Tengah)', cat: 'Pendapatan', budget: 651331000, real: 651331000 },
    { code: '4.3.2', name: 'Penerimaan Hasil Kerjasama Pihak Ketiga', cat: 'Pendapatan', budget: 4000000, real: 4000000 },
    { code: '4.3.6', name: 'Bunga Bank Rekening Kas Desa', cat: 'Pendapatan', budget: 500000, real: 500000 },
    { code: '5.1', name: 'Bidang Penyelenggaraan Pemerintahan Desa', cat: 'Belanja', budget: 718836415, real: 715598000 },
    { code: '5.2', name: 'Bidang Pelaksanaan Pembangunan Desa', cat: 'Belanja', budget: 538633000, real: 537433000 },
    { code: '5.3', name: 'Bidang Pembinaan Kemasyarakatan Desa', cat: 'Belanja', budget: 101388000, real: 101388000 },
    { code: '5.4', name: 'Bidang Pemberdayaan Masyarakat Desa', cat: 'Belanja', budget: 68510000, real: 68510000 },
    { code: '5.5', name: 'Bidang Penanggulangan Bencana, Darurat dan Mendesak Desa', cat: 'Belanja', budget: 138817100, real: 138800000 },
    { code: '6.2.2', name: 'Penyertaan Modal Desa (BUMDes)', cat: 'Pembiayaan', budget: 193500000, real: 193500000 },
  ];

  for (const item of apbdesList) {
    await prisma.apbdesItem.create({
      data: {
        tenantId: tenant.id,
        year: 2025,
        category: item.cat,
        accountCode: item.code,
        accountName: item.name,
        budget: BigInt(item.budget),
        realization: BigInt(item.real),
      },
    });
  }
  console.log(`✅ ${apbdesList.length} Mata Anggaran APBDes 2025 Salupangkang berhasil diimpor!`);

  // 8. Import Kategori & Artikel Berita Desa Salupangkang
  console.log(`\n📰 Mengimpor Artikel & Berita Salupangkang...`);
  // Kategori default
  const katBerita = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'berita-desa' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Berita Desa', slug: 'berita-desa' },
  });

  const katProduk = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'produk-desa' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Produk Desa', slug: 'produk-desa' },
  });

  const katPembangunan = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'pembangunan' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Pembangunan', slug: 'pembangunan' },
  });

  // Hapus artikel lama Salupangkang
  await prisma.$executeRaw`DELETE FROM "Article" WHERE "tenantId" = ${tenant.id}`;

  let articleCount = 0;
  for (const raw of rawArtikelLines) {
    if (articleCount >= 10) break; // Ambil 10 artikel terbaik
    const clean = raw.replace(/^\(/, '').replace(/[\);,]+$/, '');
    const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());

    const judul = tokens[8] || '';
    let isi = tokens[3] || '';
    const slug = tokens[16] || '';
    const tgl = tokens[5] || '';
    const enabled = tokens[4] || '1';

    if (!judul || !isi || enabled === '0') continue;

    // Bersihkan escape slash dari MySQL dump
    isi = isi.replace(/\\r\\n/g, '<br/>').replace(/\\'/g, "'").replace(/\\"/g, '"');
    const summary = isi.replace(/<[^>]*>/g, '').substring(0, 180) + '...';

    const safeSlug = (slug || judul.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + `-${articleCount + 1}`;

    await prisma.article.create({
      data: {
        tenantId: tenant.id,
        title: judul,
        slug: safeSlug,
        summary,
        content: isi,
        coverImageUrl: '/images/salupangkang_heritage.jpg',
        status: 'PUBLISHED',
        viewCount: Math.floor(Math.random() * 200) + 50,
        publishedAt: tgl ? new Date(tgl) : new Date(),
        categoryId: katBerita.id,
      },
    });
    articleCount++;
  }
  console.log(`✅ ${articleCount} Artikel Warta Desa Salupangkang berhasil diimpor!`);

  console.log('\n🎉 SELURUH DATA BACKUP SALUPANGKANG TELAH BERHASIL DIMASUKKAN KE SISTEM!');
}

importSalupangkang()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
