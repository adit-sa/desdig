import { prisma } from '../lib/prisma';

async function main() {
  const t = await prisma.tenant.findUnique({ where: { slug: 'salupangkang' } });
  if (!t) return;
  const menus = await prisma.navMenu.findMany({
    where: { tenantId: t.id },
    orderBy: { orderIndex: 'asc' }
  });
  const parent = menus.find(m => m.id === 'menu_salu_24');
  console.log('Parent menu:', parent);
  const children = menus.filter(m => m.parentId === 'menu_salu_24');
  console.log('Children count:', children.length);
  children.forEach(c => console.log(`- [${c.id}] ${c.title} -> ${c.url} (visible: ${c.isVisible}, order: ${c.orderIndex})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
