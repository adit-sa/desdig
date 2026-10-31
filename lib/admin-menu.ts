import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  HeartHandshake,
  Wallet,
  Globe,
  Settings,
  Sparkles,
  Newspaper,
  Palette,
  Megaphone,
  UserCheck,
  Clock,
  ShieldAlert,
  Boxes,
  Camera,
  Menu as MenuIcon,
  Building2,
  HardHat,
  ShoppingBag,
  FileCode,
  Monitor,
  Shield,
  Image as ImageIcon,
  LucideIcon,
} from 'lucide-react';

export type TenantRole = 'VILLAGE_ADMIN' | 'EDITOR' | 'AUTHOR' | 'APARATUR' | 'AUDITOR';

export interface AdminMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
  isExternal?: boolean;
  allowedRoles?: TenantRole[];
}

export interface AdminMenuGroup {
  id: string;
  title: string;
  description?: string;
  items: AdminMenuItem[];
}

/**
 * PANDUAN PENGEMBANGAN MENU ADMIN:
 * Format menu ringkas, padat & profesional (maksimal 1-2 kata).
 * Kelompok Fungsi:
 * - 'utama'        : Dashboard
 * - 'layanan'      : Kependudukan, Surat, Bansos, Statistik
 * - 'pemerintahan' : Pamong, Presensi, Keuangan, Pembangunan
 * - 'informasi'    : Berita, Galeri, Pengumuman
 * - 'website'      : Identitas, Tema, Menu, Modul
 * - 'sistem'       : Audit, Portal, SaaS
 */
export const ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: 'utama',
    title: 'Utama',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'layanan',
    title: 'Layanan',
    items: [
      {
        href: '/kependudukan',
        label: 'Kependudukan',
        icon: Users,
        badge: 'Inti',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
      {
        href: '/surat',
        label: 'Surat Online',
        icon: FileText,
        badge: 'Cetak',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
      {
        href: '/bansos',
        label: 'Bansos',
        icon: HeartHandshake,
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
      {
        href: '/statistik',
        label: 'Statistik',
        icon: BarChart3,
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR', 'AUDITOR'],
      },
    ],
  },
  {
    id: 'pemerintahan',
    title: 'Pemerintahan',
    items: [
      {
        href: '/admin/pamong',
        label: 'Pamong Desa',
        icon: UserCheck,
        allowedRoles: ['VILLAGE_ADMIN', 'APARATUR'],
      },
      {
        href: '/admin/absen',
        label: 'Absensi',
        icon: Clock,
        badge: 'Absen',
      },
      {
        href: '/admin/perangkat',
        label: 'Komputer Absen',
        icon: Monitor,
        badge: 'Kiosk',
        allowedRoles: ['VILLAGE_ADMIN'],
      },
      {
        href: '/absen',
        label: 'Layar Kiosk Absen',
        icon: Clock,
        badge: 'PIN',
        allowedRoles: ['VILLAGE_ADMIN'],
      },
      {
        href: '/keuangan',
        label: 'Keuangan APBDes',
        icon: Wallet,
        badge: 'APBDes',
        allowedRoles: ['VILLAGE_ADMIN', 'AUDITOR'],
      },
      {
        href: '/admin/pembangunan',
        label: 'Pembangunan',
        icon: HardHat,
        badge: 'Fisik',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
    ],
  },
  {
    id: 'informasi',
    title: 'Informasi',
    items: [
      {
        href: '/admin/berita',
        label: 'Berita Desa',
        icon: Newspaper,
        badge: 'CMS',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR', 'AUTHOR'],
      },
      {
        href: '/admin/halaman',
        label: 'Halaman Statis',
        icon: FileCode,
        badge: 'Halaman',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR', 'AUTHOR'],
      },
      {
        href: '/admin/galeri',
        label: 'Galeri Foto',
        icon: Camera,
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR', 'AUTHOR'],
      },
      {
        href: '/admin/media',
        label: 'Pustaka Media',
        icon: ImageIcon,
        badge: 'Storage',
        description: 'Kelola pustaka berkas foto server, audit file yatim, dan kompresi WebP',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
      {
        href: '/admin/pengumuman',
        label: 'Pengumuman',
        icon: Megaphone,
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
      {
        href: '/admin/pelapak',
        label: 'Pelapak & UMKM',
        icon: ShoppingBag,
        badge: 'Lapak',
        allowedRoles: ['VILLAGE_ADMIN', 'EDITOR'],
      },
    ],
  },
  {
    id: 'website',
    title: 'Web Portal',
    items: [
      {
        href: '/admin/identitas',
        label: 'Identitas Desa',
        icon: Building2,
        badge: 'Profil',
        allowedRoles: ['VILLAGE_ADMIN'],
      },
      {
        href: '/admin/tampilan',
        label: 'Tema Beranda',
        icon: Palette,
        badge: 'Desain',
        allowedRoles: ['VILLAGE_ADMIN'],
      },
      {
        href: '/admin/menu',
        label: 'Menu Portal',
        icon: MenuIcon,
        allowedRoles: ['VILLAGE_ADMIN'],
      },
      {
        href: '/admin/modul',
        label: 'Modul Fitur',
        icon: Boxes,
        allowedRoles: ['VILLAGE_ADMIN'],
      },
    ],
  },
  {
    id: 'sistem',
    title: 'Sistem',
    items: [
      {
        href: '/admin/users',
        label: 'Pengguna & Akses',
        icon: Shield,
        badge: 'Akun',
        allowedRoles: ['VILLAGE_ADMIN'],
      },
      {
        href: '/admin/audit',
        label: 'Log Audit',
        icon: ShieldAlert,
        allowedRoles: ['VILLAGE_ADMIN', 'AUDITOR'],
      },
      {
        href: '/',
        label: 'Lihat Portal',
        icon: Globe,
        badge: 'Web',
      },
    ],
  },
];

/**
 * MENU KHUSUS SUPER ADMIN PENGELOLA PLATFORM SAAS:
 * Terfokus pada pengelolaan multi-tenant, billing, pengguna platform, dan audit cloud.
 */
export const SAAS_ADMIN_MENU_GROUPS: AdminMenuGroup[] = [
  {
    id: 'saas_utama',
    title: 'Platform Cloud',
    items: [
      {
        href: '/saas',
        label: 'Dashboard SaaS',
        icon: Sparkles,
        badge: 'Master',
      },
      {
        href: '/saas#tenants',
        label: 'Tenant Desa',
        icon: Building2,
        badge: 'Multi-Desa',
      },
    ],
  },
  {
    id: 'saas_sistem',
    title: 'Manajemen Sistem',
    items: [
      {
        href: '/admin/users',
        label: 'Pengguna Sistem',
        icon: Shield,
        badge: 'Akun',
      },
      {
        href: '/admin/audit',
        label: 'Log Audit Cloud',
        icon: ShieldAlert,
        badge: 'Audit',
      },
      {
        href: '/',
        label: 'Portal Publik',
        icon: Globe,
        badge: 'Web',
      },
    ],
  },
];

export function getAllAdminMenuItems(): AdminMenuItem[] {
  return ADMIN_MENU_GROUPS.flatMap((group) => group.items);
}

export function findAdminMenuItemByHref(href: string) {
  for (const group of [...ADMIN_MENU_GROUPS, ...SAAS_ADMIN_MENU_GROUPS]) {
    const item = group.items.find((i) => i.href === href);
    if (item) {
      return { group, item };
    }
  }
  return null;
}
