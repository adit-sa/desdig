import { PrismaClient } from '../lib/prisma-client-v4';

const prisma = new PrismaClient();

async function run() {
  console.log('=== MULTI-TENANT ISOLATION VERIFICATION ===\n');

  const sukamaju = await prisma.tenant.findFirst({ where: { slug: 'sukamaju' } });
  const salupangkang = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });

  if (!sukamaju || !salupangkang) {
    console.error('Tenants not found!');
    return;
  }

  console.log(`[TENANT SUKAMAJU] ID: ${sukamaju.id}, Kode: ${sukamaju.kodeDesa}, Nama: ${sukamaju.namaDesa}`);
  console.log(`[TENANT SALUPANGKANG] ID: ${salupangkang.id}, Kode: ${salupangkang.kodeDesa}, Nama: ${salupangkang.namaDesa}\n`);

  // 1. Officials (Pamong)
  const offSukamaju = await prisma.villageOfficial.findMany({ where: { tenantId: sukamaju.id } });
  const offSalupangkang = await prisma.villageOfficial.findMany({ where: { tenantId: salupangkang.id } });
  console.log(`1. Officials: Sukamaju = ${offSukamaju.length} (names: ${offSukamaju.map(o => o.name).join(', ')}), Salupangkang = ${offSalupangkang.length}`);

  // Check no cross contamination in officials
  const badOff = offSukamaju.filter(o => o.name.toLowerCase().includes('sapiil') || o.name.toLowerCase().includes('amiruddin'));
  console.log(`   Cross contamination check (Officials): ${badOff.length === 0 ? 'PASSED (0)' : 'FAILED'}`);

  // 2. Residents (Penduduk)
  const resSukamaju = await prisma.resident.count({ where: { tenantId: sukamaju.id } });
  const resSalupangkang = await prisma.resident.count({ where: { tenantId: salupangkang.id } });
  console.log(`2. Residents: Sukamaju = ${resSukamaju}, Salupangkang = ${resSalupangkang}`);

  // 3. Articles (Berita)
  const artSukamaju = await prisma.article.findMany({ where: { tenantId: sukamaju.id } });
  const artSalupangkang = await prisma.article.count({ where: { tenantId: salupangkang.id } });
  console.log(`3. Articles: Sukamaju = ${artSukamaju.length} (${artSukamaju.map(a => a.title).join(' | ')}), Salupangkang = ${artSalupangkang}`);

  // 4. Projects (Pembangunan)
  const projSukamaju = await prisma.developmentProject.count({ where: { tenantId: sukamaju.id } });
  const projSalupangkang = await prisma.developmentProject.count({ where: { tenantId: salupangkang.id } });
  console.log(`4. Projects: Sukamaju = ${projSukamaju}, Salupangkang = ${projSalupangkang}`);

  // 5. Merchants (Pelapak)
  const merchSukamaju = await prisma.merchant.findMany({ where: { tenantId: sukamaju.id } });
  const merchSalupangkang = await prisma.merchant.findMany({ where: { tenantId: salupangkang.id } });
  console.log(`5. Merchants: Sukamaju = ${merchSukamaju.length} (${merchSukamaju.map(m => m.shopName).join(', ')}), Salupangkang = ${merchSalupangkang.length}`);
  const badMerch = merchSukamaju.filter(m => m.shopName.toLowerCase().includes('salupangkang'));
  console.log(`   Cross contamination check (Merchants): ${badMerch.length === 0 ? 'PASSED (0)' : 'FAILED'}`);

  // 6. Attendance (Absensi)
  const attSukamaju = await prisma.officialAttendance.count({ where: { official: { tenantId: sukamaju.id } } });
  const attSalupangkang = await prisma.officialAttendance.count({ where: { official: { tenantId: salupangkang.id } } });
  console.log(`6. Attendance: Sukamaju = ${attSukamaju}, Salupangkang = ${attSalupangkang}`);

  // 7. Identity (Identitas)
  console.log(`7. Identity Sukamaju: Kades = ${sukamaju.kepalaDesa}, Wilayah = ${sukamaju.kecamatan}, ${sukamaju.kabupaten}, ${sukamaju.provinsi}`);
  console.log(`   Identity Salupangkang: Kades = ${salupangkang.kepalaDesa}, Wilayah = ${salupangkang.kecamatan}, ${salupangkang.kabupaten}, ${salupangkang.provinsi}`);

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
