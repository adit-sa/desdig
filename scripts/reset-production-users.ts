import { PrismaClient, GlobalRole, TenantRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSecurePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

async function main() {
  console.log('🔒 MEMULAI PEMBERSIHAN AKUN: MENYISAKAN HANYA 2 AKUN PRODUKSI RESMI...\n');

  const superAdminEmail = 'superadmindesa@adit.lt';
  const salupangkangEmail = 'kharismaerfin@salupangkang.desa.id.com';

  const superAdminPassword = generateSecurePassword(16);
  const salupangkangPassword = generateSecurePassword(16);

  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  const salupangkangHash = await bcrypt.hash(salupangkangPassword, 10);

  const salupangkang = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!salupangkang) {
    throw new Error('Tenant salupangkang tidak ditemukan di database!');
  }

  // 1. Buat / Upsert Akun Super Admin Master SaaS
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      name: 'Super Admin Master SaaS',
      passwordHash: superAdminHash,
      globalRole: GlobalRole.SUPER_ADMIN,
    },
    create: {
      name: 'Super Admin Master SaaS',
      email: superAdminEmail,
      passwordHash: superAdminHash,
      globalRole: GlobalRole.SUPER_ADMIN,
    },
  });

  // 2. Buat / Upsert Akun Admin Desa Salupangkang
  const saluAdmin = await prisma.user.upsert({
    where: { email: salupangkangEmail },
    update: {
      name: 'Kharisma Erfin (Admin Salupangkang)',
      passwordHash: salupangkangHash,
      globalRole: GlobalRole.USER,
    },
    create: {
      name: 'Kharisma Erfin (Admin Salupangkang)',
      email: salupangkangEmail,
      passwordHash: salupangkangHash,
      globalRole: GlobalRole.USER,
    },
  });

  // Hubungkan ke tenant Salupangkang sebagai VILLAGE_ADMIN
  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: salupangkang.id,
        userId: saluAdmin.id,
      },
    },
    update: {
      role: TenantRole.VILLAGE_ADMIN,
    },
    create: {
      tenantId: salupangkang.id,
      userId: saluAdmin.id,
      role: TenantRole.VILLAGE_ADMIN,
    },
  });

  // 3. Hapus seluruh membership akun lain
  const allowedUserIds = [superAdmin.id, saluAdmin.id];
  const deletedMemberships = await prisma.tenantMembership.deleteMany({
    where: {
      userId: { notIn: allowedUserIds },
    },
  });
  console.log(`🗑️ Dihapus ${deletedMemberships.count} membership akun lain.`);

  // Putuskan relasi User di tabel lain jika ada (misal Article author, AuditLog)
  await prisma.auditLog.deleteMany({
    where: {
      userId: { notIn: allowedUserIds },
    },
  });

  await prisma.article.updateMany({
    where: {
      authorId: { notIn: allowedUserIds },
    },
    data: {
      authorId: saluAdmin.id,
    },
  });

  // 4. Hapus seluruh akun pengguna lain
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: allowedUserIds },
    },
  });
  console.log(`🗑️ Dihapus ${deletedUsers.count} akun pengguna mock/lama.`);

  // 5. Verifikasi sisa user di database
  const remainingUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      globalRole: true,
      memberships: {
        select: {
          role: true,
          tenant: { select: { slug: true, namaDesa: true } },
        },
      },
    },
  });

  console.log('\n==================================================');
  console.log('✅ BERHASIL! HANYA TERSISA 2 AKUN RESMI DI DATABASE:');
  console.log('==================================================');
  console.log('1. AKUN SUPER ADMIN MASTER SAAS PLATFORM:');
  console.log(`   Email   : ${superAdminEmail}`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log(`   Role    : SUPER_ADMIN`);
  console.log('--------------------------------------------------');
  console.log('2. AKUN ADMIN DESA SALUPANGKANG:');
  console.log(`   Email   : ${salupangkangEmail}`);
  console.log(`   Password: ${salupangkangPassword}`);
  console.log(`   Desa    : Salupangkang (VILLAGE_ADMIN)`);
  console.log('==================================================\n');
  console.log('Simpan password ini dengan aman!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

