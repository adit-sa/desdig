import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const menus = await prisma.navMenu.findMany({
    where: { tenantId: 'salupangkang' },
    include: {
      children: {
        include: {
          children: true
        }
      }
    },
    orderBy: { orderIndex: 'asc' }
  });

  console.log(`Total menus found: ${menus.length}`);
  const rootMenus = menus.filter(m => !m.parentId);
  console.log('Root menus:', rootMenus.map(m => ({
    id: m.id,
    title: m.title,
    url: m.url,
    children: m.children.map(c => ({
      id: c.id,
      title: c.title,
      url: c.url,
      children: c.children.map(sc => ({ id: sc.id, title: sc.title, url: sc.url }))
    }))
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
