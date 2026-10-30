/**
 * Indonesian Timezone Helpers (WIB / WITA / WIT) based on Tenant Province
 * Rule: 100% Dynamic - Never hardcode WITA or WIB statically.
 */

export interface TimezoneInfo {
  iana: string;       // e.g. "Asia/Makassar"
  label: string;      // e.g. "WITA"
  utcOffset: number;  // 7, 8, or 9
}

const WITA_PROVINCES = [
  'bali',
  'nusa tenggara barat',
  'nusa tenggara timur',
  'sulawesi barat',
  'sulawesi selatan',
  'sulawesi tengah',
  'sulawesi tenggara',
  'gorontalo',
  'sulawesi utara',
  'kalimantan selatan',
  'kalimantan timur',
  'kalimantan utara',
];

const WIT_PROVINCES = [
  'maluku',
  'maluku utara',
  'papua',
  'papua barat',
  'papua selatan',
  'papua tengah',
  'papua pegunungan',
  'papua barat daya',
];

export function getTimezoneInfoByProvince(provinceName?: string | null): TimezoneInfo {
  const prov = (provinceName || '').toLowerCase().trim();

  if (WIT_PROVINCES.some((p) => prov.includes(p))) {
    return {
      iana: 'Asia/Jayapura',
      label: 'WIT',
      utcOffset: 9,
    };
  }

  if (WITA_PROVINCES.some((p) => prov.includes(p))) {
    return {
      iana: 'Asia/Makassar',
      label: 'WITA',
      utcOffset: 8,
    };
  }

  // Default to WIB (Java, Sumatra, West/Central Kalimantan)
  return {
    iana: 'Asia/Jakarta',
    label: 'WIB',
    utcOffset: 7,
  };
}

export function getTimezoneByProvince(provinceName?: string | null): string {
  return getTimezoneInfoByProvince(provinceName).label;
}

/**
 * Format date & time completely with dynamic timezone label
 * Output example: "24 Okt 2026, 10:35 WITA"
 */
export function formatAnnouncementDateTime(
  dateInput: string | Date | null | undefined,
  provinceName?: string | null,
  options?: { showDay?: boolean }
): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const tzInfo = getTimezoneInfoByProvince(provinceName);

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: tzInfo.iana,
      weekday: options?.showDay ? 'long' : undefined,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const formatted = formatter.format(d).replace(/\./g, ':');
    return `${formatted} ${tzInfo.label}`;
  } catch {
    // Fallback if environment lacks timezone data
    const dateStr = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${dateStr}, ${hours}:${minutes} ${tzInfo.label}`;
  }
}

/**
 * Format tanggal dengan zona waktu dinamis provinsi
 */
export function formatDateWithTimezone(
  dateInput: string | Date | null | undefined,
  provinceName?: string | null,
  options?: { dateStyle?: 'full' | 'long' | 'medium' | 'short'; withTime?: boolean }
): string {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';

  const tzInfo = getTimezoneInfoByProvince(provinceName);

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: tzInfo.iana,
      dateStyle: options?.dateStyle || 'long',
      timeStyle: options?.withTime ? 'short' : undefined,
    });
    return formatter.format(d);
  } catch {
    return d.toLocaleDateString('id-ID', { dateStyle: options?.dateStyle || 'long' });
  }
}
