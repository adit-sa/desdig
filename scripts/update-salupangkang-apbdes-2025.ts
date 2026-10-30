import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    throw new Error('Tenant salupangkang tidak ditemukan!');
  }

  console.log(`Menghapus data APBDes 2026 untuk ${tenant.namaDesa} (ID: ${tenant.id})...`);
  const deleted = await prisma.apbdesItem.deleteMany({
    where: {
      tenantId: tenant.id,
      year: 2026,
    },
  });
  console.log(`Berhasil menghapus ${deleted.count} data APBDes 2026.`);

  // Data Otentik APBDes 2025 Desa Salupangkang dari backup-on-2026-10-22-07-42-55.sql (keuangan_manual_rinci)
  const apbdes2025 = [
    // 1. PENDAPATAN
    {
      year: 2025,
      category: 'Pendapatan',
      accountCode: '4.1.1',
      accountName: 'Hasil Usaha Desa (BUMDes)',
      budget: BigInt(2500000),
      realization: BigInt(2500000),
    },
    {
      year: 2025,
      category: 'Pendapatan',
      accountCode: '4.1.2',
      accountName: 'Hasil Aset Desa',
      budget: BigInt(137142000),
      realization: BigInt(137142000),
    },
    {
      year: 2025,
      category: 'Pendapatan',
      accountCode: '4.2.1',
      accountName: 'Dana Desa (DDS / APBN)',
      budget: BigInt(966204000),
      realization: BigInt(966204000),
    },
    {
      year: 2025,
      category: 'Pendapatan',
      accountCode: '4.2.3',
      accountName: 'Alokasi Dana Desa (ADD Kab. Mamuju Tengah)',
      budget: BigInt(651331000),
      realization: BigInt(651331000),
    },
    {
      year: 2025,
      category: 'Pendapatan',
      accountCode: '4.3.2',
      accountName: 'Penerimaan Hasil Kerjasama Pihak Ketiga',
      budget: BigInt(4000000),
      realization: BigInt(4000000),
    },
    {
      year: 2025,
      category: 'Pendapatan',
      accountCode: '4.3.6',
      accountName: 'Bunga Bank Rekening Kas Desa',
      budget: BigInt(500000),
      realization: BigInt(500000),
    },

    // 2. BELANJA
    {
      year: 2025,
      category: 'Belanja',
      accountCode: '5.1',
      accountName: 'Bidang Penyelenggaraan Pemerintahan Desa',
      budget: BigInt(718836415),
      realization: BigInt(715598000),
    },
    {
      year: 2025,
      category: 'Belanja',
      accountCode: '5.2',
      accountName: 'Bidang Pelaksanaan Pembangunan Desa',
      budget: BigInt(538633000),
      realization: BigInt(537433000),
    },
    {
      year: 2025,
      category: 'Belanja',
      accountCode: '5.3',
      accountName: 'Bidang Pembinaan Kemasyarakatan Desa',
      budget: BigInt(101388000),
      realization: BigInt(101388000),
    },
    {
      year: 2025,
      category: 'Belanja',
      accountCode: '5.4',
      accountName: 'Bidang Pemberdayaan Masyarakat Desa',
      budget: BigInt(68510000),
      realization: BigInt(68510000),
    },
    {
      year: 2025,
      category: 'Belanja',
      accountCode: '5.5',
      accountName: 'Bidang Penanggulangan Bencana, Darurat dan Mendesak Desa',
      budget: BigInt(138817100),
      realization: BigInt(138800000),
    },

    // 3. PEMBIAYAAN
    {
      year: 2025,
      category: 'Pembiayaan',
      accountCode: '6.2.2',
      accountName: 'Penyertaan Modal Desa (BUMDes)',
      budget: BigInt(193500000),
      realization: BigInt(193500000),
    },
  ];

  console.log(`Memasukkan ${apbdes2025.length} mata anggaran APBDes 2025 ke database...`);
  for (const item of apbdes2025) {
    await prisma.apbdesItem.create({
      data: {
        tenantId: tenant.id,
        year: item.year,
        category: item.category,
        accountCode: item.accountCode,
        accountName: item.accountName,
        budget: item.budget,
        realization: item.realization,
      },
    });
  }

  console.log(`✅ Berhasil mengimpor APBDes 2025 untuk ${tenant.namaDesa}!`);

  const currentItems = await prisma.apbdesItem.findMany({
    where: { tenantId: tenant.id },
    orderBy: [{ year: 'desc' }, { accountCode: 'asc' }],
  });

  console.log(`\nVerifikasi Data APBDes Salupangkang saat ini: ${currentItems.length} akun`);
  let totPendapatan = BigInt(0);
  let totBelanja = BigInt(0);
  let totPembiayaan = BigInt(0);

  currentItems.forEach((i) => {
    console.log(
      `[${i.year}] [${i.category.padEnd(10)}] [${i.accountCode.padEnd(6)}] ${i.accountName.padEnd(55)} | Anggaran: Rp ${i.budget.toLocaleString('id-ID')} | Realisasi: Rp ${i.realization.toLocaleString('id-ID')}`
    );
    if (i.category === 'Pendapatan') totPendapatan += i.realization;
    if (i.category === 'Belanja') totBelanja += i.realization;
    if (i.category === 'Pembiayaan') totPembiayaan += i.realization;
  });

  console.log('\n--- RINGKASAN APBDes 2025 ---');
  console.log(`Total Realisasi Pendapatan: Rp ${totPendapatan.toLocaleString('id-ID')}`);
  console.log(`Total Realisasi Belanja   : Rp ${totBelanja.toLocaleString('id-ID')}`);
  console.log(`Total Pembiayaan Keluar   : Rp ${totPembiayaan.toLocaleString('id-ID')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
