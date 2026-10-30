import { PrismaClient } from '../lib/prisma-client-v4';

const prisma = new PrismaClient();

async function main() {
  const sukamaju = await prisma.tenant.findFirst({ where: { slug: 'sukamaju' } });
  if (!sukamaju) {
    console.error('Sukamaju tenant not found!');
    return;
  }

  // 1. Fix custom pages cover image
  const pageUpdate = await prisma.customPage.updateMany({
    where: {
      tenantId: sukamaju.id,
      coverImageUrl: { contains: 'salupangkang' },
    },
    data: {
      coverImageUrl: '/images/sukamaju_landscape.jpg',
    },
  });
  console.log(`Updated ${pageUpdate.count} custom pages cover image for Sukamaju.`);

  // 2. Fix residents dusun & alamat in Sukamaju
  const residentsToFix = await prisma.resident.findMany({
    where: {
      tenantId: sukamaju.id,
      OR: [
        { dusun: { contains: 'salupangkang', mode: 'insensitive' } },
        { alamat: { contains: 'salupangkang', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`Found ${residentsToFix.length} contaminated residents in Sukamaju.`);

  for (const r of residentsToFix) {
    let cleanDusun = 'Dusun Cigadung';
    let cleanAlamat = 'Jl. Cigadung RT 01/RW 02, Desa Sukamaju';

    if (r.nama.includes('Fatimah')) {
      cleanDusun = 'Dusun Cigadung';
      cleanAlamat = 'Jl. Cigadung No. 12, RT 01/RW 02, Desa Sukamaju';
    } else if (r.nama.includes('Sudarma')) {
      cleanDusun = 'Dusun Sukamaju';
      cleanAlamat = 'Jl. Raya Sukamaju No. 45, RT 02/RW 01, Desa Sukamaju';
    } else if (r.nama.includes('Sarini')) {
      cleanDusun = 'Dusun Melati';
      cleanAlamat = 'Kp. Melati No. 8, RT 03/RW 01, Desa Sukamaju';
    }

    await prisma.resident.update({
      where: { id: r.id },
      data: {
        dusun: cleanDusun,
        alamat: cleanAlamat,
      },
    });
    console.log(`Updated resident ${r.nama} -> dusun: ${cleanDusun}, alamat: ${cleanAlamat}`);
  }

  console.log('Database contamination fix completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
