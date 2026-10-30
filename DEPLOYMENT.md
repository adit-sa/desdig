# 🚀 Panduan Deployment Produksi (Production Runbook) - desDig (desa Digital)

Dokumen ini memandu langkah demi langkah penerapan (*deployment*) platform **desDig (desa Digital)** ke server produksi (VPS Ubuntu 22.04 / 24.04 LTS atau infrastruktur Cloud seperti AWS, GCP, DigitalOcean, IdCloudHost).

---

## 🏗️ 1. Arsitektur Produksi

```
[ Domain Internet: *.desaku.id & custom domains ]
                     │
                     ▼
             [ Nginx Reverse Proxy ] (Port 80/443 SSL via Let's Encrypt)
                     │
                     ▼
           [ Docker: Next.js App ] (Port 3000, Multi-Tenant Engine)
                     │
                     ▼
          [ Docker: PostgreSQL 16 ] (Port 5432, Scoped Tenant Database)
```

---

## 🛠️ 2. Persiapan Server (VPS Ubuntu)

### A. Update Sistem & Install Paket Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw htop fail2ban
```

### B. Konfigurasi Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### C. Install Docker & Docker Compose
```bash
# Install Docker via official repository
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verifikasi instalasi
docker --version
docker compose version
```

---

## 📦 3. Deployment Aplikasi dengan Docker Compose

### A. Clone Repository
```bash
git clone https://github.com/your-org/desdig-saas.git /opt/desdig
cd /opt/desdig
```

### B. Konfigurasi Environment Produksi (`.env`)
Buat file `.env` di server:
```bash
cp .env.example .env
nano .env
```

Contoh konfigurasi produksi:
```env
# Database
POSTGRES_USER=desa_prod_user
POSTGRES_PASSWORD=GantiDenganPasswordKuatDanAcak64Karakter!
POSTGRES_DB=desa_platform_prod

# Koneksi Prisma
DATABASE_URL="postgresql://desa_prod_user:GantiDenganPasswordKuatDanAcak64Karakter!@postgres:5432/desa_platform_prod?schema=public"

# Platform Domain
NEXT_PUBLIC_PLATFORM_DOMAIN="desaku.id"
NEXTAUTH_URL="https://desaku.id"
NEXTAUTH_SECRET="GantiDenganSecretKeyAcakMinimal32Karakter"

# Node Environment
NODE_ENV=production
```

### C. Build & Jalankan Container
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### D. Inisialisasi Database (Push Schema & Seed Data)
```bash
# Eksekusi sinkronisasi skema di dalam container
docker compose -f docker-compose.prod.yml exec web npx prisma db push

# (Opsional) Jalankan data inisial 2 demo tenant
docker compose -f docker-compose.prod.yml exec web npx tsx prisma/seed.ts
```

### E. Cek Kesehatan Sistem (Healthcheck)
```bash
curl http://localhost:3000/api/health
```
Respons yang diharapkan:
```json
{
  "status": "healthy",
  "database": {
    "status": "healthy",
    "latencyMs": 4
  }
}
```

---

## 🔒 4. Konfigurasi Nginx & Wildcard SSL (Let's Encrypt)

Agar mendukung subdomain otomatis (*.desaku.id) dan custom domain desa:

### A. Install Nginx & Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### B. Buat Konfigurasi Reverse Proxy Nginx
Buat file `/etc/nginx/sites-available/desdig`:
```nginx
server {
    server_name desaku.id *.desaku.id;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi:
```bash
sudo ln -s /etc/nginx/sites-available/desdig /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### C. Pasang Sertifikat SSL Otomatis
```bash
sudo certbot --nginx -d desaku.id -d "*.desaku.id"
```

---

## 💾 5. Strategi Pencadangan Otomatis (Database Backup)

Buat skrip cadangan otomatis harian menggunakan cron:
`/opt/desdig/scripts/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/desdig"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Dump database PostgreSQL dari container
docker exec desdig-postgres-prod pg_dump -U postgres mydb | gzip > "$BACKUP_DIR/desdig_backup_$TIMESTAMP.sql.gz"

# Hapus cadangan yang lebih lama dari 30 hari
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete

echo "Backup selesai: desdig_backup_$TIMESTAMP.sql.gz"
```

Jalankan izin eksekusi dan pasang di crontab:
```bash
chmod +x /opt/desdig/scripts/backup-db.sh
crontab -e
# Tambahkan baris untuk backup setiap hari pukul 02:00 WIB:
# 0 2 * * * /opt/desdig/scripts/backup-db.sh >> /var/log/db_backup.log 2>&1
```

---

## 🔄 6. Prosedur Update & Zero-Downtime Deployment

Ketika ada perubahan kode terbaru di GitHub:
```bash
cd /opt/desdig
git pull origin main
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d --no-deps web
```
Aplikasi akan beralih ke container baru secara mulus tanpa mengganggu data PostgreSQL.
