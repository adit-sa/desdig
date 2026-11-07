import { revalidateTag } from 'next/cache';

/**
 * Revalidasi on-demand cache portal publik desa saat ada pembaruan konten oleh admin
 * (Berita baru, perubahan galeri, pengumuman, dsb.)
 */
export function revalidateTenantCache(tenantId?: string | null) {
  if (!tenantId) return;
  try {
    revalidateTag(`tenant-${tenantId}`, 'default' as any);
    revalidateTag(`tenant-${tenantId}-home`, 'default' as any);
    revalidateTag(`tenant-${tenantId}-articles`, 'default' as any);
    revalidateTag(`tenant-${tenantId}-menus`, 'default' as any);
  } catch {
    // Abaikan jika dipanggil di luar konteks request Next.js (misal script/test)
  }
}

