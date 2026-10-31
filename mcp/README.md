# desDig (desa Digital) MCP Server

Model Context Protocol (MCP) Server resmi untuk platform **desDig (desa Digital)**.  
Server ini memungkinkan berbagai AI Assistant (**Antigravity**, **Claude Desktop**, **Cursor**, **Windsurf**, dll.) untuk mengoperasikan sistem desDig secara otonom melalui instruksi percakapan bahasa alami (*natural language*).

---

## 🚀 Fitur & Kemampuan AI (Tools)

| Tool MCP | Deskripsi Aksi AI |
| :--- | :--- |
| `desdig_list_villages` | Melihat daftar seluruh desa di SaaS beserta ringkasan statistik warga, artikel, pamong, & proyek. |
| `desdig_create_village` | Mendaftarkan desa baru multi-tenant (otomatis tema, modul, domain, & akun admin desa). |
| `desdig_get_village` | Mengambil profil lengkap desa, data agregasi kependudukan (L/P/KK), pamong, artikel, & APBDes. |
| `desdig_update_village` | Memperbarui nama Kades, Visi, Misi, Kontak, Alamat, Logo, Banner Hero, atau Tema Aktif. |
| `desdig_add_resident` | Menambahkan 1 penduduk baru ke Buku Induk Kependudukan dengan validasi NIK/KK. |
| `desdig_batch_import_residents` | Mengimpor puluhan/ratusan penduduk sekaligus dari daftar data. |
| `desdig_create_article` | Menulis dan menerbitkan artikel warta/berita desa langsung ke portal publik warga. |
| `desdig_create_announcement` | Menerbitkan pengumuman resmi desa (reguler, urgent, critical) di beranda portal. |
| `desdig_add_village_official` | Mendaftarkan aparatur pamong desa ke bagan struktur pemerintahan desa. |
| `desdig_add_development_project` | Mencatat proyek fisik APBDes lengkap dengan pagu anggaran, lokasi, pelaksana, dan progres %. |
| `desdig_cleanup_orphan_media` | Memindai dan menghapus berkas foto yatim dari Cloudflare R2 untuk membebaskan ruang disk. |
| `desdig_list_media_files` | Memeriksa berkas media di server Cloudflare R2 beserta status integrasi database. |

---

## 🛠️ Cara Konfigurasi di AI Assistant

### 1. Konfigurasi di Antigravity / Claude Desktop
Tambahkan konfigurasi berikut ke berkas konfigurasi MCP Anda (misal `claude_desktop_config.json` atau pengaturan MCP Antigravity):

```json
{
  "mcpServers": {
    "desdig": {
      "command": "npx",
      "args": ["-y", "tsx", "c:/app/opensid/mcp/server.ts"],
      "env": {
        "DATABASE_URL": "postgresql://neondb_owner:...@ep-....ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
      }
    }
  }
}
```

### 2. Konfigurasi di Cursor IDE (`.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "desdig": {
      "command": "npx tsx c:/app/opensid/mcp/server.ts"
    }
  }
}
```

---

## 💬 Contoh Perintah Percakapan ke AI

Setelah MCP Server terhubung, Anda cukup mengetik bahasa manusia santai ke AI:

### A. Mendaftarkan Desa Baru
> *"AI, tolong daftarkan desa baru bernama Desa Sukamulya di Kecamatan Ciawi, Kabupaten Tasikmalaya, Jawa Barat. Kepala desanya Bapak H. Ahmad Sanusi. Buatkan akun adminnya juga."*
*AI akan otomatis memanggil `desdig_create_village` dan mengembalikan URL portal desa serta password login admin.*

---

### B. Menambahkan Data Penduduk
> *"AI, masukkan warga baru ke Desa Salupangkang: Nama Budi Santoso, NIK 7604011505850001, No KK 7604011505850001, Laki-laki, Kepala Keluarga, Dusun Salupangkang 1, pekerjaan Petani."*
*AI akan memvalidasi data dan langsung menyimpannya ke tabel kependudukan desa Salupangkang.*

---

### C. Menerbitkan Warta Berita Desa
> *"AI, buatkan dan terbitkan artikel berita di Desa Salupangkang tentang kegiatan musyawarah desa penetapan APBDes 2026 yang dihadiri seluruh kepala dusun dan BPD kemarin."*
*AI akan merangkai isi berita yang rapi dan memanggil `desdig_create_article` sehingga langsung tayang di portal.*

---

### D. Mengaudit dan Membersihkan File Yatim
> *"AI, periksa apakah ada file yatim di storage Desa Salupangkang, kalau ada langsung bersihkan semua."*
*AI memanggil `desdig_cleanup_orphan_media` dan melaporkan berapa berkas yang terhapus dan berapa MB storage yang dihemat.*

