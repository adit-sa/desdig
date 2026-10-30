import { PrismaClient } from '../lib/prisma-client-v4';

const prisma = new PrismaClient();

async function main() {
  const sukamaju = await prisma.tenant.findFirst({
    where: { slug: 'sukamaju' },
  });

  if (!sukamaju) {
    console.log('Tenant sukamaju not found');
    return;
  }

  // Delete incorrectly seeded merchants for Sukamaju that contain 'Salupangkang'
  const deleted = await prisma.merchant.deleteMany({
    where: {
      tenantId: sukamaju.id,
      OR: [
        { shopName: { contains: 'Salupangkang', mode: 'insensitive' } },
        { address: { contains: 'Salupangkang', mode: 'insensitive' } },
        { slug: { contains: 'salupangkang', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`Deleted ${deleted.count} wrong Salupangkang merchants from Sukamaju.`);

  // Create proper Sukamaju sample merchants
  await prisma.merchant.create({
    data: {
      tenantId: sukamaju.id,
      name: 'Ibu Enok Rosita',
      shopName: 'Lapak Berkah Sukamaju',
      slug: 'lapak-berkah-sukamaju',
      phone: '6281234567891',
      address: 'Dusun Cigadung RT 01, Desa Sukamaju',
      description: 'Menjual aneka olahan hasil bumi Sukamaju, rengginang, keripik singkong, dan teh herbal lokal.',
      avatarUrl: '/images/desa_umkm_produk.jpg',
      products: {
        create: [
          {
            name: 'Rengginang Ketan Asli Sukamaju (500g)',
            description: 'Rengginang gurih renyah dibuat dari beras ketan pilihan warga Desa Sukamaju.',
            price: 20000,
            unit: 'bungkus',
            category: 'Makanan & Minuman',
            imageUrl: '/images/desa_umkm_produk.jpg',
            isAvailable: true,
          },
          {
            name: 'Kopi Robusta Sukamaju Priangan (250g)',
            description: 'Kopi lereng Sukamaju dengan aroma mantap khas pegunungan Jawa Barat.',
            price: 35000,
            unit: 'bungkus',
            category: 'Makanan & Minuman',
            imageUrl: '/images/sukamaju_landscape.jpg',
            isAvailable: true,
          },
        ],
      },
    },
  });

  console.log('Successfully created proper Lapak Berkah Sukamaju.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
