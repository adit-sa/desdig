import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const sukamaju = await prisma.tenant.findUnique({ where: { slug: 'sukamaju' } });
  const salupangkang = await prisma.tenant.findUnique({ where: { slug: 'salupangkang' } });

  if (sukamaju) {
    const photosSukamaju = [
      {
        title: 'Panorama Lanskap Pertanian & Sawah Terasering',
        imageUrl: '/images/sukamaju_landscape.jpg',
        category: 'Potensi Desa',
        caption: 'Hamparan sawah terasering lereng perbukitan sumber ketahanan pangan warga Desa Sukamaju.',
      },
      {
        title: 'Proyek Padat Karya Saluran Irigasi Blok Cikadu',
        imageUrl: '/images/desa_irigasi_pertanian.jpg',
        category: 'Pembangunan',
        caption: 'Pekerjaan konstruksi saluran irigasi tersier sepanjang 250 meter melibatkan 45 tenaga kerja lokal.',
      },
      {
        title: 'Sentra Produksi & Pengemasan Keripik Pisang UMKM',
        imageUrl: '/images/desa_umkm_produk.jpg',
        category: 'Ekonomi Warga',
        caption: 'Aktivitas ibu-ibu PKK dan kelompok usaha mikro mengolah hasil kebun pisang unggulan desa.',
      },
      {
        title: 'Gedung Pelayanan Terpadu Balai Desa',
        imageUrl: '/images/balai_desa_gedung.jpg',
        category: 'Pelayanan Publik',
        caption: 'Suasana pelayanan administrasi kependudukan di halaman Balai Desa Sukamaju.',
      },
    ];

    for (const p of photosSukamaju) {
      await prisma.galleryItem.create({
        data: {
          tenantId: sukamaju.id,
          title: p.title,
          imageUrl: p.imageUrl,
          category: p.category,
          caption: p.caption,
          takenAt: new Date(),
        },
      });
    }
  }

  if (salupangkang) {
    await prisma.galleryItem.create({
      data: {
        tenantId: salupangkang.id,
        title: 'Balai Pertemuan & Rumah Panggung Adat',
        imageUrl: '/images/salupangkang_heritage.jpg',
        category: 'Budaya & Adat',
        caption: 'Pusat musyawarah adat dan kegiatan kemasyarakatan Desa Salupangkang.',
        takenAt: new Date(),
      },
    });
  }

  console.log('✅ Berhasil mengisi galeri foto dokumentasi desa!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
