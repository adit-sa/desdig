import React from 'react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';

export type ThemeColorPresetKey =
  | 'emerald'
  | 'blue'
  | 'ruby'
  | 'forest'
  | 'violet'
  | 'amber'
  | 'sky'
  | 'slate'
  | 'custom';

export interface ThemeColorScheme {
  preset: ThemeColorPresetKey | string;
  primary: string; // Hex color e.g. '#059669'
  secondary: string; // Hex color e.g. '#0d9488'
  customShades?: {
    primary?: Record<string | number, string>;
    secondary?: Record<string | number, string>;
  };
}

export interface PresetOption {
  id: ThemeColorPresetKey;
  name: string;
  label: string;
  desc: string;
  primary: string;
  secondary: string;
  badge: string;
  primaryShades: Record<number, string>;
  secondaryShades: Record<number, string>;
}

/**
 * Palet Warna Resmi Standar Pemerintahan & Daerah
 * Menggunakan kode warna resmi Tailwind v4 untuk keharmonisan dan keterbacaan kontras visual.
 */
export const THEME_COLOR_PRESETS: Record<Exclude<ThemeColorPresetKey, 'custom'>, PresetOption> = {
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud',
    label: 'Default Resmi',
    badge: 'Standar Nasional',
    desc: 'Karakter sejuk, agraris, dan berwibawa khas standar OpenSID & Kemendagri.',
    primary: '#059669',
    secondary: '#0d9488',
    primaryShades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    secondaryShades: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
  },
  blue: {
    id: 'blue',
    name: 'Biru Samudra (Bahari)',
    label: 'Maritim & Modern',
    badge: 'Pesisir / Kepulauan',
    desc: 'Karakter terpercaya, maritim, modern, dan pelayanan publik profesional.',
    primary: '#2563eb',
    secondary: '#0284c7',
    primaryShades: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondaryShades: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
  },
  ruby: {
    id: 'ruby',
    name: 'Merah Marun (Perjuangan)',
    label: 'Patriotik & Tegas',
    badge: 'Semangat Nasional',
    desc: 'Karakter tegas, berwibawa, patriotik, berani, dan bernuansa kebangsaan.',
    primary: '#dc2626',
    secondary: '#e11d48',
    primaryShades: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    secondaryShades: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      800: '#9f1239',
      900: '#881337',
      950: '#4c0519',
    },
  },
  forest: {
    id: 'forest',
    name: 'Hijau Daun (Alam / Asri)',
    label: 'Ekologis & Subur',
    badge: 'Agraris & Wisata Alam',
    desc: 'Karakter subur, alam pegunungan, perkebunan hijau, dan desa asri lestari.',
    primary: '#16a34a',
    secondary: '#059669',
    primaryShades: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    secondaryShades: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
  },
  violet: {
    id: 'violet',
    name: 'Ungu Praja (Royal Violet)',
    label: 'Elegan & Prestisius',
    badge: 'Wibawa & Luhur',
    desc: 'Karakter anggun, berkelas, visioner, dan mencerminkan kebijaksanaan luhur.',
    primary: '#4f46e5',
    secondary: '#7c3aed',
    primaryShades: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    secondaryShades: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
  },
  amber: {
    id: 'amber',
    name: 'Emas Terakota (Heritage)',
    label: 'Budaya & Tradisi',
    badge: 'Desa Adat & Budaya',
    desc: 'Karakter hangat, kebudayaan luhur, kearifan lokal, dan desa wisata budaya.',
    primary: '#d97706',
    secondary: '#ea580c',
    primaryShades: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    secondaryShades: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
  },
  sky: {
    id: 'sky',
    name: 'Biru Langit (Azure)',
    label: 'Transparan & Terbuka',
    badge: 'Desa Digital',
    desc: 'Karakter bersih, transparan, pelayanan ramah warga, dan inovasi desa digital.',
    primary: '#0284c7',
    secondary: '#0d9488',
    primaryShades: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    secondaryShades: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
      950: '#042f2e',
    },
  },
  slate: {
    id: 'slate',
    name: 'Monokrom Slate (Formal)',
    label: 'Minimalis & Netral',
    badge: 'Formal & Elegan',
    desc: 'Karakter netral, formal perkantoran modern, rapi, dan kontemporer.',
    primary: '#475569',
    secondary: '#52525b',
    primaryShades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    secondaryShades: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
  },
};

/**
 * Parsing kode warna hex (#RRGGBB atau #RGB) ke RGB numbers [r, g, b].
 */
export function hexToRgb(hexStr: string): [number, number, number] | null {
  if (!hexStr || typeof hexStr !== 'string') return null;
  let clean = hexStr.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Konversi RGB ke string hex #rrggbb.
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (val: number) => clamp(val).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Pencampuran warna (mix tint dengan putih atau shade dengan hitam).
 */
function mixColor(rgb: [number, number, number], target: [number, number, number], weight: number): string {
  const r = rgb[0] * (1 - weight) + target[0] * weight;
  const g = rgb[1] * (1 - weight) + target[1] * weight;
  const b = rgb[2] * (1 - weight) + target[2] * weight;
  return rgbToHex(r, g, b);
}

/**
 * Menghasilkan skala shade lengkap 50-950 dari satu kode warna hex dasar (sebagai shade 600).
 */
export function generateColorShades(baseHex: string): Record<number, string> {
  const rgb = hexToRgb(baseHex) || [5, 150, 105]; // Fallback ke emerald-600 jika tidak valid
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];

  return {
    50: mixColor(rgb, white, 0.94),
    100: mixColor(rgb, white, 0.86),
    200: mixColor(rgb, white, 0.72),
    300: mixColor(rgb, white, 0.54),
    400: mixColor(rgb, white, 0.32),
    500: mixColor(rgb, white, 0.14),
    600: rgbToHex(rgb[0], rgb[1], rgb[2]),
    700: mixColor(rgb, black, 0.18),
    800: mixColor(rgb, black, 0.35),
    900: mixColor(rgb, black, 0.52),
    950: mixColor(rgb, black, 0.72),
  };
}

/**
 * Mengambil set warna (shades) untuk primary & secondary berdasarkan konfigurasi tenant.
 */
export function resolveThemeShades(scheme?: ThemeColorScheme | null): {
  preset: string;
  primaryHex: string;
  secondaryHex: string;
  primaryShades: Record<number | string, string>;
  secondaryShades: Record<number | string, string>;
} {
  const defaultPreset = THEME_COLOR_PRESETS.emerald;
  if (!scheme) {
    return {
      preset: 'emerald',
      primaryHex: defaultPreset.primary,
      secondaryHex: defaultPreset.secondary,
      primaryShades: defaultPreset.primaryShades,
      secondaryShades: defaultPreset.secondaryShades,
    };
  }

  const presetKey = scheme.preset as Exclude<ThemeColorPresetKey, 'custom'>;
  if (presetKey && THEME_COLOR_PRESETS[presetKey]) {
    const p = THEME_COLOR_PRESETS[presetKey];
    return {
      preset: p.id,
      primaryHex: p.primary,
      secondaryHex: p.secondary,
      primaryShades: p.primaryShades,
      secondaryShades: p.secondaryShades,
    };
  }

  // Kustom mandiri: gunakan hex pengguna dan hitung skala matematisnya
  const primaryHex = scheme.primary || defaultPreset.primary;
  const secondaryHex = scheme.secondary || defaultPreset.secondary;

  const primaryShades = scheme.customShades?.primary || generateColorShades(primaryHex);
  const secondaryShades = scheme.customShades?.secondary || generateColorShades(secondaryHex);

  return {
    preset: 'custom',
    primaryHex,
    secondaryHex,
    primaryShades,
    secondaryShades,
  };
}

/**
 * Menghasilkan Style Object dan blok CSS Variable yang menimpa palet warna tema modern-government.
 */
export function getThemeCssVariables(
  scheme?: ThemeColorScheme | null,
  scopeSelector: string = ':root, [data-theme="modern-government"], .theme-preview-scope'
): {
  primaryHex: string;
  secondaryHex: string;
  primaryShades: Record<number | string, string>;
  secondaryShades: Record<number | string, string>;
  styleObject: React.CSSProperties;
  cssString: string;
} {
  const { preset, primaryHex, secondaryHex, primaryShades, secondaryShades } = resolveThemeShades(scheme);

  const styleObj: Record<string, string> = {};
  const cssLines: string[] = [];

  // 1. Pemetaan Emerald (Warna Utama Tema)
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach((shade) => {
    const val = primaryShades[shade];
    if (val) {
      styleObj[`--color-emerald-${shade}`] = val;
      cssLines.push(`  --color-emerald-${shade}: ${val} !important;`);
    }
  });

  // 2. Pemetaan Teal (Warna Sekunder & Aksen Gradient)
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach((shade) => {
    const val = secondaryShades[shade];
    if (val) {
      styleObj[`--color-teal-${shade}`] = val;
      cssLines.push(`  --color-teal-${shade}: ${val} !important;`);
    }
  });

  // 3. Token CSS Global Pembantu
  styleObj['--theme-primary'] = primaryHex;
  styleObj['--theme-secondary'] = secondaryHex;
  cssLines.push(`  --theme-primary: ${primaryHex} !important;`);
  cssLines.push(`  --theme-secondary: ${secondaryHex} !important;`);

  const cssString = `${scopeSelector} {\n${cssLines.join('\n')}\n}`;

  return {
    primaryHex,
    secondaryHex,
    primaryShades,
    secondaryShades,
    styleObject: styleObj as React.CSSProperties,
    cssString,
  };
}

export type ThemeLayoutMode = 'fixed' | 'fluid';

/**
 * Komponen pembantu untuk menginjeksi style variable warna & layout secara dinamis ke halaman website.
 */
export function ThemeColorStyle({
  colorScheme,
  tenant,
  scope,
  layoutMode,
}: {
  colorScheme?: ThemeColorScheme | null;
  tenant?: ResolvedTenant;
  scope?: string;
  layoutMode?: ThemeLayoutMode;
}) {
  const scheme = colorScheme || tenant?.themeConfig?.settings?.color_scheme || null;
  const layout = layoutMode || tenant?.themeConfig?.settings?.layout_mode || 'fixed';
  const { cssString } = getThemeCssVariables(scheme, scope);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssString }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
[data-layout="fluid"] .max-w-7xl,
.layout-fluid .max-w-7xl,
.theme-preview-scope[data-layout="fluid"] .max-w-7xl {
  max-width: 1760px !important;
  width: 100% !important;
  padding-left: clamp(1rem, 3vw, 3.5rem) !important;
  padding-right: clamp(1rem, 3vw, 3.5rem) !important;
}
[data-layout="fixed"] .max-w-7xl,
.layout-fixed .max-w-7xl,
.theme-preview-scope[data-layout="fixed"] .max-w-7xl {
  max-width: 80rem !important;
}
`,
        }}
      />
    </>
  );
}
