import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper eksekusi Prisma dengan auto-retry otomatis saat koneksi serverless
 * (seperti Neon PostgreSQL / PgBouncer pooler) mengalami cold start atau connection reset sementara.
 */
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 200
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      const errorMessage = String(error?.message || '');
      const errorCode = String(error?.code || '');

      const isTransientConnectionError =
        errorCode === 'P1001' || // Can't reach database server
        errorCode === 'P2024' || // Connection pool timeout
        errorCode === 'P1017' || // Server has closed the connection
        errorMessage.includes('ConnectionReset') ||
        errorMessage.includes('Connection reset') ||
        errorMessage.includes('closed the connection') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ECONNRESET');

      if (isTransientConnectionError && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }
}

export default prisma;
