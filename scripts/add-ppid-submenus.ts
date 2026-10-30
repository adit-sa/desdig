import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    console.error('Tenant salupangkang tidak ditemukan!');
    return;
  }

  // Cari menu Informasi tepat di bawah PPID (menu_salu_157)
  const infoMenu = await prisma.$queryRaw<any[]>`
    SELECT id, title, "parentId" FROM "NavMenu"
    WHERE "tenantId" = ${tenant.id} AND id = 'menu_salu_169'
  `;

  console.log('Menu Informasi:', infoMenu);

  const parentInfoId = infoMenu.length > 0 ? infoMenu[0].id : 'menu_salu_169';
  console.log(`Menggunakan parentId: ${parentInfoId}`);

  // 3 Sub-menu yang diminta user:
  const submenus = [
    {
      title: 'Tata Cara Permohonan Informasi',
      url: 'https://drive.google.com/file/d/1-O2JeeGygGW4FBhYKloX1NH2Iv0YDJMa/view?usp=drive_link',
      orderIndex: 1,
    },
    {
      title: 'Tata Cara Pengajuan Keberatan',
      url: 'https://drive.google.com/file/d/1cLbCZRLjV54ipphNoLQnpDILeXSC3Tt_/view?usp=drive_link',
      orderIndex: 2,
    },
    {
      title: 'Tata Cara Pengajuan Penyelesaian Sengketa',
      url: 'https://drive.google.com/file/d/1h0gAUrwx26DqayhqrzV_kcLbEA6xzfpi/view?usp=drive_link',
      orderIndex: 3,
    },
  ];

  for (const item of submenus) {
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM "NavMenu"
      WHERE "tenantId" = ${tenant.id} AND "parentId" = ${parentInfoId} AND title = ${item.title}
    `;

    if (existing.length > 0) {
      console.log(`Submenu "${item.title}" sudah ada, memperbarui...`);
      await prisma.$executeRaw`
        UPDATE "NavMenu"
        SET url = ${item.url}, "isExternal" = true, "isVisible" = true, "orderIndex" = ${item.orderIndex}, "updatedAt" = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      const newId = `menu_ppid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      console.log(`Membuat submenu baru "${item.title}" dengan id ${newId}...`);
      await prisma.$executeRaw`
        INSERT INTO "NavMenu" ("id", "tenantId", "title", "url", "parentId", "orderIndex", "isVisible", "isExternal", "createdAt", "updatedAt")
        VALUES (${newId}, ${tenant.id}, ${item.title}, ${item.url}, ${parentInfoId}, ${item.orderIndex}, true, true, NOW(), NOW())
      `;
    }
  }

  // Pastikan menu Pembangunan ada dan aktif di root
  const existingPembangunan = await prisma.$queryRaw<any[]>`
    SELECT id FROM "NavMenu"
    WHERE "tenantId" = ${tenant.id} AND LOWER(title) = 'pembangunan'
  `;

  if (existingPembangunan.length > 0) {
    console.log('Menu Pembangunan sudah ada di database, memastikan url=/pembangunan & isVisible=true');
    await prisma.$executeRaw`
      UPDATE "NavMenu"
      SET url = '/pembangunan', "isVisible" = true, "updatedAt" = NOW()
      WHERE id = ${existingPembangunan[0].id}
    `;
  } else {
    console.log('Menambahkan menu Pembangunan ke navigasi root');
    const pId = `menu_pembangunan_${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO "NavMenu" ("id", "tenantId", "title", "url", "parentId", "orderIndex", "isVisible", "isExternal", "createdAt", "updatedAt")
      VALUES (${pId}, ${tenant.id}, 'Pembangunan', '/pembangunan', NULL, 6, true, false, NOW(), NOW())
    `;
  }

  console.log('Selesai menambahkan sub-menu PPID dan menu Pembangunan.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
