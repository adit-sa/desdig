#!/usr/bin/env node
/**
 * desDig (desa Digital) MCP Server
 * Model Context Protocol (MCP) Server resmi untuk otomatisasi dan integrasi AI pada platform desDig.
 * 
 * Memungkinkan AI Assistant (Antigravity, Claude Desktop, Cursor, dll.) untuk:
 * - Menambah desa baru (Multi-tenant SaaS Onboarding)
 * - Menambah dan mengimpor data kependudukan (Penduduk & KK)
 * - Menerbitkan warta berita & pengumuman desa
 * - Mengelola aparatur pamong desa
 * - Mencatat proyek pembangunan fisik & APBDes
 * - Mengaudit dan membersihkan berkas media yatim di Cloudflare R2
 */

import fs from 'fs';
import path from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// 1. Muat Environment Variables (.env) jika dijalankan secara standalone
function loadEnvironment() {
  const possiblePaths = [
    path.join(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
    'C:\\app\\opensid\\.env',
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
      break;
    }
  }
}
loadEnvironment();

// Import Prisma Client & Helpers setelah env termuat
import { prisma } from '../lib/prisma';
import { formatKodeKemendagri } from '../lib/formatters';
import { getTenantMediaFiles, cleanupTenantOrphanFiles } from '../lib/media';
import { SubscriptionStatus } from '@prisma/client';

// Helper helper resolver tenant
async function resolveTenant(tenantIdentifier: string) {
  const clean = tenantIdentifier.trim().toLowerCase();
  const cleanDigits = clean.replace(/\D/g, '');

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: { equals: clean, mode: 'insensitive' } },
        { id: clean },
        { kodeDesa: clean },
        ...(cleanDigits ? [{ kodeDesa: cleanDigits }] : []),
      ],
    },
    include: {
      plan: true,
      domains: true,
    },
  });

  return tenant;
}

// Inisialisasi MCP Server
const server = new McpServer({
  name: 'desdig-mcp',
  version: '1.0.0',
});

// ============================================================================
// 1. TOOL: desdig_list_villages (Daftar Seluruh Desa SaaS)
// ============================================================================
server.tool(
  'desdig_list_villages',
  'Melihat daftar seluruh desa (tenant) yang terdaftar di platform desDig SaaS beserta ringkasan statistik singkatnya.',
  {
    limit: z.number().optional().default(30).describe('Batas jumlah desa yang ditampilkan'),
    search: z.string().optional().describe('Kata kunci pencarian nama desa atau kecamatan'),
  },
  async ({ limit, search }) => {
    try {
      const whereCondition = search
        ? {
            OR: [
              { namaDesa: { contains: search, mode: 'insensitive' as const } },
              { kecamatan: { contains: search, mode: 'insensitive' as const } },
              { kabupaten: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : undefined;

      const tenants = await prisma.tenant.findMany({
        where: whereCondition,
        take: limit,
        orderBy: { namaDesa: 'asc' },
        include: {
          domains: true,
          plan: { select: { name: true, code: true } },
          _count: {
            select: {
              residents: true,
              articles: true,
              officials: true,
              developmentProjects: true,
            },
          },
        },
      });

      const formatted = tenants.map((t) => ({
        id: t.id,
        slug: t.slug,
        namaDesa: t.namaDesa,
        kodeDesa: t.kodeDesa,
        kecamatan: t.kecamatan,
        kabupaten: t.kabupaten,
        provinsi: t.provinsi,
        kepalaDesa: t.kepalaDesa || 'Belum diisi',
        temaAktif: t.activeThemeId,
        paket: t.plan?.name || 'Standard',
        domainUtama: t.domains.find((d) => d.isPrimary)?.domain || `${t.slug}.desdig.id`,
        statistik: {
          totalPenduduk: t._count.residents,
          totalArtikel: t._count.articles,
          totalPamong: t._count.officials,
          totalProyekPembangunan: t._count.developmentProjects,
        },
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                total: formatted.length,
                villages: formatted,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal memuat daftar desa: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 2. TOOL: desdig_create_village (Pendaftaran Desa Baru Multi-Tenant)
// ============================================================================
server.tool(
  'desdig_create_village',
  'Mendaftarkan desa baru ke sistem desDig SaaS. Otomatis membuat isolasi tenant, konfigurasi tema, aktivasi modul, domain, dan akun login admin desa.',
  {
    namaDesa: z.string().describe('Nama resmi desa, contoh: "Sukamulya" atau "Mekarmukti"'),
    slug: z.string().optional().describe('Slug URL desa (huruf kecil & tanda hubung). Jika kosong, otomatis digenerate dari nama desa'),
    kodeDesa: z.string().optional().describe('Kode wilayah Kemendagri 10 digit, contoh: "32.05.11.2005" atau "3205112005"'),
    kecamatan: z.string().describe('Nama kecamatan'),
    kabupaten: z.string().describe('Nama kabupaten/kota'),
    provinsi: z.string().optional().default('Jawa Barat').describe('Nama provinsi'),
    kepalaDesa: z.string().optional().describe('Nama lengkap Kepala Desa yang menjabat'),
    telepon: z.string().optional().describe('Nomor kontak kantor desa / WhatsApp resmi'),
    email: z.string().optional().describe('Email resmi kantor desa'),
    adminEmail: z.string().optional().describe('Email login admin desa. Jika kosong, default: admin@{slug}.desa.id'),
    adminPassword: z.string().optional().describe('Password login admin desa. Jika kosong, digenerate acak aman'),
  },
  async (args) => {
    try {
      const {
        namaDesa,
        kecamatan,
        kabupaten,
        provinsi = 'Jawa Barat',
        kepalaDesa,
        telepon,
        email,
      } = args;

      const cleanSlug = (args.slug || namaDesa)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Cek apakah slug sudah terdaftar
      const existing = await prisma.tenant.findUnique({
        where: { slug: cleanSlug },
      });
      if (existing) {
        return {
          content: [{ type: 'text', text: `Gagal: Slug desa "${cleanSlug}" sudah digunakan oleh desa lain.` }],
          isError: true,
        };
      }

      // Ambil paket default (PROFESSIONAL atau tier pertama)
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { code: 'PROFESSIONAL' },
      }) || await prisma.subscriptionPlan.findFirst();

      const formattedKodeDesa = args.kodeDesa ? formatKodeKemendagri(args.kodeDesa) : null;

      // 1. Buat Tenant baru
      const newTenant = await prisma.tenant.create({
        data: {
          namaDesa,
          slug: cleanSlug,
          kodeDesa: formattedKodeDesa,
          kecamatan,
          kabupaten,
          provinsi,
          kepalaDesa: kepalaDesa || null,
          telepon: telepon || null,
          email: email || null,
          visi: 'Mewujudkan tata kelola desa yang transparan, maju, dan melayani.',
          misi: ['Meningkatkan kualitas pelayanan warga', 'Mengembangkan perekonomian dan potensi desa'],
          planId: plan?.id || null,
          activeThemeId: 'modern-government',
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
      });

      // 2. Buat domain default
      await prisma.domain.create({
        data: {
          tenantId: newTenant.id,
          domain: `${cleanSlug}.localhost:3000`,
          isPrimary: true,
          isVerified: true,
        },
      });

      // 3. Buat konfigurasi tema awal
      await prisma.tenantThemeConfig.create({
        data: {
          tenantId: newTenant.id,
          themeId: 'modern-government',
          isPublished: true,
          settings: {
            showStats: true,
            showApbdes: true,
          },
        },
      });

      // 4. Aktifkan modul-modul awal yang diizinkan plan
      const defaultModules = plan?.allowedModules || [
        'profile', 'news', 'announcements', 'gallery', 'officials',
        'residents', 'apbdes', 'development', 'ppid', 'market',
      ];
      for (const modKey of defaultModules) {
        await prisma.tenantModule.create({
          data: {
            tenantId: newTenant.id,
            moduleKey: modKey,
            isEnabled: true,
          },
        });
      }

      // 5. Buat Akun Admin Desa
      const adminEmail = args.adminEmail || `admin@${cleanSlug}.desa.id`;
      const generatedPassword = args.adminPassword || Math.random().toString(36).slice(-8) + 'Desa2026!';
      const passwordHash = await bcrypt.hash(generatedPassword, 10);

      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: { passwordHash },
        create: {
          email: adminEmail,
          name: `Admin Desa ${namaDesa}`,
          passwordHash,
          globalRole: 'USER',
        },
      });

      await prisma.tenantMembership.create({
        data: {
          tenantId: newTenant.id,
          userId: adminUser.id,
          role: 'VILLAGE_ADMIN',
        },
      });

      // Catat ke Audit Log
      await prisma.auditLog.create({
        data: {
          tenantId: newTenant.id,
          action: 'TENANT_REGISTER_MCP',
          resource: `Desa baru dibuat via desDig MCP Server: ${newTenant.namaDesa} (${newTenant.slug})`,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Desa ${namaDesa} berhasil didaftarkan ke platform desDig!`,
                desa: {
                  id: newTenant.id,
                  namaDesa: newTenant.namaDesa,
                  slug: newTenant.slug,
                  kodeDesa: newTenant.kodeDesa,
                  kecamatan: newTenant.kecamatan,
                  kabupaten: newTenant.kabupaten,
                  provinsi: newTenant.provinsi,
                  kepalaDesa: newTenant.kepalaDesa,
                  portalUrl: `/?tenant=${newTenant.slug}`,
                  adminUrl: `/admin?tenant=${newTenant.slug}`,
                },
                kredensialAdmin: {
                  email: adminEmail,
                  password: generatedPassword,
                  catatan: 'Simpan kredensial ini untuk login ke panel admin desa.',
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal mendaftarkan desa baru: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 3. TOOL: desdig_get_village (Detail & Ringkasan Dashboard Desa)
// ============================================================================
server.tool(
  'desdig_get_village',
  'Mengambil informasi lengkap profil desa, data statistik kependudukan, pamong, artikel, proyek pembangunan, dan tema aktif berdasarkan slug desa.',
  {
    tenantSlug: z.string().describe('Slug desa target (contoh: "salupangkang")'),
  },
  async ({ tenantSlug }) => {
    try {
      const tenant = await resolveTenant(tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const [residents, officials, articles, announcements, projects, apbdes] = await Promise.all([
        prisma.resident.findMany({
          where: { tenantId: tenant.id },
          select: { jenisKelamin: true, noKk: true, statusDasar: true, dusun: true },
        }),
        prisma.villageOfficial.findMany({
          where: { tenantId: tenant.id, isActive: true },
          select: { name: true, position: true },
        }),
        prisma.article.count({ where: { tenantId: tenant.id } }),
        prisma.announcement.count({ where: { tenantId: tenant.id } }),
        prisma.developmentProject.findMany({
          where: { tenantId: tenant.id },
          select: { judul: true, anggaran: true, status: true, progressPersen: true },
        }),
        prisma.apbdesItem.findMany({
          where: { tenantId: tenant.id },
          select: { category: true, budget: true, realization: true },
        }),
      ]);

      const totalPenduduk = residents.length;
      const totalLaki = residents.filter((r) => r.jenisKelamin === 'L').length;
      const totalPerempuan = residents.filter((r) => r.jenisKelamin === 'P').length;
      const uniqueKK = new Set(residents.map((r) => r.noKk).filter(Boolean)).size;

      const totalAnggaranProyek = projects.reduce((acc, p) => acc + Number(p.anggaran || BigInt(0)), 0);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                profil: {
                  id: tenant.id,
                  namaDesa: tenant.namaDesa,
                  slug: tenant.slug,
                  kodeDesa: tenant.kodeDesa,
                  kecamatan: tenant.kecamatan,
                  kabupaten: tenant.kabupaten,
                  provinsi: tenant.provinsi,
                  kepalaDesa: tenant.kepalaDesa,
                  telepon: tenant.telepon,
                  email: tenant.email,
                  alamatKantor: tenant.alamatKantor,
                  temaAktif: tenant.activeThemeId,
                  paket: tenant.plan?.name,
                },
                statistikKependudukan: {
                  totalPenduduk,
                  lakiLaki: totalLaki,
                  perempuan: totalPerempuan,
                  kepalaKeluarga: uniqueKK,
                },
                aparaturPamong: {
                  totalAktif: officials.length,
                  daftar: officials.map((o) => `${o.name} (${o.position})`),
                },
                kontenDanPembangunan: {
                  totalArtikelBerita: articles,
                  totalPengumuman: announcements,
                  totalProyekPembangunan: projects.length,
                  totalNilaiProyek: `Rp ${totalAnggaranProyek.toLocaleString('id-ID')}`,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal mengambil profil desa: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 4. TOOL: desdig_update_village (Perbarui Profil, Visi, Misi & Tema Desa)
// ============================================================================
server.tool(
  'desdig_update_village',
  'Memperbarui data identitas desa seperti Nama Kades, Visi, Misi, Kontak, Logo, Banner Hero, dan Tema Aktif.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    kepalaDesa: z.string().optional().describe('Nama Kepala Desa yang baru'),
    visi: z.string().optional().describe('Teks visi desa'),
    misi: z.array(z.string()).optional().describe('Daftar butir-butir misi desa'),
    telepon: z.string().optional().describe('Nomor kontak/WA desa'),
    email: z.string().optional().describe('Email resmi desa'),
    alamatKantor: z.string().optional().describe('Alamat kantor desa'),
    logoUrl: z.string().optional().describe('URL logo desa resmi'),
    heroImageUrl: z.string().optional().describe('URL gambar banner beranda desa'),
    activeThemeId: z.string().optional().describe('Tema aktif: modern-government, traditional-village, modern-editorial'),
  },
  async ({ tenantSlug, ...updates }) => {
    try {
      const tenant = await resolveTenant(tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          ...(updates.kepalaDesa !== undefined && { kepalaDesa: updates.kepalaDesa }),
          ...(updates.visi !== undefined && { visi: updates.visi }),
          ...(updates.misi !== undefined && { misi: updates.misi }),
          ...(updates.telepon !== undefined && { telepon: updates.telepon }),
          ...(updates.email !== undefined && { email: updates.email }),
          ...(updates.alamatKantor !== undefined && { alamatKantor: updates.alamatKantor }),
          ...(updates.logoUrl !== undefined && { logoUrl: updates.logoUrl }),
          ...(updates.heroImageUrl !== undefined && { heroImageUrl: updates.heroImageUrl }),
          ...(updates.activeThemeId !== undefined && { activeThemeId: updates.activeThemeId }),
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Profil desa ${updated.namaDesa} berhasil diperbarui.`,
                updatedData: {
                  kepalaDesa: updated.kepalaDesa,
                  telepon: updated.telepon,
                  email: updated.email,
                  activeThemeId: updated.activeThemeId,
                  logoUrl: updated.logoUrl,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal memperbarui profil desa: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 5. TOOL: desdig_add_resident (Tambah Data Penduduk Baru)
// ============================================================================
server.tool(
  'desdig_add_resident',
  'Menambahkan data 1 warga / penduduk baru ke Buku Induk Kependudukan desa.',
  {
    tenantSlug: z.string().describe('Slug desa target (contoh: "salupangkang")'),
    nik: z.string().describe('Nomor Induk Kependudukan (16 digit)'),
    noKk: z.string().describe('Nomor Kartu Keluarga (16 digit)'),
    nama: z.string().describe('Nama lengkap penduduk sesuai KTP/KK'),
    hubunganKeluarga: z.string().optional().default('KEPALA KELUARGA').describe('Hubungan keluarga: KEPALA KELUARGA, SUAMI, ISTRI, ANAK, dll'),
    jenisKelamin: z.enum(['L', 'P']).describe('L (Laki-laki) atau P (Perempuan)'),
    tempatLahir: z.string().optional().describe('Tempat lahir'),
    tanggalLahir: z.string().optional().describe('Tanggal lahir (Format: YYYY-MM-DD, contoh: "1990-05-15")'),
    agama: z.string().optional().default('ISLAM').describe('Agama: ISLAM, KRISTEN, KATOLIK, HINDU, BUDHA, KONGHUCU'),
    pendidikan: z.string().optional().describe('Pendidikan terakhir (SD, SMP, SMA, S1, dll)'),
    pekerjaan: z.string().optional().describe('Pekerjaan utama (PETANI, WIRASWASTA, PNS, dll)'),
    statusKawin: z.string().optional().default('BELUM KAWIN').describe('BELUM KAWIN, KAWIN, CERAI HIDUP, CERAI MATI'),
    golonganDarah: z.string().optional().default('TIDAK TAHU').describe('Golongan darah: A, B, AB, O, TIDAK TAHU'),
    dusun: z.string().optional().describe('Nama Dusun / Lingkungan tempat tinggal'),
    rt: z.string().optional().describe('Nomor RT (contoh: "001")'),
    rw: z.string().optional().describe('Nomor RW (contoh: "002")'),
    alamat: z.string().optional().describe('Alamat jalan / nomor rumah'),
    fotoUrl: z.string().optional().describe('URL foto wajah penduduk'),
  },
  async (args) => {
    try {
      const tenant = await resolveTenant(args.tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${args.tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const cleanNik = args.nik.trim();
      const existing = await prisma.resident.findFirst({
        where: { tenantId: tenant.id, nik: cleanNik },
      });

      if (existing) {
        return {
          content: [{ type: 'text', text: `Gagal: Penduduk dengan NIK "${cleanNik}" sudah terdaftar di Desa ${tenant.namaDesa}.` }],
          isError: true,
        };
      }

      let parsedTanggalLahir: Date | null = null;
      if (args.tanggalLahir) {
        const d = new Date(args.tanggalLahir);
        if (!isNaN(d.getTime())) {
          parsedTanggalLahir = d;
        }
      }

      const resident = await prisma.resident.create({
        data: {
          tenantId: tenant.id,
          nik: cleanNik,
          noKk: args.noKk.trim(),
          nama: args.nama.trim().toUpperCase(),
          hubunganKeluarga: args.hubunganKeluarga.toUpperCase(),
          jenisKelamin: args.jenisKelamin,
          tempatLahir: args.tempatLahir ? args.tempatLahir.trim() : null,
          tanggalLahir: parsedTanggalLahir,
          agama: args.agama.toUpperCase(),
          pendidikan: args.pendidikan || null,
          pekerjaan: args.pekerjaan || null,
          statusKawin: args.statusKawin.toUpperCase(),
          golonganDarah: args.golonganDarah.toUpperCase(),
          dusun: args.dusun ? args.dusun.trim() : null,
          rt: args.rt ? args.rt.trim() : null,
          rw: args.rw ? args.rw.trim() : null,
          alamat: args.alamat ? args.alamat.trim() : null,
          fotoUrl: args.fotoUrl ? args.fotoUrl.trim() : null,
          statusDasar: 'Hidup',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Penduduk ${resident.nama} (NIK: ${resident.nik}) berhasil ditambahkan ke Desa ${tenant.namaDesa}.`,
                resident: {
                  id: resident.id,
                  nik: resident.nik,
                  noKk: resident.noKk,
                  nama: resident.nama,
                  jenisKelamin: resident.jenisKelamin,
                  dusun: resident.dusun,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal menambahkan penduduk: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 6. TOOL: desdig_batch_import_residents (Import Massal Penduduk)
// ============================================================================
server.tool(
  'desdig_batch_import_residents',
  'Mengimpor banyak data penduduk sekaligus (batch import) dari daftar JSON ke database desa.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    residents: z.array(
      z.object({
        nik: z.string(),
        noKk: z.string(),
        nama: z.string(),
        jenisKelamin: z.enum(['L', 'P']),
        hubunganKeluarga: z.string().optional().default('KEPALA KELUARGA'),
        tempatLahir: z.string().optional(),
        tanggalLahir: z.string().optional(),
        agama: z.string().optional().default('ISLAM'),
        pekerjaan: z.string().optional(),
        dusun: z.string().optional(),
        rt: z.string().optional(),
        rw: z.string().optional(),
        alamat: z.string().optional(),
      })
    ).describe('Array data penduduk yang akan diimpor'),
  },
  async ({ tenantSlug, residents }) => {
    try {
      const tenant = await resolveTenant(tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      let successCount = 0;
      let skippedCount = 0;

      for (const item of residents) {
        const cleanNik = item.nik.trim();
        const exists = await prisma.resident.findFirst({
          where: { tenantId: tenant.id, nik: cleanNik },
        });

        if (exists) {
          skippedCount++;
          continue;
        }

        let parsedTgl: Date | null = null;
        if (item.tanggalLahir) {
          const d = new Date(item.tanggalLahir);
          if (!isNaN(d.getTime())) parsedTgl = d;
        }

        await prisma.resident.create({
          data: {
            tenantId: tenant.id,
            nik: cleanNik,
            noKk: item.noKk.trim(),
            nama: item.nama.trim().toUpperCase(),
            jenisKelamin: item.jenisKelamin,
            hubunganKeluarga: (item.hubunganKeluarga || 'KEPALA KELUARGA').toUpperCase(),
            tempatLahir: item.tempatLahir || null,
            tanggalLahir: parsedTgl,
            agama: (item.agama || 'ISLAM').toUpperCase(),
            pekerjaan: item.pekerjaan || null,
            dusun: item.dusun || null,
            rt: item.rt || null,
            rw: item.rw || null,
            alamat: item.alamat || null,
            statusDasar: 'Hidup',
          },
        });

        successCount++;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Import kependudukan selesai untuk Desa ${tenant.namaDesa}.`,
                berhasilDitambahkan: successCount,
                dilewatiSudahAda: skippedCount,
                totalDiproses: residents.length,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal import penduduk massal: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 7. TOOL: desdig_create_article (Terbitkan Berita / Warta Desa)
// ============================================================================
server.tool(
  'desdig_create_article',
  'Menerbitkan artikel berita atau warta kegiatan desa baru di portal publik website desa.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    title: z.string().describe('Judul berita artikel'),
    categoryName: z.string().optional().default('Berita Desa').describe('Kategori berita (misal: "Kegiatan Desa", "Pembangunan", "Pengumuman")'),
    content: z.string().describe('Isi lengkap berita dalam format teks atau HTML'),
    summary: z.string().optional().describe('Ringkasan singkat warta. Jika kosong, digenerate otomatis dari isi warta'),
    coverImageUrl: z.string().optional().describe('URL foto cover berita (contoh: "/uploads/salupangkang/artikel/foto.webp")'),
    isFeatured: z.boolean().optional().default(false).describe('Jadikan artikel sorotan utama di halaman depan'),
    published: z.boolean().optional().default(true).describe('Langsung terbitkan ke publik (true/false)'),
  },
  async (args) => {
    try {
      const tenant = await resolveTenant(args.tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${args.tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      // Generate slug artikel
      let baseSlug = args.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      if (!baseSlug) baseSlug = 'berita-' + Date.now();

      // Cek duplikasi slug di tenant
      let articleSlug = baseSlug;
      let counter = 1;
      while (
        await prisma.article.findFirst({
          where: { tenantId: tenant.id, slug: articleSlug },
        })
      ) {
        articleSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Cari atau buat kategori di bawah tenant ini
      const catSlug = args.categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      let category = await prisma.category.findFirst({
        where: { tenantId: tenant.id, slug: catSlug },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            tenantId: tenant.id,
            name: args.categoryName,
            slug: catSlug,
          },
        });
      }

      // Generate ringkasan jika kosong
      const summary =
        args.summary ||
        args.content
          .replace(/<[^>]+>/g, '')
          .slice(0, 160)
          .trim() + '...';

      const article = await prisma.article.create({
        data: {
          tenantId: tenant.id,
          categoryId: category.id,
          title: args.title.trim(),
          slug: articleSlug,
          summary,
          content: args.content,
          coverImageUrl: args.coverImageUrl || null,
          status: args.published ? 'PUBLISHED' : 'DRAFT',
          publishedAt: args.published ? new Date() : null,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Artikel "${article.title}" berhasil diterbitkan untuk Desa ${tenant.namaDesa}!`,
                article: {
                  id: article.id,
                  title: article.title,
                  slug: article.slug,
                  kategori: category.name,
                  status: article.status,
                  urlPublik: `/berita/${article.slug}?tenant=${tenant.slug}`,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal menerbitkan artikel: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 8. TOOL: desdig_create_announcement (Buat Pengumuman Resmi Desa)
// ============================================================================
server.tool(
  'desdig_create_announcement',
  'Menerbitkan pengumuman resmi desa yang akan tampil di widget pengumuman beranda portal warga.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    title: z.string().describe('Judul pengumuman resmi'),
    content: z.string().describe('Isi lengkap pengumuman'),
    priority: z.enum(['REGULAR', 'URGENT', 'CRITICAL']).optional().default('REGULAR').describe('Tingkat urgensi pengumuman'),
    published: z.boolean().optional().default(true),
  },
  async (args) => {
    try {
      const tenant = await resolveTenant(args.tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${args.tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const announcement = await prisma.announcement.create({
        data: {
          tenantId: tenant.id,
          title: args.title.trim(),
          content: args.content,
          isPinned: args.priority === 'CRITICAL' || args.priority === 'URGENT',
          status: args.published ? 'PUBLISHED' : 'DRAFT',
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Pengumuman "${announcement.title}" berhasil diterbitkan di portal Desa ${tenant.namaDesa}.`,
                announcement: {
                  id: announcement.id,
                  title: announcement.title,
                  status: announcement.status,
                  isPinned: announcement.isPinned,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal menerbitkan pengumuman: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 9. TOOL: desdig_add_village_official (Tambah Aparatur Pamong Desa)
// ============================================================================
server.tool(
  'desdig_add_village_official',
  'Mendaftarkan aparatur pamong desa baru ke bagan struktur pemerintahan desa.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    name: z.string().describe('Nama lengkap aparatur pamong beserta gelar'),
    position: z.string().describe('Jabatan resmi (Kepala Desa, Sekretaris Desa, Kaur Keuangan, Kadus, dll)'),
    nip: z.string().optional().describe('NIP / Nomor Induk Perangkat Desa (jika ada)'),
    phone: z.string().optional().describe('Nomor kontak/WA aparatur'),
    email: z.string().optional().describe('Email resmi aparatur'),
    photoUrl: z.string().optional().describe('URL foto wajah resmi pamong'),
    orderIndex: z.number().optional().default(10).describe('Urutan hierarki bagan aparatur (angka kecil tampil lebih atas)'),
  },
  async (args) => {
    try {
      const tenant = await resolveTenant(args.tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${args.tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const official = await prisma.villageOfficial.create({
        data: {
          tenantId: tenant.id,
          name: args.name.trim(),
          position: args.position.trim(),
          nip: args.nip ? args.nip.trim() : null,
          photoUrl: args.photoUrl ? args.photoUrl.trim() : null,
          orderIndex: args.orderIndex,
          isActive: true,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Pamong ${official.name} (${official.position}) berhasil ditambahkan ke struktur Desa ${tenant.namaDesa}.`,
                official: {
                  id: official.id,
                  name: official.name,
                  position: official.position,
                  nip: official.nip,
                  orderIndex: official.orderIndex,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal menambahkan aparatur pamong: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 10. TOOL: desdig_add_development_project (Tambah Proyek Fisik APBDes)
// ============================================================================
server.tool(
  'desdig_add_development_project',
  'Mencatat proyek fisik pembangunan desa (APBDes) lengkap dengan anggaran, lokasi, volume, pelaksana, dan progres.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    judul: z.string().describe('Nama proyek pembangunan (contoh: "Pembangunan Rabat Beton Jalan Usaha Tani")'),
    deskripsi: z.string().optional().describe('Uraian rinci proyek fisik'),
    lokasi: z.string().describe('Lokasi pengerjaan pembangunan'),
    tahunAnggaran: z.number().optional().default(2026).describe('Tahun anggaran APBDes'),
    anggaran: z.number().describe('Nilai pagu anggaran dalam angka Rupiah (contoh: 125000000)'),
    sumberDana: z.string().optional().default('Dana Desa (DDS)').describe('Sumber dana: DDS, ADD, PADes, Bankeu Provinsi'),
    pelaksana: z.string().optional().default('TPK Desa').describe('Pelaksana kegiatan'),
    volume: z.string().optional().describe('Volume fisik (contoh: "Panjang 500m x Lebar 2.5m")'),
    persentaseProgres: z.number().optional().default(0).describe('Persentase progres fisik (0-100)'),
    status: z.string().optional().default('PROSES').describe('Status: PERENCANAAN, PROSES, SELESAI'),
    foto: z.string().optional().describe('URL foto progres fisik lapangan'),
  },
  async (args) => {
    try {
      const tenant = await resolveTenant(args.tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${args.tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      let slug = args.judul
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      if (!slug) slug = 'proyek-' + Date.now();

      const project = await prisma.developmentProject.create({
        data: {
          tenantId: tenant.id,
          judul: args.judul.trim(),
          slug,
          keterangan: args.deskripsi || null,
          lokasi: args.lokasi.trim(),
          tahunAnggaran: args.tahunAnggaran,
          anggaran: BigInt(args.anggaran),
          sumberDana: args.sumberDana,
          pelaksanaKegiatan: args.pelaksana,
          volume: args.volume || null,
          progressPersen: args.persentaseProgres,
          status: args.status,
          foto: args.foto || null,
        },
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: `Proyek "${project.judul}" berhasil dicatat pada APBDes Desa ${tenant.namaDesa}.`,
                project: {
                  id: project.id,
                  judul: project.judul,
                  lokasi: project.lokasi,
                  anggaran: `Rp ${Number(project.anggaran).toLocaleString('id-ID')}`,
                  sumberDana: project.sumberDana,
                  progres: `${project.progressPersen}%`,
                  status: project.status,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal mencatat proyek pembangunan: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 11. TOOL: desdig_cleanup_orphan_media (Bersihkan File Yatim di R2)
// ============================================================================
server.tool(
  'desdig_cleanup_orphan_media',
  'Memindai dan menghapus seluruh berkas foto yatim (yang tidak terpakai pada artikel, galeri, pamong, penduduk, atau pembangunan) dari Cloudflare R2 untuk menghemat kapasitas storage.',
  {
    tenantSlug: z.string().describe('Slug desa target'),
  },
  async ({ tenantSlug }) => {
    try {
      const tenant = await resolveTenant(tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const result = await cleanupTenantOrphanFiles(tenant.slug, tenant.id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message:
                  result.deletedCount > 0
                    ? `Berhasil membersihkan ${result.deletedCount} berkas yatim di Cloudflare R2 Desa ${tenant.namaDesa}. Menghemat ${result.freedBytesFormatted} ruang penyimpanan.`
                    : `Tidak ada berkas yatim yang ditemukan di Desa ${tenant.namaDesa}. Seluruh berkas aktif terintegrasi dengan database.`,
                statistik: {
                  berkasDihapus: result.deletedCount,
                  kapasitasDihemat: result.freedBytesFormatted,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal membersihkan berkas yatim: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// 12. TOOL: desdig_list_media_files (Daftar Berkas Media Server)
// ============================================================================
server.tool(
  'desdig_list_media_files',
  'Melihat daftar berkas media foto/video yang tersimpan di Cloudflare R2 desa beserta status integrasi database (apakah aktif dipakai atau yatim).',
  {
    tenantSlug: z.string().describe('Slug desa target'),
    folder: z.string().optional().default('all').describe('Filter subfolder: artikel, galeri, user_pict, pembangunan, identitas, atau all'),
    status: z.enum(['all', 'used', 'unused']).optional().default('all').describe('Filter status: all (semua), used (terintegrasi aktif), unused (yatim)'),
    limit: z.number().optional().default(20).describe('Batas jumlah berkas'),
  },
  async ({ tenantSlug, folder, status, limit }) => {
    try {
      const tenant = await resolveTenant(tenantSlug);
      if (!tenant) {
        return {
          content: [{ type: 'text', text: `Desa dengan slug "${tenantSlug}" tidak ditemukan.` }],
          isError: true,
        };
      }

      const scanResult = await getTenantMediaFiles(tenant.slug, tenant.id);
      let files = scanResult.files;

      if (folder && folder !== 'all') {
        files = files.filter((f) => f.folder.toLowerCase() === folder.toLowerCase());
      }

      if (status === 'used') {
        files = files.filter((f) => f.isUsed);
      } else if (status === 'unused') {
        files = files.filter((f) => !f.isUsed);
      }

      const paged = files.slice(0, limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                desa: tenant.namaDesa,
                ringkasanStorage: scanResult.stats,
                totalDitemukan: files.length,
                files: paged.map((f) => ({
                  nama: f.name,
                  folder: f.folder,
                  url: f.url,
                  ukuran: f.sizeFormatted,
                  terintegrasi: f.isUsed,
                  dipakaiPada: f.usedIn,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: `Gagal memuat daftar media: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ============================================================================
// Menjalankan Server MCP via STDIO Transport
// ============================================================================
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[desDig MCP Server] Berhasil berjalan via STDIO transport.');
}

runServer().catch((err) => {
  console.error('[desDig MCP Server Fatal Error]', err);
  process.exit(1);
});

