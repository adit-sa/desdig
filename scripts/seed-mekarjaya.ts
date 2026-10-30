import { PrismaClient } from '../lib/prisma-client-v4';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.tenant.findUnique({
    where: { slug: 'mekarjaya' },
  });

  if (existing) {
    console.log('Tenant Mekarjaya sudah ada di database.');
    return;
  }

  const basicPlan = await prisma.subscriptionPlan.findFirst({
    where: { code: 'BASIC' },
  });

  if (!basicPlan) {
    console.error('Plan BASIC tidak ditemukan');
    return;
  }

  console.log('Menambahkan tenant Mekarjaya...');
  const tenant = await prisma.tenant.create({
    data: {
      slug: 'mekarjaya',
      kodeDesa: '32.01.25.2008',
      namaDesa: 'Mekarjaya',
      kecamatan: 'Ciawi',
      kabupaten: 'Bogor',
      provinsi: 'Jawa Barat',
      kodePos: '16720',
      alamatKantor: 'Jl. Surya Kencana No. 05, Desa Mekarjaya',
      email: 'mekarjaya@bogorkab.go.id',
      telepon: '0857-1122-3344',
      kepalaDesa: 'Drs. Ridwan Hakim',
      visi: 'Desa Agrowisata Cerdas Berkelanjutan Menuju Kemakmuran Warga.',
      misi: [
        'Pengembangan potensi agrowisata berbasis kearifan lokal.',
        'Digitalisasi pelayanan masyarakat dan surat terpadu.'
      ],
      planId: basicPlan.id,
      subscriptionStatus: 'TRIAL',
      activeThemeId: 'modern-government',
      themeConfigs: {
        create: {
          themeId: 'modern-government',
          isPublished: true,
          settings: {
            colors: {
              primary: '#059669',
              secondary: '#0284c7',
              accent: '#f59e0b',
            },
          },
        },
      },
    },
  });

  // Modul
  const defaultModules = ['profile', 'news', 'announcements', 'gallery', 'ppid', 'statistics', 'services'];
  for (const m of defaultModules) {
    await prisma.tenantModule.create({
      data: {
        tenantId: tenant.id,
        moduleKey: m,
        isEnabled: true,
      },
    });
  }

  // Password hash sama dengan admin lainnya
  const passwordHash = await bcrypt.hash('admin123', 10);

  // User Admin Mekarjaya
  let user = await prisma.user.findUnique({
    where: { email: 'admin@mekarjaya.desa.id' },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Admin Mekarjaya',
        email: 'admin@mekarjaya.desa.id',
        passwordHash,
        globalRole: 'USER',
      },
    });
  }

  await prisma.tenantMembership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'VILLAGE_ADMIN',
    },
  });

  // Aparatur Mekarjaya
  await prisma.villageOfficial.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Drs. Ridwan Hakim',
        position: 'Kepala Desa',
        orderIndex: 1,
        pinCode: '1234',
        isActive: true,
      },
      {
        tenantId: tenant.id,
        name: 'Dedi Mulyadi, S.E.',
        position: 'Sekretaris Desa',
        orderIndex: 2,
        pinCode: '1234',
        isActive: true,
      },
    ],
  });

  console.log('✅ Berhasil seed Desa Mekarjaya ke PostgreSQL!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
