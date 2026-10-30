import { prisma } from '../lib/prisma';

async function main() {
  const t = await prisma.tenant.findUnique({ where: { slug: 'salupangkang' } });
  if (!t) throw new Error('Tenant salupangkang tidak ditemukan');

  const parentStatistikId = 'menu_salu_24';

  console.log('🔄 Menata ulang sub-menu Statistik...');

  // 1. Buat 3 sub-menu kategori utama di bawah 'Statistik'
  const subCategories = [
    {
      id: 'menu_salu_stat_kependudukan',
      tenantId: t.id,
      title: 'Kependudukan & Demografi',
      url: '#',
      parentId: parentStatistikId,
      orderIndex: 1,
      isVisible: true,
      isExternal: false,
    },
    {
      id: 'menu_salu_stat_pendidikan',
      tenantId: t.id,
      title: 'Pendidikan & Kesejahteraan',
      url: '#',
      parentId: parentStatistikId,
      orderIndex: 2,
      isVisible: true,
      isExternal: false,
    },
    {
      id: 'menu_salu_stat_wilayah',
      tenantId: t.id,
      title: 'Wilayah & Layanan Data',
      url: '#',
      parentId: parentStatistikId,
      orderIndex: 3,
      isVisible: true,
      isExternal: false,
    },
  ];

  for (const cat of subCategories) {
    await prisma.navMenu.upsert({
      where: { id: cat.id },
      update: {
        title: cat.title,
        parentId: cat.parentId,
        orderIndex: cat.orderIndex,
        isVisible: true,
      },
      create: cat,
    });
  }

  // 2. Petakan anak-anak menu ke sub-kategori masing-masing
  const kependudukanMenuIds = [
    'menu_salu_121', // Data Statistik Rentang Umur
    'menu_salu_122', // Data Statistik Ketegori Umur
    'menu_salu_36',  // Data Jenis Kelamin
    'menu_salu_124', // Data Status Perkawinan
    'menu_salu_40',  // Data Golongan Darah
    'menu_salu_35',  // Data Agama
    'menu_salu_125', // Data Suku / Etnis
    'menu_salu_106', // Data Warga Negara
    'menu_salu_51',  // Data Kelompok Umur
  ];

  const pendidikanMenuIds = [
    'menu_salu_32',  // Data Pendidikan dalam KK
    'menu_salu_33',  // Data Pendidikan Ditempuh
    'menu_salu_123', // Data Pendidikan Sedang Ditempuh
    'menu_salu_34',  // Data Pekerjaan
    'menu_salu_126', // Data BPJS Kesehatan
  ];

  const wilayahMenuIds = [
    'menu_salu_31',  // Data Wilayah Administratif
    'menu_salu_149', // Calon Pemilih
    'menu_salu_141', // Data Analisis
    'menu_salu_155', // Layanan Permintaan Data
    'menu_salu_156', // Unduh Data
  ];

  for (let i = 0; i < kependudukanMenuIds.length; i++) {
    await prisma.navMenu.updateMany({
      where: { id: kependudukanMenuIds[i] },
      data: {
        parentId: 'menu_salu_stat_kependudukan',
        orderIndex: i + 1,
      },
    });
  }

  for (let i = 0; i < pendidikanMenuIds.length; i++) {
    await prisma.navMenu.updateMany({
      where: { id: pendidikanMenuIds[i] },
      data: {
        parentId: 'menu_salu_stat_pendidikan',
        orderIndex: i + 1,
      },
    });
  }

  for (let i = 0; i < wilayahMenuIds.length; i++) {
    await prisma.navMenu.updateMany({
      where: { id: wilayahMenuIds[i] },
      data: {
        parentId: 'menu_salu_stat_wilayah',
        orderIndex: i + 1,
      },
    });
  }

  console.log('✅ Berhasil menata sub-menu Statistik ke dalam 3 kelompok terorganisir!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
