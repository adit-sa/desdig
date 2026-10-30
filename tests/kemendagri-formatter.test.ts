import { describe, it, expect } from 'vitest';
import { formatKodeKemendagri, maskKodeKemendagriInput, isValidKodeKemendagri } from '../lib/formatters';

describe('Standarisasi Kode Wilayah Kemendagri (PP.KK.CC.DDDD)', () => {
  it('1. Mengubah format 10 digit numerik tanpa titik menjadi format standar bertitik', () => {
    // Kasus Salupangkang lama: '7606042009' -> '76.06.04.2009'
    expect(formatKodeKemendagri('7606042009')).toBe('76.06.04.2009');

    // Kasus Mekarjaya: '3201252008' -> '32.01.25.2008'
    expect(formatKodeKemendagri('3201252008')).toBe('32.01.25.2008');

    // Kasus Sukamaju: '3205112001' -> '32.05.11.2001'
    expect(formatKodeKemendagri('3205112001')).toBe('32.05.11.2001');
  });

  it('2. Menjaga format yang sudah memiliki titik pemisah dengan benar', () => {
    expect(formatKodeKemendagri('76.06.04.2009')).toBe('76.06.04.2009');
    expect(formatKodeKemendagri('32.01.25.2008')).toBe('32.01.25.2008');
  });

  it('3. Menangani nilai kosong, null, atau undefined dengan aman', () => {
    expect(formatKodeKemendagri(null)).toBe('-');
    expect(formatKodeKemendagri(undefined)).toBe('-');
    expect(formatKodeKemendagri('')).toBe('-');
    expect(formatKodeKemendagri('   ')).toBe('-');
  });

  it('4. Masking input live saat user mengetik angka', () => {
    expect(maskKodeKemendagriInput('76')).toBe('76');
    expect(maskKodeKemendagriInput('760')).toBe('76.0');
    expect(maskKodeKemendagriInput('7606')).toBe('76.06');
    expect(maskKodeKemendagriInput('76060')).toBe('76.06.0');
    expect(maskKodeKemendagriInput('760604')).toBe('76.06.04');
    expect(maskKodeKemendagriInput('7606042009')).toBe('76.06.04.2009');
    // Membatasi maksimal 10 digit angka
    expect(maskKodeKemendagriInput('760604200999999')).toBe('76.06.04.2009');
  });

  it('5. Validasi keabsahan 10 digit kode desa', () => {
    expect(isValidKodeKemendagri('7606042009')).toBe(true);
    expect(isValidKodeKemendagri('76.06.04.2009')).toBe(true);
    expect(isValidKodeKemendagri('12345')).toBe(false);
    expect(isValidKodeKemendagri('')).toBe(false);
    expect(isValidKodeKemendagri(null)).toBe(false);
  });
});

