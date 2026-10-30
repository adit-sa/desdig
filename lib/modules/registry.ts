import { prisma } from '@/lib/prisma';
import { PlanTier } from '@prisma/client';

export interface ModuleDefinition {
  key: string;
  name: string;
  category: 'core' | 'content' | 'economy' | 'transparency' | 'service' | 'system';
  description: string;
  version: string;
  isCore: boolean;
  minPlan: PlanTier;
  iconName: string;
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  // 1. Core Modules
  {
    key: 'profile',
    name: 'Profil & Struktur Desa',
    category: 'core',
    description: 'Visi, misi, sejarah asal-usul, dan struktur aparatur pamong desa.',
    version: '1.0.0',
    isCore: true,
    minPlan: PlanTier.BASIC,
    iconName: 'Building2',
  },
  {
    key: 'news',
    name: 'Berita & Artikel Warga',
    category: 'content',
    description: 'Publikasi warta kegiatan, kabar warga, dan liputan pembangunan desa.',
    version: '1.0.0',
    isCore: true,
    minPlan: PlanTier.BASIC,
    iconName: 'Newspaper',
  },
  {
    key: 'announcements',
    name: 'Papan Pengumuman',
    category: 'content',
    description: 'Pengumuman resmi surat edaran, imbauan, dan jadwal kerja bakti.',
    version: '1.0.0',
    isCore: true,
    minPlan: PlanTier.BASIC,
    iconName: 'Megaphone',
  },
  {
    key: 'events',
    name: 'Agenda & Kalender Kegiatan',
    category: 'content',
    description: 'Jadwal musrenbang, posyandu serentak, dan perayaan hari besar.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'Calendar',
  },
  {
    key: 'gallery',
    name: 'Galeri Dokumentasi Foto',
    category: 'content',
    description: 'Dokumentasi visual foto dan album kegiatan kemasyarakatan.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.BASIC,
    iconName: 'Image',
  },
  {
    key: 'documents',
    name: 'Dokumen & Peraturan Desa',
    category: 'transparency',
    description: 'Publikasi Perdes, SK Kades, dan arsip dokumen publik resmi.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'FileText',
  },
  {
    key: 'tourism',
    name: 'Potensi & Wisata Desa',
    category: 'economy',
    description: 'Etalase destinasi wisata alam, budaya, dan sentra kerajinan desa.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'Compass',
  },
  {
    key: 'umkm',
    name: 'Direktori UMKM Lokal',
    category: 'economy',
    description: 'Katalog etalase produk lokal dan promosi usaha mikro warga binaan desa.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'ShoppingBag',
  },
  {
    key: 'apbdes',
    name: 'Transparansi APBDes',
    category: 'transparency',
    description: 'Infografis akuntabilitas pendapatan dan realisasi belanja anggaran desa.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'TrendingUp',
  },
  {
    key: 'complaints',
    name: 'Layanan Pengaduan Warga',
    category: 'service',
    description: 'Kanal aspirasi, keluhan infrastruktur, dan pelaporan fasilitas umum.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'MessageSquare',
  },
  {
    key: 'services',
    name: 'Layanan Mandiri Surat',
    category: 'service',
    description: 'Pengajuan surat pengantar administrasi kependudukan daring.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'MailCheck',
  },
  {
    key: 'statistics',
    name: 'Statistik Demografi',
    category: 'transparency',
    description: 'Grafik piramida usia, pekerjaan, dan demografi penduduk desa.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'BarChart3',
  },
  {
    key: 'ppid',
    name: 'Keterbukaan Informasi PPID',
    category: 'transparency',
    description: 'Standar regulasi UU Keterbukaan Informasi Publik Desa.',
    version: '1.0.0',
    isCore: true,
    minPlan: PlanTier.BASIC,
    iconName: 'ShieldCheck',
  },
  {
    key: 'seo',
    name: 'SEO & Sitemap Generator',
    category: 'system',
    description: 'Optimasi mesin pencari, meta tag otomatis, dan sitemap XML per desa.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'Globe',
  },
  {
    key: 'analytics',
    name: 'Analitik & Pengunjung',
    category: 'system',
    description: 'Metrik statistik pembaca artikel dan lalu lintas situs desa.',
    version: '1.0.0',
    isCore: false,
    minPlan: PlanTier.PROFESSIONAL,
    iconName: 'Activity',
  },
];

/**
 * Cek apakah modul tertentu aktif dan diizinkan oleh paket langganan tenant
 */
export async function isModuleEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
  const [tenant, tenantModule] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    }),
    prisma.tenantModule.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey,
        },
      },
    }),
  ]);

  if (!tenant) return false;

  // Jika paket langganan membatasi modul
  if (tenant.plan && !tenant.plan.allowedModules.includes(moduleKey)) {
    return false;
  }

  // Jika belum ada record tenantModule, modul core aktif secara default
  if (!tenantModule) {
    const modDef = SYSTEM_MODULES.find((m) => m.key === moduleKey);
    return !!modDef?.isCore;
  }

  return tenantModule.isEnabled;
}
