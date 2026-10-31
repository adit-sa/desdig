import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import {
  getTenantMediaFiles,
  deleteTenantMediaFiles,
  compressTenantMediaFile,
  cleanupTenantOrphanFiles,
} from '@/lib/media';
import { uploadFile } from '@/lib/storage';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

// GET /api/media?tenant=...&page=1&limit=24&search=...&folder=...&status=all|used|unused&sort=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get('tenant') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const folderFilter = (searchParams.get('folder') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || 'all').trim().toLowerCase(); // all, used, unused
    const sortBy = (searchParams.get('sort') || 'newest').trim().toLowerCase(); // newest, oldest, size_desc, size_asc

    const tenant = await getTenantFromRequest(request, tenantParam);

    if (!tenant) {
      return NextResponse.json({ error: 'Parameter tenant wajib disertakan' }, { status: 400 });
    }

    // Ambil seluruh berkas media riil dari Cloudflare R2 + disk lokal lengkap dengan status integrasi DB
    const scanResult = await getTenantMediaFiles(tenant.slug, tenant.id);
    let filtered = scanResult.files;

    // 1. Filter folder
    if (folderFilter && folderFilter !== 'all' && folderFilter !== 'semua') {
      filtered = filtered.filter((f) => f.folder.toLowerCase() === folderFilter);
    }

    // 2. Filter search query
    if (search) {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(search));
    }

    // 3. Filter status integrasi (terpakai vs yatim)
    if (statusFilter === 'used' || statusFilter === 'terintegrasi') {
      filtered = filtered.filter((f) => f.isUsed);
    } else if (statusFilter === 'unused' || statusFilter === 'yatim') {
      filtered = filtered.filter((f) => !f.isUsed);
    }

    // 4. Pengurutan
    if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'size_desc') {
      filtered.sort((a, b) => b.size - a.size);
    } else if (sortBy === 'size_asc') {
      filtered.sort((a, b) => a.size - b.size);
    } else {
      // Default: newest
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pagedEntries = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      files: pagedEntries,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      folders: scanResult.folders,
      stats: scanResult.stats,
    });
  } catch (error: any) {
    console.error('Error listing media:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat daftar berkas' }, { status: 500 });
  }
}

// POST /api/media - Kompresi atau Unggah langsung
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // A. Kompresi berkas gambar yang sudah ada di server
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const action = body.action || 'compress';
      const tenantParam = body.tenant || '';
      const tenant = await getTenantFromRequest(request, tenantParam);

      if (!tenant) {
        return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 400 });
      }

      const auth = requireTenantManagerApi(request, tenant.slug);
      if (!auth.authorized) return auth.response!;

      if (action === 'compress') {
        const url = body.url as string;
        const urls = (body.urls as string[]) || (url ? [url] : []);
        const quality = typeof body.quality === 'number' ? body.quality : 82;

        if (urls.length === 0) {
          return NextResponse.json({ error: 'URL berkas wajib disertakan' }, { status: 400 });
        }

        const results = [];
        for (const targetUrl of urls) {
          try {
            const comp = await compressTenantMediaFile(tenant.slug, targetUrl, quality);
            results.push(comp);
          } catch (err: any) {
            results.push({ url: targetUrl, success: false, error: err.message });
          }
        }

        return NextResponse.json({
          success: true,
          results,
          totalCompressed: results.filter((r) => r.success).length,
        });
      }
    }

    // B. Unggah berkas baru (FormData)
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantParam = (formData.get('tenant') as string) || '';
    const folderParam = (formData.get('folder') as string) || 'galeri';

    const tenant = await getTenantFromRequest(request, tenantParam);
    if (!tenant) {
      return NextResponse.json({ error: 'Parameter tenant wajib disertakan' }, { status: 400 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) return auth.response!;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadRes = await uploadFile({
      buffer,
      filename: file.name,
      mimeType: file.type || 'image/jpeg',
      tenantSlug: tenant.slug,
      folder: folderParam,
    });

    return NextResponse.json({
      success: true,
      url: uploadRes.url,
      name: file.name,
      storage: uploadRes.storage,
    });
  } catch (error: any) {
    console.error('Error handling media POST:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses aksi media' }, { status: 500 });
  }
}

// DELETE /api/media - Menghapus satu/banyak berkas atau cleanup seluruh berkas yatim
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantParam = (body.tenant as string) || '';
    const tenant = await getTenantFromRequest(request, tenantParam);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 400 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) return auth.response!;

    // A. Mode Cleanup Seluruh Berkas Yatim
    const isCleanupOrphans = body.cleanupOrphans === true || body.action === 'cleanup_orphans';
    if (isCleanupOrphans) {
      const result = await cleanupTenantOrphanFiles(tenant.slug, tenant.id);
      return NextResponse.json({
        success: true,
        ...result,
        message:
          result.deletedCount > 0
            ? `Berhasil membersihkan ${result.deletedCount} berkas yatim. Menghemat ${result.freedBytesFormatted} ruang penyimpanan.`
            : 'Tidak ada berkas yatim yang perlu dibersihkan. Seluruh berkas aktif terintegrasi.',
      });
    }

    // B. Mode Hapus Berkas Spesifik
    const rawUrls = (body.urls as string[]) || (body.url ? [body.url as string] : []);
    if (rawUrls.length === 0) {
      return NextResponse.json({ error: 'URL berkas yang akan dihapus wajib disertakan' }, { status: 400 });
    }

    const deletedCount = await deleteTenantMediaFiles(tenant.slug, rawUrls);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} berkas berhasil dihapus secara permanen dari server penyimpanan.`,
    });
  } catch (error: any) {
    console.error('Error deleting media file:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus berkas' }, { status: 500 });
  }
}
