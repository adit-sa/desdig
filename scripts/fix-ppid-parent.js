const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fixParentIds() {
  const t = await p.tenant.findUnique({ where: { slug: 'salupangkang' } });
  
  // PPID menu id is menu_salu_157
  await p.$executeRaw`
    UPDATE "NavMenu"
    SET "parentId" = 'menu_salu_157'
    WHERE "tenantId" = ${t.id} AND id IN ('menu_salu_170', 'menu_salu_171', 'menu_salu_172')
  `;

  const rootMenus = await p.$queryRaw`
    SELECT id, title, url, "orderIndex", "isVisible" 
    FROM "NavMenu" 
    WHERE "tenantId" = ${t.id} AND "parentId" IS NULL AND "isVisible" = true 
    ORDER BY "orderIndex" ASC
  `;
  console.log('Cleaned Root Menus Count:', rootMenus.length);
  rootMenus.forEach(m => console.log(`- [${m.orderIndex}] ${m.title} (${m.url})`));
}
fixParentIds().finally(() => p.$disconnect());
