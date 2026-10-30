import { PrismaClient, TenantRole } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

async function importAllUsers() {
  console.log('🚀 Memulai Impor Seluruh 28 Akun Pengguna / Aparatur Salupangkang ke Neon...');

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    console.error('❌ Tenant Salupangkang tidak ditemukan!');
    return;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream('backup-on-2026-10-22-07-42-55.sql', 'utf8'),
  });

  let inUser = false;
  const list: any[] = [];

  for await (const line of rl) {
    if (line.includes('INSERT INTO `user`') || line.includes('INSERT INTO `users`')) {
      inUser = true;
      continue;
    }
    if (inUser) {
      if (line.trim().startsWith('(')) {
        const clean = line.trim().replace(/^\(/, '').replace(/[\);,]+$/, '');
        const tokens = clean.split('\t').map((t) => t.trim().replace(/^['"]|['",]+$/g, '').trim());
        const id = tokens[0];
        const username = tokens[2];
        const rawPassword = tokens[3];
        const idGrup = tokens[5];
        const email = tokens[7] && tokens[7] !== 'NULL' && tokens[7].includes('@')
          ? tokens[7]
          : `${username.toLowerCase()}@salupangkang.desa.id`;
        const nama = tokens[15] && tokens[15] !== 'NULL' ? tokens[15] : username;

        // PHP bcrypt $2y$ disesuaikan ke $2a$ agar standard di Node bcryptjs
        const passwordHash = rawPassword.startsWith('$2y$')
          ? rawPassword.replace(/^\$2y\$/, '$2a$')
          : rawPassword;

        // Role mapping: grup 1 (administrator) -> VILLAGE_ADMIN, lainnya EDITOR / APARATUR
        let role = TenantRole.APARATUR;
        if (idGrup === '1' || username === 'admin' || username === 'sapiil') {
          role = TenantRole.VILLAGE_ADMIN;
        } else if (idGrup === '2') {
          role = TenantRole.EDITOR;
        }

        list.push({ id, username, nama, email, passwordHash, role });
      } else {
        inUser = false;
      }
    }
  }

  console.log(`📋 Memproses ${list.length} akun pengguna...`);

  let count = 0;
  for (const u of list) {
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.nama,
        passwordHash: u.passwordHash,
      },
      create: {
        name: u.nama,
        email: u.email,
        passwordHash: u.passwordHash,
      },
    });

    // 2. Upsert Membership di Salupangkang
    await prisma.tenantMembership.upsert({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id,
        },
      },
      update: {
        role: u.role,
      },
      create: {
        tenantId: tenant.id,
        userId: user.id,
        role: u.role,
      },
    });

    count++;
  }

  console.log(`✅ BERHASIL MENGIMPOR & MENGAITKAN ${count} AKUN PENGGUNA KE DESA SALUPANGKANG!`);
}

importAllUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
