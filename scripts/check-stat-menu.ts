import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const statMenus = await prisma.$queryRaw<any[]>`
    SELECT id, title, url, "parentId", "orderIndex", "isVisible" 
    FROM "NavMenu" 
    WHERE LOWER(title) LIKE '%statistik%'
  `;
  console.log('Stat menus:', statMenus);

  for (const sm of statMenus) {
    const children = await prisma.$queryRaw<any[]>`
      SELECT id, title, url, "parentId", "orderIndex", "isVisible"
      FROM "NavMenu" 
      WHERE "parentId" = ${sm.id}
      ORDER BY "orderIndex" ASC
    `;
    console.log(`Children of "${sm.title}" (${sm.id}, isVisible: ${sm.isVisible}, parent: ${sm.parentId}):`, children.length);
    children.forEach(c => console.log(`   - ${c.title} (${c.url}) [visible: ${c.isVisible}]`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
