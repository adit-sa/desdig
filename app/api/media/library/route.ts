import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { getTenantMediaFiles } from '@/lib/media';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get('tenant') || '';
    const folderFilter = (searchParams.get('folder') || '').trim().toLowerCase();
    const searchQuery = (searchParams.get('q') || searchParams.get('search') || '').trim().toLowerCase();

    const tenant = await getTenantFromRequest(request, tenantParam);

    if (!tenant) {
      return NextResponse.json({ error: 'Parameter tenant wajib disertakan' }, { status: 400 });
    }

    const { files, folders } = await getTenantMediaFiles(tenant.slug, tenant.id);

    let filtered = files;
    if (folderFilter && folderFilter !== 'all' && folderFilter !== 'semua') {
      filtered = filtered.filter((f) => f.folder.toLowerCase() === folderFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(searchQuery));
    }

    return NextResponse.json({
      success: true,
      files: filtered.map((f) => ({
        url: f.url,
        name: f.name,
        size: f.size,
        folder: f.folder,
        type: f.isImage ? 'image' : 'video',
        modifiedAt: f.createdAt,
        isUsed: f.isUsed,
        usedIn: f.usedIn,
      })),
      folders,
    });
  } catch (error: any) {
    console.error('Error fetching media library:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat pustaka media' }, { status: 500 });
  }
}
