import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  await prisma.tenant.update({
    where: { slug: 'sukamaju' },
    data: {
      heroImageUrl: '/images/sukamaju_landscape.jpg',
      logoUrl: '/images/garut_emblem.png',
    },
  });

  await prisma.tenant.update({
    where: { slug: 'salupangkang' },
    data: {
      heroImageUrl: '/images/salupangkang_heritage.jpg',
      logoUrl: '/images/mamuju_emblem.png',
    },
  });

  await prisma.article.updateMany({
    where: { slug: { contains: 'irigasi' } },
    data: { coverImageUrl: '/images/desa_irigasi_pertanian.jpg' },
  });

  await prisma.article.updateMany({
    where: { slug: { contains: 'umkm' } },
    data: { coverImageUrl: '/images/desa_umkm_produk.jpg' },
  });

  await prisma.article.updateMany({
    where: { slug: { contains: 'panen' } },
    data: { coverImageUrl: '/images/salupangkang_heritage.jpg' },
  });

  await prisma.villageOfficial.updateMany({
    where: { position: 'Kepala Desa' },
    data: { photoUrl: '/images/kades_portrait.jpg' },
  });

  console.log('✅ Berhasil menyematkan foto landscape, kades, dan dokumentasi asli ke database!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
