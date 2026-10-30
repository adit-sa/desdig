import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('superadmin123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@platform.desa.id' },
    update: {
      passwordHash: hash,
      globalRole: 'SUPER_ADMIN',
      name: 'Super Admin SaaS',
    },
    create: {
      email: 'superadmin@platform.desa.id',
      passwordHash: hash,
      globalRole: 'SUPER_ADMIN',
      name: 'Super Admin SaaS',
    },
  });
  console.log('Superadmin siap:', user.email, 'globalRole:', user.globalRole);
}

main().catch(console.error).finally(() => prisma.$disconnect());
