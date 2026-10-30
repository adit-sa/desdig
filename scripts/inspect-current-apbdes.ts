import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const salupangkang = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
    select: { id: true, namaDesa: true }
  });
  console.log('Salupangkang tenant:', salupangkang);
  if (!salupangkang) return;

  const items = await prisma.apbdesItem.findMany({
    where: { tenantId: salupangkang.id },
    orderBy: [{ year: 'desc' }, { accountCode: 'asc' }]
  });
  console.log('Total APBDes items:', items.length);
  items.forEach((i) => {
    console.log(
      `[${i.year}] [${i.category}] [${i.accountCode}] ${i.accountName} | Anggaran: ${i.budget.toString()} | Realisasi: ${i.realization.toString()}`
    );
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
