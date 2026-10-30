import { prisma } from '../lib/prisma';

async function createNavMenuTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NavMenu" (
      "id" TEXT PRIMARY KEY,
      "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "parentId" TEXT REFERENCES "NavMenu"("id") ON DELETE CASCADE,
      "orderIndex" INTEGER NOT NULL DEFAULT 0,
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "isExternal" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NavMenu_tenantId_orderIndex_idx" ON "NavMenu"("tenantId", "orderIndex")
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NavMenu_tenantId_parentId_idx" ON "NavMenu"("tenantId", "parentId")
  `);

  console.log('✅ Tabel NavMenu berhasil dibuat di database PostgreSQL!');
}

createNavMenuTable()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
