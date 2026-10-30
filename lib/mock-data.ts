import { TenantDesa, Penduduk, Keluarga, SuratPermohonan, ProgramBansos, PenerimaBansos, APBDesItem, BeritaDesa, AparaturDesa } from './types';

export const DAFTAR_TENANT: TenantDesa[] = [
  {
    id: 'salupangkang',
    slug: 'salupangkang',
    kode_desa: '76.06.04.2009',
    nama_desa: 'Salupangkang',
    kecamatan: 'Topoyo',
    kabupaten: 'Mamuju Tengah',
    provinsi: 'Sulawesi Barat',
    kode_pos: '91564',
    alamat_kantor: 'Jl. Poros Topoyo - Salupangkang Km. 3, Kec. Topoyo',
    email: 'kontak@salupangkang.desa.id',
    telepon: '0812-4567-8901',
    kepala_desa: 'H. Amiruddin, S.Sos',
    visi: 'Mewujudkan Desa Salupangkang yang Maju, Mandiri, Religius, dan Berdaya Saing Melalui Transformasi Digital Desa.',
    misi: [
      'Meningkatkan tata kelola pemerintahan desa yang bersih, transparan, dan akuntabel.',
      'Optimalisasi pelayanan administrasi warga melalui Sistem Informasi Desa digital.',
      'Pemberdayaan sektor pertanian kelapa sawit dan perkebunan rakyat.',
      'Pengembangan sarana prasarana desa dan keterbukaan informasi publik.'
    ],
    logo_url: 'https://salupangkang.desa.id/desa/logo/1714701757_1.png',
    paket: 'Enterprise',
    status_langganan: 'Aktif',
    tgl_bergabung: '2024-01-15',
    biaya_langganan: 500000,
  },
  {
    id: 'sukamaju',
    slug: 'sukamaju',
    kode_desa: '32.02.11.2001',
    nama_desa: 'Sukamaju',
    kecamatan: 'Cibadak',
    kabupaten: 'Sukabumi',
    provinsi: 'Jawa Barat',
    kode_pos: '43351',
    alamat_kantor: 'Jl. Raya Desa Sukamaju No. 12, Kec. Cibadak',
    email: 'desasukamaju@desa.id',
    telepon: '(0266) 531234',
    kepala_desa: 'H. Suryana Pratama, S.IP',
    visi: 'Mewujudkan Desa Sukamaju yang Mandiri, Sejahtera, Transparan, dan Berdaya Saing Berbasis Teknologi Digital.',
    misi: [
      'Meningkatkan tata kelola pemerintahan desa yang transparan dan bebas korupsi.',
      'Meningkatkan pelayanan publik berbasis digital melalui Sistem Informasi Desa.',
      'Mendorong kemandirian ekonomi desa melalui BUMDes dan sektor pertanian modern.'
    ],
    paket: 'Pro',
    status_langganan: 'Aktif',
    tgl_bergabung: '2024-06-01',
    biaya_langganan: 350000,
  },
  {
    id: 'mekarjaya',
    slug: 'mekarjaya',
    kode_desa: '32.01.25.2008',
    nama_desa: 'Mekarjaya',
    kecamatan: 'Ciawi',
    kabupaten: 'Bogor',
    provinsi: 'Jawa Barat',
    kode_pos: '16720',
    alamat_kantor: 'Jl. Surya Kencana No. 05, Desa Mekarjaya',
    email: 'mekarjaya@bogorkab.go.id',
    telepon: '0857-1122-3344',
    kepala_desa: 'Drs. Ridwan Hakim',
    visi: 'Desa Agrowisata Cerdas Berkelanjutan Menuju Kemakmuran Warga.',
    misi: [
      'Pengembangan potensi agrowisata berbasis kearifan lokal.',
      'Digitalisasi pelayanan masyarakat dan surat terpadu.'
    ],
    paket: 'Starter',
    status_langganan: 'Trial',
    tgl_bergabung: '2026-10-01',
    biaya_langganan: 150000,
  }
];

export const APARATUR_DESA: AparaturDesa[] = [
  // Desa Salupangkang
  { id: 'ap-sp-1', tenant_id: 'salupangkang', nama: 'H. Amiruddin, S.Sos', jabatan: 'Kepala Desa', status: 'Aktif' },
  { id: 'ap-sp-2', tenant_id: 'salupangkang', nama: 'Mustafa Kamal, S.E', jabatan: 'Sekretaris Desa', status: 'Aktif' },
  { id: 'ap-sp-3', tenant_id: 'salupangkang', nama: 'Nurhalimah, S.Pd', jabatan: 'Kaur Keuangan', status: 'Aktif' },
  { id: 'ap-sp-4', tenant_id: 'salupangkang', nama: 'Sudirman', jabatan: 'Kasi Pemerintahan', status: 'Aktif' },
  { id: 'ap-sp-5', tenant_id: 'salupangkang', nama: 'Kaharuddin', jabatan: 'Kepala Dusun I (Dusun Salupangkang)', status: 'Aktif' },
  
  // Desa Sukamaju
  { id: 'ap-sk-1', tenant_id: 'sukamaju', nama: 'H. Suryana Pratama, S.IP', jabatan: 'Kepala Desa', status: 'Aktif' },
  { id: 'ap-sk-2', tenant_id: 'sukamaju', nama: 'Dedi Kurniawan, S.Pd', jabatan: 'Sekretaris Desa', status: 'Aktif' },
  { id: 'ap-sk-3', tenant_id: 'sukamaju', nama: 'Siti Rohimah, S.E', jabatan: 'Kaur Keuangan', status: 'Aktif' },
];

export const DAFTAR_PENDUDUK: Penduduk[] = [
  // Warga Desa Salupangkang
  {
    id: 'sp-p-1',
    tenant_id: 'salupangkang',
    nik: '7606011205880001',
    no_kk: '7606011508100001',
    nama: 'Syahrir Ramadhan',
    jenis_kelamin: 'L',
    tempat_lahir: 'Mamuju',
    tanggal_lahir: '1988-05-12',
    agama: 'Islam',
    pendidikan: 'S1 / Sarjana',
    pekerjaan: 'Petani Kelapa Sawit',
    status_kawin: 'Kawin',
    golongan_darah: 'O',
    hubungan_keluarga: 'Kepala Keluarga',
    alamat: 'Jl. Trans Sulawesi KM 5',
    dusun: 'Dusun Salupangkang 1',
    rt: '001',
    rw: '001',
    status_dasar: 'Hidup'
  },
  {
    id: 'sp-p-2',
    tenant_id: 'salupangkang',
    nik: '7606015506920002',
    no_kk: '7606011508100001',
    nama: 'Hasnawati',
    jenis_kelamin: 'P',
    tempat_lahir: 'Topoyo',
    tanggal_lahir: '1992-06-15',
    agama: 'Islam',
    pendidikan: 'SMA / Sederajat',
    pekerjaan: 'Mengurus Rumah Tangga',
    status_kawin: 'Kawin',
    golongan_darah: 'A',
    hubungan_keluarga: 'Istri',
    alamat: 'Jl. Trans Sulawesi KM 5',
    dusun: 'Dusun Salupangkang 1',
    rt: '001',
    rw: '001',
    status_dasar: 'Hidup'
  },
  {
    id: 'sp-p-3',
    tenant_id: 'salupangkang',
    nik: '7606010503800003',
    no_kk: '7606012009120002',
    nama: 'Mapparessa',
    jenis_kelamin: 'L',
    tempat_lahir: 'Polewali',
    tanggal_lahir: '1980-03-05',
    agama: 'Islam',
    pendidikan: 'SMP / Sederajat',
    pekerjaan: 'Wiraswasta / Pedagang',
    status_kawin: 'Kawin',
    golongan_darah: 'B',
    hubungan_keluarga: 'Kepala Keluarga',
    alamat: 'Dusun Bumi Raya',
    dusun: 'Dusun Salupangkang 2',
    rt: '002',
    rw: '001',
    status_dasar: 'Hidup'
  },

  // Warga Desa Sukamaju
  {
    id: 'sk-p-1',
    tenant_id: 'sukamaju',
    nik: '3202111205850001',
    no_kk: '3202111508100001',
    nama: 'Budi Santoso',
    jenis_kelamin: 'L',
    tempat_lahir: 'Sukabumi',
    tanggal_lahir: '1985-05-12',
    agama: 'Islam',
    pendidikan: 'S1 / Sarjana',
    pekerjaan: 'Wiraswasta',
    status_kawin: 'Kawin',
    golongan_darah: 'O',
    hubungan_keluarga: 'Kepala Keluarga',
    alamat: 'Jl. Melati No. 4',
    dusun: 'Dusun Mawar',
    rt: '001',
    rw: '002',
    status_dasar: 'Hidup'
  },
  {
    id: 'sk-p-2',
    tenant_id: 'sukamaju',
    nik: '3202115506880002',
    no_kk: '3202111508100001',
    nama: 'Siti Maryam',
    jenis_kelamin: 'P',
    tempat_lahir: 'Bogor',
    tanggal_lahir: '1988-06-15',
    agama: 'Islam',
    pendidikan: 'SMA / Sederajat',
    pekerjaan: 'Mengurus Rumah Tangga',
    status_kawin: 'Kawin',
    golongan_darah: 'A',
    hubungan_keluarga: 'Istri',
    alamat: 'Jl. Melati No. 4',
    dusun: 'Dusun Mawar',
    rt: '001',
    rw: '002',
    status_dasar: 'Hidup'
  }
];

export const DAFTAR_KELUARGA: Keluarga[] = [
  {
    no_kk: '7606011508100001',
    tenant_id: 'salupangkang',
    kepala_keluarga: 'Syahrir Ramadhan',
    nik_kepala: '7606011205880001',
    alamat: 'Jl. Trans Sulawesi KM 5',
    dusun: 'Dusun Salupangkang 1',
    rt: '001',
    rw: '001',
    jumlah_anggota: 2
  },
  {
    no_kk: '7606012009120002',
    tenant_id: 'salupangkang',
    kepala_keluarga: 'Mapparessa',
    nik_kepala: '7606010503800003',
    alamat: 'Dusun Bumi Raya',
    dusun: 'Dusun Salupangkang 2',
    rt: '002',
    rw: '001',
    jumlah_anggota: 3
  },
  {
    no_kk: '3202111508100001',
    tenant_id: 'sukamaju',
    kepala_keluarga: 'Budi Santoso',
    nik_kepala: '3202111205850001',
    alamat: 'Jl. Melati No. 4',
    dusun: 'Dusun Mawar',
    rt: '001',
    rw: '002',
    jumlah_anggota: 3
  }
];

export const DAFTAR_SURAT: SuratPermohonan[] = [
  {
    id: 'SRT-SP-001',
    tenant_id: 'salupangkang',
    nomor_surat: '470/012/SKU/DSP/X/2026',
    jenis_surat: 'Surat Keterangan Usaha (SKU)',
    kode_surat: 'SKU',
    nik_pemohon: '7606011205880001',
    nama_pemohon: 'Syahrir Ramadhan',
    tanggal_permohonan: '2026-10-18',
    tanggal_cetak: '2026-10-19',
    keperluan: 'Pengajuan Modal Kerja Perkebunan Sawit BRI Topoyo',
    status: 'Dicetak',
    keterangan_tambahan: 'Usaha Pengangkutan & Penjualan TBS Sawit'
  },
  {
    id: 'SRT-SP-002',
    tenant_id: 'salupangkang',
    nomor_surat: '470/013/SKTM/DSP/X/2026',
    jenis_surat: 'Surat Keterangan Tidak Mampu (SKTM)',
    kode_surat: 'SKTM',
    nik_pemohon: '7606010503800003',
    nama_pemohon: 'Mapparessa',
    tanggal_permohonan: '2026-10-20',
    keperluan: 'Persyaratan Keringanan Kuliah Anak',
    status: 'Menunggu',
  },
  {
    id: 'SRT-SK-001',
    tenant_id: 'sukamaju',
    nomor_surat: '470/024/SKU/DS/X/2026',
    jenis_surat: 'Surat Keterangan Usaha (SKU)',
    kode_surat: 'SKU',
    nik_pemohon: '3202111205850001',
    nama_pemohon: 'Budi Santoso',
    tanggal_permohonan: '2026-10-15',
    tanggal_cetak: '2026-10-16',
    keperluan: 'Pengajuan Kredit Usaha Rakyat (KUR) BRI',
    status: 'Dicetak',
    keterangan_tambahan: 'Toko Kelontong Berkah'
  }
];

export const DAFTAR_BANSOS: ProgramBansos[] = [
  {
    id: 'BNS-SP-01',
    tenant_id: 'salupangkang',
    nama_program: 'BLT Dana Desa Salupangkang 2026',
    kategori: 'BLT Dana Desa',
    asal_dana: 'Dana Desa',
    jumlah_penerima: 72,
    nominal_per_kpm: 300000,
    periode: 'Oktober 2026',
    status: 'Aktif'
  },
  {
    id: 'BNS-SK-01',
    tenant_id: 'sukamaju',
    nama_program: 'Program Keluarga Harapan (PKH) Sukamaju',
    kategori: 'PKH',
    asal_dana: 'APBN',
    jumlah_penerima: 142,
    nominal_per_kpm: 750000,
    periode: 'Triwulan IV 2026',
    status: 'Aktif'
  }
];

export const PENERIMA_BANSOS: PenerimaBansos[] = [
  {
    id: 'P-SP-01',
    tenant_id: 'salupangkang',
    program_id: 'BNS-SP-01',
    nik: '7606010503800003',
    nama: 'Mapparessa',
    no_kk: '7606012009120002',
    alamat: 'Dusun Bumi Raya',
    status_penyaluran: 'Sudah Diterima',
    tanggal_terima: '2026-10-14'
  }
];

export const APBDES_ITEMS: APBDesItem[] = [
  // Desa Salupangkang
  { id: 'apb-sp-1', tenant_id: 'salupangkang', kategori: 'Pendapatan', kode_rekening: '4.1', uraian: 'Pendapatan Asli Desa (PADes)', anggaran: 95000000, realisasi: 78000000, tahun: 2026 },
  { id: 'apb-sp-2', tenant_id: 'salupangkang', kategori: 'Pendapatan', kode_rekening: '4.2', uraian: 'Dana Desa (APBN)', anggaran: 920000000, realisasi: 920000000, tahun: 2026 },
  { id: 'apb-sp-3', tenant_id: 'salupangkang', kategori: 'Pendapatan', kode_rekening: '4.3', uraian: 'Alokasi Dana Desa (ADD Mamuju Tengah)', anggaran: 410000000, realisasi: 360000000, tahun: 2026 },
  { id: 'apb-sp-4', tenant_id: 'salupangkang', kategori: 'Belanja', kode_rekening: '5.1', uraian: 'Penyelenggaraan Pemerintahan Desa', anggaran: 450000000, realisasi: 410000000, tahun: 2026 },
  { id: 'apb-sp-5', tenant_id: 'salupangkang', kategori: 'Belanja', kode_rekening: '5.2', uraian: 'Pembangunan Jalan Tani & Drainase Sawit', anggaran: 620000000, realisasi: 580000000, tahun: 2026 },

  // Desa Sukamaju
  { id: 'apb-sk-1', tenant_id: 'sukamaju', kategori: 'Pendapatan', kode_rekening: '4.2', uraian: 'Dana Desa (APBN)', anggaran: 840000000, realisasi: 840000000, tahun: 2026 },
  { id: 'apb-sk-2', tenant_id: 'sukamaju', kategori: 'Belanja', kode_rekening: '5.2', uraian: 'Pembangunan Rabat Beton Jalan Dusun Melati', anggaran: 580000000, realisasi: 512000000, tahun: 2026 }
];

export const BERITA_DESA: BeritaDesa[] = [
  // Berita Desa Salupangkang
  {
    id: 'brt-sp-1',
    tenant_id: 'salupangkang',
    judul: 'Pemerintah Desa Salupangkang Salurkan BLT Dana Desa Tahap III Tahun 2026',
    slug: 'penyaluran-blt-desa-salupangkang-tahap-3',
    ringkasan: 'Sebanyak 72 Keluarga Penerima Manfaat di Desa Salupangkang menerima bantuan langsung tunai di Aula Kantor Desa.',
    konten: 'Penyaluran BLT Dana Desa dilaksanakan secara tertib dihadiri oleh Kepala Desa Salupangkang, BPD, Pendamping Desa, Babinsa, dan warga penerima manfaat.',
    kategori: 'Pemerintahan',
    penulis: 'Sekretariat Desa Salupangkang',
    tanggal: '2026-10-14'
  },
  {
    id: 'brt-sp-2',
    tenant_id: 'salupangkang',
    judul: 'Peningkatan Jalan Produksi Perkebunan Sawit Dusun Salupangkang 1 Rampung',
    slug: 'peningkatan-jalan-produksi-sawit',
    ringkasan: 'Akses jalan pertanian dan perkebunan sawit kini lebih kokoh memudahkan pengangkutan hasil panen warga.',
    konten: 'Pemerintah Desa Salupangkang menuntaskan pengerasan jalan usaha tani sepanjang 1,2 kilometer dari pos Dana Desa tahun 2026.',
    kategori: 'Pembangunan',
    penulis: 'Kasi Pemerintahan',
    tanggal: '2026-10-10'
  },

  // Berita Desa Sukamaju
  {
    id: 'brt-sk-1',
    tenant_id: 'sukamaju',
    judul: 'Pelayanan Pembuatan Surat Keterangan Online Lewat Layanan Mandiri',
    slug: 'pelayanan-surat-keterangan-online',
    ringkasan: 'Warga kini dapat mengajukan surat keterangan dari rumah melalui portal web resmi desa.',
    konten: 'Untuk mempermudah warga dalam mengurus surat keterangan seperti SKU, SKTM, dan Pengantar SKCK.',
    kategori: 'Pengumuman',
    penulis: 'Admin desDig',
    tanggal: '2026-10-01'
  }
];
