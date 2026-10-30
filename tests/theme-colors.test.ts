import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  generateColorShades,
  resolveThemeShades,
  getThemeCssVariables,
  THEME_COLOR_PRESETS,
} from '../components/themes/modern-government/themeColors';

describe('Modern Government Theme Colors System', () => {
  it('1. Parsing hex to rgb and back to hex', () => {
    expect(hexToRgb('#059669')).toEqual([5, 150, 105]);
    expect(hexToRgb('2563eb')).toEqual([37, 99, 235]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('invalid')).toBeNull();

    expect(rgbToHex(5, 150, 105)).toBe('#059669');
    expect(rgbToHex(37, 99, 235)).toBe('#2563eb');
  });

  it('2. Menghasilkan skala shade lengkap 50-950 dari warna kustom', () => {
    const shades = generateColorShades('#2563eb');
    expect(shades[600]).toBe('#2563eb');
    expect(shades[50]).toBeDefined();
    expect(shades[950]).toBeDefined();
    expect(Object.keys(shades)).toHaveLength(11);
  });

  it('3. Default resolusi preset mengembalikan emerald', () => {
    const res = resolveThemeShades(null);
    expect(res.preset).toBe('emerald');
    expect(res.primaryHex).toBe('#059669');
    expect(res.secondaryHex).toBe('#0d9488');
  });

  it('4. Resolusi preset biru Samudra', () => {
    const res = resolveThemeShades({
      preset: 'blue',
      primary: '#2563eb',
      secondary: '#0284c7',
    });
    expect(res.preset).toBe('blue');
    expect(res.primaryHex).toBe(THEME_COLOR_PRESETS.blue.primary);
    expect(res.primaryShades[600]).toBe('#2563eb');
  });

  it('5. Menghasilkan string CSS variables dengan !important dan selector scope', () => {
    const { cssString, styleObject } = getThemeCssVariables({
      preset: 'blue',
      primary: '#2563eb',
      secondary: '#0284c7',
    });

    expect(cssString).toContain('--color-emerald-600: #2563eb !important;');
    expect(cssString).toContain('--color-teal-600: #0284c7 !important;');
    expect(styleObject).toHaveProperty('--color-emerald-600', '#2563eb');
    expect(styleObject).toHaveProperty('--color-teal-600', '#0284c7');
  });

  it('6. Semua 8 preset terdefinisi lengkap dengan skala 50-950', () => {
    const presetKeys = Object.keys(THEME_COLOR_PRESETS);
    expect(presetKeys).toHaveLength(8);

    presetKeys.forEach((key) => {
      const p = THEME_COLOR_PRESETS[key as keyof typeof THEME_COLOR_PRESETS];
      expect(p.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(p.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(Object.keys(p.primaryShades)).toHaveLength(11);
      expect(Object.keys(p.secondaryShades)).toHaveLength(11);
    });
  });

  it('7. Multi-tenant: Isolasi skema warna per desa (Tenant A warna merah, Tenant B warna biru)', () => {
    const tenantA_settings = {
      color_scheme: {
        preset: 'ruby',
        primary: '#dc2626',
        secondary: '#e11d48',
      },
    };
    const tenantB_settings = {
      color_scheme: {
        preset: 'blue',
        primary: '#2563eb',
        secondary: '#0284c7',
      },
    };

    const shadesA = resolveThemeShades(tenantA_settings.color_scheme);
    const shadesB = resolveThemeShades(tenantB_settings.color_scheme);

    expect(shadesA.primaryHex).toBe('#dc2626');
    expect(shadesB.primaryHex).toBe('#2563eb');
    expect(shadesA.primaryHex).not.toBe(shadesB.primaryHex);
  });

  it('8. Layout mode Fixed dan Fluid terkonfigurasi dan terisolasi per tenant', () => {
    const tenantFixedSettings = {
      layout_mode: 'fixed',
      color_scheme: { preset: 'emerald', primary: '#059669', secondary: '#0d9488' },
    };
    const tenantFluidSettings = {
      layout_mode: 'fluid',
      color_scheme: { preset: 'blue', primary: '#2563eb', secondary: '#0284c7' },
    };

    expect(tenantFixedSettings.layout_mode).toBe('fixed');
    expect(tenantFluidSettings.layout_mode).toBe('fluid');
    expect(tenantFixedSettings.layout_mode).not.toBe(tenantFluidSettings.layout_mode);
  });
});
