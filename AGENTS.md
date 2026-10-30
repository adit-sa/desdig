<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## STRICT MULTI-TENANCY LAW (HUKUM UTAMA PROYEK)
- **100% Multi-Tenant**: Proyek ini adalah SaaS multi-tenant untuk ratusan desa. DILARANG KERAS meng-hardcode nama desa tertentu (misal `salupangkang`, `sukamaju`), nama kades (`H. Sapiil`), NIP, link kontak/aduan (`bit.ly/...`), link gdrive, zona waktu statis (`WITA`/`WIB`), atau angka statistik dummy di komponen, tema, database query, atau API route.
- **Isolasi Data**: Setiap model Prisma baru wajib menyertakan `tenantId` dan `@@unique([tenantId, slug])`. Setiap API route wajib membatasi query dengan `where: { tenantId }`.
- **Navigasi Internal**: Seluruh link publik wajib mempertahankan konteks tenant (`buildTenantHref(url, tenant.slug)` atau `?tenant=${tenant.slug}`).
- **Zona Waktu Dinamis**: Selalu gunakan `getTimezoneByProvince(tenant.provinsi)` (bukan statis).
- **Terminologi**: Selalu gunakan kata **"Absensi"** (JANGAN gunakan "Presensi").

## IDENTITAS APLIKASI & CHANGELOG (ATURAN MUTLAK)
- **Nama Resmi Aplikasi**: **`desDig` (desa Digital)**.
- **Kewajiban Catat Perubahan (CHANGELOG.md)**:
  - Setiap penambahan fitur baru, perbaikan bug, perubahan UI/UX, maupun penyesuaian arsitektur **WAJIB dicatat di `CHANGELOG.md`** di root repositori.
  - Format dokumentasi mengikuti standar *Keep a Changelog* dengan pengelompokan: `Added` (Fitur Baru), `Changed` (Perubahan Fitur/UI), `Fixed` (Perbaikan Bug), `Security` (Keamanan/Isolasi Data).
  - Setiap sesi kerja yang menghasilkan perubahan kode harus memastikan `CHANGELOG.md` sudah terbarui.

