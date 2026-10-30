export interface TenantDesa {
  id: string; // e.g. "salupangkang"
  slug: string;
  kode_desa: string;
  nama_desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kode_pos: string;
  alamat_kantor: string;
  email: string;
  telepon: string;
  kepala_desa: string;
  visi: string;
  misi: string[];
  logo_url?: string;
  paket: 'Starter' | 'Pro' | 'Enterprise';
  status_langganan: 'Aktif' | 'Trial' | 'Expired';
  tgl_bergabung: string;
  biaya_langganan: number; // per bulan dalam Rupiah
}

export interface Penduduk {
  id: string;
  tenant_id: string; // ID desa pemilik data (isolasi multi-tenant)
  nik: string;
  no_kk: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  status_kawin: 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
  golongan_darah: 'A' | 'B' | 'AB' | 'O' | '-';
  hubungan_keluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
  alamat: string;
  dusun: string;
  rt: string;
  rw: string;
  status_dasar: 'Hidup' | 'Mati' | 'Pindah' | 'Hilang';
}

export interface Keluarga {
  no_kk: string;
  tenant_id: string;
  kepala_keluarga: string;
  nik_kepala: string;
  alamat: string;
  dusun: string;
  rt: string;
  rw: string;
  jumlah_anggota: number;
}

export interface SuratPermohonan {
  id: string;
  tenant_id: string;
  nomor_surat: string;
  jenis_surat: string;
  kode_surat: string;
  nik_pemohon: string;
  nama_pemohon: string;
  tanggal_permohonan: string;
  tanggal_cetak?: string;
  keperluan: string;
  status: 'Menunggu' | 'Disetujui' | 'Dicetak' | 'Ditolak';
  keterangan_tambahan?: string;
}

export interface ProgramBansos {
  id: string;
  tenant_id: string;
  nama_program: string;
  kategori: 'PKH' | 'BLT Dana Desa' | 'BPNT' | 'Bansos Tunai';
  asal_dana: 'APBN' | 'APBD' | 'Dana Desa';
  jumlah_penerima: number;
  nominal_per_kpm: number;
  periode: string;
  status: 'Aktif' | 'Selesai';
}

export interface PenerimaBansos {
  id: string;
  tenant_id: string;
  program_id: string;
  nik: string;
  nama: string;
  no_kk: string;
  alamat: string;
  status_penyaluran: 'Sudah Diterima' | 'Belum Diterima';
  tanggal_terima?: string;
}

export interface APBDesItem {
  id: string;
  tenant_id: string;
  kategori: 'Pendapatan' | 'Belanja' | 'Pembiayaan';
  kode_rekening: string;
  uraian: string;
  anggaran: number;
  realisasi: number;
  tahun: number;
}

export interface BeritaDesa {
  id: string;
  tenant_id: string;
  judul: string;
  slug: string;
  ringkasan: string;
  konten: string;
  kategori: 'Pemerintahan' | 'Pembangunan' | 'Kemasyarakatan' | 'Pengumuman';
  penulis: string;
  tanggal: string;
  gambar?: string;
}

export interface AparaturDesa {
  id: string;
  tenant_id: string;
  nama: string;
  jabatan: string;
  nip?: string;
  foto?: string;
  status: 'Aktif' | 'Purna';
}
