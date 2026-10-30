import { PrismaClient } from './prisma-client-v4';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient =
  (globalForPrisma.prisma && (globalForPrisma.prisma as any).kioskDevice ? globalForPrisma.prisma : null) ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
