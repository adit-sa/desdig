import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('=== LIST TENANT DI DATABASE ===');
  tenants.forEach(t => {
    console.log(`- Nama: ${t.namaDesa} | Slug: ${t.slug} | Kode Desa: ${t.kodeDesa}`);
  });

  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: { tenant: true }
      }
    }
  });
  console.log('\n=== LIST USER DI DATABASE ===');
  users.forEach(u => {
    console.log(`User: ${u.email} | GlobalRole: ${u.globalRole}`);
    u.memberships.forEach(m => {
      console.log(`  -> Desa: ${m.tenant.namaDesa} (${m.tenant.kodeDesa}) | Role: ${m.role}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
