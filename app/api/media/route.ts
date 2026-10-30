import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

interface ScannedFile {
  name: string;
  folder: string;
  fullPath: string;
  ext: string;
  isImage: boolean;
}

// GET /api/media?tenant=...&page=1&limit=24&search=...&folder=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantParam = searchParams.get('tenant') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const folderFilter = (searchParams.get('folder') || '').trim().toLowerCase();

    const tenant = await getTenantFromRequest(request, tenantParam);

    if (!tenant) {
      return NextResponse.json({ error: 'Parameter tenant wajib disertakan' }, { status: 400 });
    }

    const cleanTenant = tenant.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'default';
    const tenantBaseDir = path.join(process.cwd(), 'public', 'uploads', cleanTenant);

    if (!existsSync(tenantBaseDir)) {
      return NextResponse.json({
        files: [],
        pagination: { total: 0, page: 1, limit, totalPages: 0 },
        folders: [],
      });
    }

    const scannedFiles: ScannedFile[] = [];
    const discoveredFolders = new Set<string>();

    // 1. Fast recursive scan directory structure without stat-ing all files yet
    const scanDir = async (dirPath: string, subfolder: string, depth = 0) => {
      if (depth > 5) return;
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            const nextSubfolder = subfolder ? `${subfolder}/${entry.name}` : entry.name;
            discoveredFolders.add(nextSubfolder);
            await scanDir(fullPath, nextSubfolder, depth + 1);
          } else if (entry.isFile()) {
            // Exclude thumbnail files from main listing
            if (entry.name.endsWith('_thumb.webp')) continue;

            const ext = path.extname(entry.name).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);

            if (isImage) {
              const currentFolder = subfolder || 'root';
              discoveredFolders.add(currentFolder);

              scannedFiles.push({
                name: entry.name,
                folder: currentFolder,
                fullPath,
                ext,
                isImage,
              });
            }
          }
        }
      } catch (err) {
        console.error('Error scanning folder:', err);
      }
    };

    await scanDir(tenantBaseDir, '');

    // 2. Filter by search & folder before expensive operations
    let filtered = scannedFiles;
    if (folderFilter && folderFilter !== 'all' && folderFilter !== 'semua') {
      filtered = filtered.filter((f) => f.folder.toLowerCase() === folderFilter);
    }
    if (search) {
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(search));
    }

    const total = filtered.length;

    // 3. Fast parallel stat collection in batches to get timestamps
    const fileWithStats = await Promise.all(
      filtered.map(async (f) => {
        try {
          const stat = await fs.stat(f.fullPath);
          return {
            ...f,
            size: stat.size,
            mtimeMs: stat.mtimeMs,
            createdAt: stat.birthtime ? stat.birthtime.toISOString() : stat.mtime.toISOString(),
          };
        } catch {
          return {
            ...f,
            size: 0,
            mtimeMs: 0,
            createdAt: new Date().toISOString(),
          };
        }
      })
    );

    // 4. Sort latest first
    fileWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);

    // 5. Slice page
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const pagedEntries = fileWithStats.slice(startIndex, startIndex + limit);

    // 6. Map into client-friendly objects with thumbnail support
    const filesList = pagedEntries.map((item) => {
      const sizeInKb = (item.size / 1024).toFixed(1);
      const sizeFormatted = item.size > 1024 * 1024
        ? `${(item.size / (1024 * 1024)).toFixed(1)} MB`
        : `${sizeInKb} KB`;

      const subfolderPath = item.folder === 'root' ? '' : `${item.folder}/`;
      const relativeUrl = `/uploads/${cleanTenant}/${subfolderPath}${item.name}`;

      // Check for thumbnail
      const thumbFilename = item.name.replace(/\.[^/.]+$/, '_thumb.webp');
      const thumbFullPath = path.join(path.dirname(item.fullPath), thumbFilename);
      const hasThumb = existsSync(thumbFullPath);
      const thumbnailUrl = hasThumb
        ? `/uploads/${cleanTenant}/${subfolderPath}${thumbFilename}`
        : relativeUrl;

      return {
        id: `${cleanTenant}_${item.folder}_${item.name}`,
        name: item.name,
        url: relativeUrl,
        thumbnailUrl,
        size: item.size,
        sizeFormatted,
        createdAt: item.createdAt,
        folder: item.folder,
        isImage: item.isImage,
      };
    });

    return NextResponse.json({
      success: true,
      files: filesList,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      folders: Array.from(discoveredFolders).sort(),
    });
  } catch (error: any) {
    console.error('Error listing media:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat daftar berkas' }, { status: 500 });
  }
}

// POST /api/media - Upload image directly with auto-compressed master + ultra-lightweight thumbnail
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantParam = (formData.get('tenant') as string) || request.headers.get('x-tenant-slug') || '';
    const folderParam = (formData.get('folder') as string) || 'artikel';

    const tenant = await getTenantFromRequest(request, tenantParam);

    if (!tenant) {
      return NextResponse.json({ error: 'Parameter tenant wajib disertakan' }, { status: 400 });
    }

    const cleanTenant = tenant.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'default';
    const cleanFolder = folderParam.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'artikel';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah' }, { status: 400 });
    }

    const ext = path.extname(file.name || '').toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    if (!allowed.includes(ext) && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Hanya format gambar (JPG, PNG, WebP, GIF, SVG) yang diperbolehkan' }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran gambar maksimal 15 MB' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', cleanTenant, cleanFolder);
    await fs.mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    const baseSlug = (file.name || 'foto')
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '_')
      .substring(0, 30);

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    let finalFilename = `${baseSlug}_${timestamp}_${randomSuffix}.webp`;
    let finalBuffer: Buffer;

    if (ext === '.svg' || ext === '.gif') {
      finalFilename = `${baseSlug}_${timestamp}_${randomSuffix}${ext}`;
      finalBuffer = inputBuffer;
    } else {
      try {
        finalBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        finalBuffer = inputBuffer;
        finalFilename = `${baseSlug}_${timestamp}_${randomSuffix}${ext || '.jpg'}`;
      }
    }

    const fullFilePath = path.join(uploadDir, finalFilename);
    await fs.writeFile(fullFilePath, finalBuffer);

    // Generate lightweight thumbnail (320x240 webp ~8-15KB) for super fast gallery loading
    const thumbFilename = `${baseSlug}_${timestamp}_${randomSuffix}_thumb.webp`;
    let thumbnailUrl = `/uploads/${cleanTenant}/${cleanFolder}/${finalFilename}`;

    if (ext !== '.svg') {
      try {
        const thumbBuffer = await sharp(inputBuffer)
          .rotate()
          .resize({ width: 360, height: 270, fit: 'cover' })
          .webp({ quality: 75 })
          .toBuffer();
        await fs.writeFile(path.join(uploadDir, thumbFilename), thumbBuffer);
        thumbnailUrl = `/uploads/${cleanTenant}/${cleanFolder}/${thumbFilename}`;
      } catch (err) {
        console.warn('Could not generate thumbnail, fallback to original:', err);
      }
    }

    const publicUrl = `/uploads/${cleanTenant}/${cleanFolder}/${finalFilename}`;
    const sizeInKb = (finalBuffer.length / 1024).toFixed(1);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      thumbnailUrl,
      name: finalFilename,
      sizeFormatted: `${sizeInKb} KB`,
    });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengunggah foto' }, { status: 500 });
  }
}

// DELETE /api/media - Delete file and its thumbnail from server
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const fileUrl = body.url as string;
    const tenantParam = (body.tenant as string) || '';

    const tenant = await getTenantFromRequest(request, tenantParam);

    if (!fileUrl || !tenant) {
      return NextResponse.json({ error: 'URL berkas dan tenant wajib disertakan' }, { status: 400 });
    }

    const cleanTenant = tenant.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'default';

    // Verify path starts with /uploads/[cleanTenant]/
    const expectedPrefix = `/uploads/${cleanTenant}/`;
    if (!fileUrl.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Akses ditolak: berkas tidak berada dalam direktori desa ini' },
        { status: 403 }
      );
    }

    // Relative subpath after prefix
    const relativeSubPath = fileUrl.slice(expectedPrefix.length);

    // Prevent directory traversal
    if (relativeSubPath.includes('..') || path.isAbsolute(relativeSubPath)) {
      return NextResponse.json({ error: 'Jalur berkas tidak valid' }, { status: 400 });
    }

    const targetFullPath = path.join(process.cwd(), 'public', 'uploads', cleanTenant, relativeSubPath);

    if (existsSync(targetFullPath)) {
      await fs.unlink(targetFullPath);
    }

    // Also attempt deleting associated thumbnail if exists
    const ext = path.extname(targetFullPath);
    const thumbPath = targetFullPath.replace(new RegExp(`${ext}$`), '_thumb.webp');
    if (existsSync(thumbPath)) {
      try {
        await fs.unlink(thumbPath);
      } catch (e) {
        console.warn('Could not remove thumbnail:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Foto dan thumbnail berhasil dihapus secara permanen dari server',
    });
  } catch (error: any) {
    console.error('Error deleting media file:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus berkas' }, { status: 500 });
  }
}
