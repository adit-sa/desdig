/**
 * Formatter utilities for titles, currency, and presentation
 */

export function formatProjectTitle(title: string): string {
  if (!title) return '';
  const uppercaseWords = new Set([
    'RT', 'RW', 'F', 'PAUD', 'TK', 'SD', 'SMP', 'SMA', 'SMK',
    'PAMSIMAS', 'SPAL', 'MCK', 'POSYANDU', 'BPD', 'LPM', 'PKK',
    'APBD', 'APBDES', 'APBN', 'ADD', 'DD', 'PADES', 'KUBE', 'UMKM',
    'PLTS', 'PJU', 'RTLH', 'DAM', 'TPS'
  ]);
  const lowercaseWords = new Set(['di', 'ke', 'dari', 'dan', 'atau', 'yang', 'untuk', 'pada', 'dengan', 'oleh', 'in']);

  const words = title.trim().split(/\s+/);
  return words
    .map((w, index) => {
      const clean = w.replace(/[^a-zA-Z0-9]/g, '');
      const upperClean = clean.toUpperCase();
      if (uppercaseWords.has(upperClean)) {
        return w.replace(clean, upperClean);
      }
      if (/^RT\.?\d+$/i.test(w)) return w.toUpperCase();
      if (/^RW\.?\d+$/i.test(w)) return w.toUpperCase();

      const lower = w.toLowerCase();
      if (index > 0 && lowercaseWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Kode Wilayah Kemendagri ke standar resmi Permendagri: PP.KK.CC.DDDD
 * Contoh input: '7606042009' atau '76.06.04.2009' -> '76.06.04.2009'
 */
export function formatKodeKemendagri(raw?: string | null): string {
  if (!raw) return '-';
  const clean = raw.trim();
  const digits = clean.replace(/\D/g, '');

  if (digits.length === 10) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 10)}`;
  }

  // Jika sudah memiliki format bertitik tapi panjang berbeda, kembalikan teks aslinya
  return clean || '-';
}

/**
 * Masking input live saat mengetik Kode Kemendagri: otomatis menyisipkan titik
 * Maksimal 10 digit angka -> output PP.KK.CC.DDDD (maks 13 karakter)
 */
export function maskKodeKemendagriInput(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 6) return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

/**
 * Validasi apakah Kode Kemendagri valid (10 digit numerik)
 */
export function isValidKodeKemendagri(val?: string | null): boolean {
  if (!val) return false;
  const digits = val.replace(/\D/g, '');
  return digits.length === 10;
}

