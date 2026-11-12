/**
 * ==============================================================================
 * PROYEK: PENGENDALIAN PROYEK KONSTRUKSI
 * FILE: server.js
 * DESKRIPSI: Backend REST API Server Node.js (Express.js) & MySQL2
 * FITUR UTAMA:
 * - CRUD Kontrol Material, Kebutuhan Tenaga Kerja, dan Quality Control (QC)
 * - Multer File Upload Handler (Bukti Foto QC, Benda Uji, & File MS Project .mpp / .xml / .xlsx)
 * - MS Project File Parser (.mpp, .xml, .csv) & Auto-Calculator Distribusi Kurva S Mingguan
 * - Fitur Input Progres Realisasi Lapangan dengan Rekalkulasi Kurva S Otomatis
 * - Civil Engineering Risk Impact Engine (+7 Hari untuk Critical, +3 Hari untuk High)
 * - Mode Hybrid Resilient: Mendukung MySQL Database & In-Memory Fallback
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Inisialisasi Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan Static Files Frontend dan Direktori Upload
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// ==============================================================================
// IN-MEMORY RESILIENT DATA STORE (FALLBACK JIKA MYSQL BELUM AKTIF)
// ==============================================================================
let isDbConnected = false;

const inMemoryStore = {
    materials: [
        { id: 1, nama_material: 'Semen Ramah Lingkungan (PCC Blended Fly Ash)', satuan: 'Sak', stok_masuk: 1200, stok_keluar: 950, sisa_stok: 250, min_stok: 300, perlu_reorder: 1, updated_at: '2026-11-03 10:00' },
        { id: 2, nama_material: 'Baja Tulangan Daur Ulang BJTS 420B (Ulir 16mm)', satuan: 'Batang', stok_masuk: 850, stok_keluar: 600, sisa_stok: 250, min_stok: 150, perlu_reorder: 0, updated_at: '2026-11-03 10:00' },
        { id: 3, nama_material: 'Porous Paving Block (Permeable Concrete)', satuan: 'M2', stok_masuk: 500, stok_keluar: 480, sisa_stok: 20, min_stok: 50, perlu_reorder: 1, updated_at: '2026-11-03 10:00' },
        { id: 4, nama_material: 'Bambu Petung Terawetkan Struktural', satuan: 'Batang', stok_masuk: 300, stok_keluar: 120, sisa_stok: 180, min_stok: 60, perlu_reorder: 0, updated_at: '2026-11-03 10:00' },
        { id: 5, nama_material: 'Cat Dinding Interior Low-VOC Eco-Shield', satuan: 'Pail', stok_masuk: 80, stok_keluar: 35, sisa_stok: 45, min_stok: 20, perlu_reorder: 0, updated_at: '2026-11-03 10:00' },
        { id: 6, nama_material: 'Solar PV Panel Monocrystalline 550Wp', satuan: 'Unit', stok_masuk: 60, stok_keluar: 10, sisa_stok: 50, min_stok: 15, perlu_reorder: 0, updated_at: '2026-11-03 10:00' }
    ],
    schedules: [
        { id: 1, nama_pekerjaan: 'Pekerjaan Persiapan & Manajemen Limbah Demolisi B3', start_date: '2026-11-01', end_date: '2026-11-14', plan_progress: 100.00, actual_progress: 100.00, bobot: 8.00, status: 'Selesai', delay_days: 0, durasi_hari: 13 },
        { id: 2, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', start_date: '2026-11-10', end_date: '2026-12-05', plan_progress: 100.00, actual_progress: 95.00, bobot: 18.00, status: 'Sedang Berjalan', delay_days: 0, durasi_hari: 25 },
        { id: 3, nama_pekerjaan: 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', start_date: '2026-11-25', end_date: '2026-12-30', plan_progress: 65.00, actual_progress: 50.00, bobot: 24.00, status: 'Sedang Berjalan', delay_days: 0, durasi_hari: 35 },
        { id: 4, nama_pekerjaan: 'Dinding Bata Ringan Ramah Lingkungan & Insulasi Termal', start_date: '2026-12-15', end_date: '2027-01-20', plan_progress: 25.00, actual_progress: 15.00, bobot: 16.00, status: 'Sedang Berjalan', delay_days: 0, durasi_hari: 36 },
        { id: 5, nama_pekerjaan: 'Instalasi MEP, Rainwater Harvesting & Solar Rooftop', start_date: '2027-01-05', end_date: '2027-02-15', plan_progress: 0.00, actual_progress: 0.00, bobot: 20.00, status: 'Belum Mulai', delay_days: 0, durasi_hari: 41 },
        { id: 6, nama_pekerjaan: 'Pekerjaan Finishing Green Building & Sertifikasi Greenship', start_date: '2027-02-01', end_date: '2027-02-28', plan_progress: 0.00, actual_progress: 0.00, bobot: 14.00, status: 'Belum Mulai', delay_days: 0, durasi_hari: 27 }
    ],
    scurve_plan: [],
    labor_requirements: [
        { id: 1, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', volume: 450.00, satuan: 'm³', koef_pekerja: 0.2500, koef_tukang: 0.0500, target_hari: 25, total_oh_pekerja: 112.50, total_oh_tukang: 22.50, total_oh: 135.00, pekerja_per_hari: 5, tukang_per_hari: 1, total_pekerja_hari: 6, catatan: 'Acuan SNI 7394:2008 Beton Ready Mix Rendah Emisi' },
        { id: 2, nama_pekerjaan: 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', volume: 12000.00, satuan: 'kg', koef_pekerja: 0.0080, koef_tukang: 0.0080, target_hari: 35, total_oh_pekerja: 96.00, total_oh_tukang: 96.00, total_oh: 192.00, pekerja_per_hari: 3, tukang_per_hari: 3, total_pekerja_hari: 6, catatan: 'Erection & Sambungan Baut Mutu Tinggi BJTS 420B' },
        { id: 3, nama_pekerjaan: 'Dinding Bata Ringan Ramah Lingkungan & Insulasi Termal', volume: 900.00, satuan: 'm²', koef_pekerja: 0.1000, koef_tukang: 0.0500, target_hari: 36, total_oh_pekerja: 90.00, total_oh_tukang: 45.00, total_oh: 135.00, pekerja_per_hari: 3, tukang_per_hari: 2, total_pekerja_hari: 5, catatan: 'AAC Block tebal 10cm + Mortar Thinbed Ramah Lingkungan' },
        { id: 4, nama_pekerjaan: 'Instalasi MEP, Rainwater Harvesting & Solar Rooftop', volume: 150.00, satuan: 'titik', koef_pekerja: 0.2000, koef_tukang: 0.3500, target_hari: 41, total_oh_pekerja: 30.00, total_oh_tukang: 52.50, total_oh: 82.50, pekerja_per_hari: 1, tukang_per_hari: 2, total_pekerja_hari: 3, catatan: 'Wiring Inverter Surya PV & Pipa Resapan Biopori' }
    ],
    attendance: [
        { id: 1, tanggal: '2026-11-03', nama_pekerja: 'Budi Santoso', jabatan: 'Site Engineer', status: 'Hadir', bukti_foto: null, jam_absen: '07:30 WIB' },
        { id: 2, tanggal: '2026-11-03', nama_pekerja: 'Ahmad Hidayat', jabatan: 'HSE Officer Green Building', status: 'Hadir', bukti_foto: null, jam_absen: '07:45 WIB' },
        { id: 3, tanggal: '2026-11-03', nama_pekerja: 'Supardi', jabatan: 'Mandor Pembesian', status: 'Hadir', bukti_foto: null, jam_absen: '07:50 WIB' },
        { id: 4, tanggal: '2026-11-03', nama_pekerja: 'Joko Susilo', jabatan: 'Operator Tower Crane', status: 'Hadir', bukti_foto: null, jam_absen: '08:00 WIB' },
        { id: 5, tanggal: '2026-11-03', nama_pekerja: 'Wahyu Pratama', jabatan: 'Teknisi MEP & Solar PV', status: 'Izin', bukti_foto: null, jam_absen: '08:15 WIB' }
    ],
    quality_control: [
        { id: 1, item_pekerjaan: 'Pengecoran Beton Ready Mix Kolom Lantai 2 (Zona A)', kategori: 'Struktur & Pembesian', metode_uji: 'Uji Slump (12±2 cm) & Uji Kuat Tekan Silinder fc\' 30 MPa', standar_acuan: 'SNI 2847:2019 / ASTM C39', tanggal_inspeksi: '2026-11-03', pic: 'Ir. Reza Fahmi (QC Eng.)', urgensi: 'Critical', status: 'Lolos QC / Approved', deskripsi: 'Nilai slump rata-rata 11.5 cm memenuhi toleransi. Benda uji silinder 6 sampel disiapkan untuk uji tekan 7, 14, dan 28 hari.', foto_inspeksi: null },
        { id: 2, item_pekerjaan: 'Pemasangan Tulangan Kolom & Selimut Beton (Rebar Spacing)', kategori: 'Struktur & Pembesian', metode_uji: 'Pemeriksaan Diameter, Jumlah Bar, Overlap Splice & Beton Decking', standar_acuan: 'Gambar DED & SNI 2052:2017', tanggal_inspeksi: '2026-11-04', pic: 'Supardi (Site Inspector)', urgensi: 'High', status: 'Perlu Perbaikan / Punch List', deskripsi: 'Ditemukan 3 titik decking beton pecah pada sisi timur kolom K-04 sehingga jarak selimut beton kurang dari 40 mm. Wajib dipasang kembali sebelum pouring beton.', foto_inspeksi: null },
        { id: 3, item_pekerjaan: 'Pipa Distribusi Air Bersih & Rainwater Harvesting', kategori: 'MEP & Plumbing', metode_uji: 'Hydrostatic Pressure Test (Tekanan Uji 10 Bar selama 2 Jam)', standar_acuan: 'SNI 03-6481-2000 Sistem Plambing', tanggal_inspeksi: '2026-11-05', pic: 'Dedi Suwandi (MEP Inspector)', urgensi: 'Medium', status: 'Lolos QC / Approved', deskripsi: 'Tekanan konstan 10 bar selama 2 jam tanpa ada penurunan jarum manometer. Tidak ada rembesan pada sambungan socket pipa HDPE.', foto_inspeksi: null },
        { id: 4, item_pekerjaan: 'Ketegakan & Plesteran Dinding Bata Ringan Koridor Lt. 1', kategori: 'Arsitektur & Façade', metode_uji: 'Uji Ketegakan Plumb Bob & Waterpass 2 Meter', standar_acuan: 'Toleransi Deviasi Maks 3mm per 2 Meter', tanggal_inspeksi: '2026-11-06', pic: 'Budi Santoso (Site Engineer)', urgensi: 'Low', status: 'Perlu Perbaikan / Punch List', deskripsi: 'Ditemukan deviasi ketegakan 5mm pada sudut barat dinding koridor. Perlu perataan dan acian ulang sebelum pengecatan primer.', foto_inspeksi: null }
    ],
    maintenance: [
        { id: 1, nama_komponen: 'Sistem Infiltrasi Rainwater Harvesting', kategori: 'Sanitasi & Plumbing', jenis_maintenance: 'Corrective', tanggal_jadwal: '2026-11-15', biaya: 4500000.00, pic: 'Ir. Reza Fahmi', status: 'Dalam Proses', nama_owner: 'PT. Investama Hijau Lestari', deskripsi: 'Debit resapan air hujan mengalami perlambatan akibat endapan sedimentasi pasir pasca hujan deras.', urgensi: 'High', foto_kerusakan: null, tgl_buat: '2026-11-01' },
        { id: 2, nama_komponen: 'Sensor Smart Lighting Koridor Lantai 2', kategori: 'MEP & Listrik', jenis_maintenance: 'Preventive', tanggal_jadwal: '2026-11-18', biaya: 1200000.00, pic: 'Dedi Suwandi', status: 'Pending', nama_owner: 'Bpk. Hendrawan (Tenant Direksi)', deskripsi: 'Kalibrasi rutin foton dan motion sensor efisiensi energi penerangan.', urgensi: 'Low', foto_kerusakan: null, tgl_buat: '2026-11-02' },
        { id: 3, nama_komponen: 'Lapisan Cat Exterior Weathercoat Sisi Barat', kategori: 'Arsitektur & Façade', jenis_maintenance: 'Emergency', tanggal_jadwal: '2026-11-12', biaya: 7800000.00, pic: 'Supardi', status: 'Pending', nama_owner: 'PT. Graha Hijau Nusantara', deskripsi: 'Terdapat retak rambut dan rembesan air pada façade akibat cuaca ekstrem.', urgensi: 'Critical', foto_kerusakan: null, tgl_buat: '2026-11-03' }
    ],
    risks: [
        { id: 1, nama_risiko: 'Keterlambatan Pasokan Beton Readymix Rendah Karbon', kategori: 'Waktu & Jadwal (Delay)', probability: 4, impact: 3, score: 12, level: 'High', mitigasi: 'Melakukan dual-sourcing batching plant bersertifikat ramah lingkungan terdekat.', status: 'Open', pekerjaan_id: 2, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', delay_days: 0 },
        { id: 2, nama_risiko: 'Curah Hujan Ekstrem Mengganggu Pengecoran Kolom', kategori: 'Faktor Cuaca & Alam', probability: 3, impact: 4, score: 12, level: 'High', mitigasi: 'Penyediaan tenda pelindung struktur dan pompa dewatering cadangan.', status: 'Open', pekerjaan_id: 2, nama_pekerjaan: 'Pondasi Bore Pile & Green Concrete Rendah Karbon', delay_days: 0 },
        { id: 3, nama_risiko: 'Keterlambatan Fabrikasi Sambungan Struktur Baja Daur Ulang', kategori: 'Mutu & Kualitas Material', probability: 5, impact: 4, score: 20, level: 'Critical', mitigasi: 'Inspeksi berkala ke workshop vendor dan penambahan shift perakitan erection.', status: 'Open', pekerjaan_id: 3, nama_pekerjaan: 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', delay_days: 0 }
    ],
    waste: [
        { id: 1, tanggal: '2026-11-02', nama_limbah: 'Limbah Oli Bekas Alat Berat & Excavator', kategori: 'Limbah B3', volume: 120.00, satuan: 'Liter', metode_pengelolaan: 'Diserahkan ke Pihak ke-3 Berizin', vendor_pengolah: 'PT. Wastec International B3', status: 'Selesai Terangkut / Didaur Ulang', keterangan: 'Penyerahan limbah oli hidrolik drum berizin B3 dengan berita acara manifest.', bukti_manifest: null },
        { id: 2, tanggal: '2026-11-03', nama_limbah: 'Sisa Potongan Besi Beton Tulangan (Scrap Rebar)', kategori: 'Limbah Padat Daur Ulang', volume: 450.00, satuan: 'Kg', metode_pengelolaan: 'Recycle', vendor_pengolah: 'PT. Baja Daur Ulang Mandiri', status: 'Selesai Terangkut / Didaur Ulang', keterangan: 'Dijual ke peleburan baja berlisensi daur ulang untuk diolah kembali.', bukti_manifest: null },
        { id: 3, tanggal: '2026-11-04', nama_limbah: 'Puing Beton & Mortar Demolisi Bangunan Lama', kategori: 'Limbah Non-B3 / Demolisi', volume: 12.50, satuan: 'Ton', metode_pengelolaan: 'Reuse', vendor_pengolah: 'Internal Proyek', status: 'Selesai Terangkut / Didaur Ulang', keterangan: 'Dihancurkan (crushed) untuk material urugan lapis pondasi jalan kerja sementara.', bukti_manifest: null },
        { id: 4, tanggal: '2026-11-05', nama_limbah: 'Kemasan Kaleng Cat Kimia & Thinner Low-VOC', kategori: 'Limbah B3', volume: 35.00, satuan: 'Kg', metode_pengelolaan: 'Penampungan TPS Sementara', vendor_pengolah: 'TPS B3 Proyek', status: 'Tersimpan di TPS', keterangan: 'Disimpan di TPS B3 berizin beratap dan berpalet kedap air.', bukti_manifest: null },
        { id: 5, tanggal: '2026-11-06', nama_limbah: 'Potongan Kayu Bekisting Rusak', kategori: 'Limbah Padat Daur Ulang', volume: 280.00, satuan: 'Kg', metode_pengelolaan: 'Reuse', vendor_pengolah: 'Pengrajin Palet Lokal', status: 'Tersimpan di TPS', keterangan: 'Dipilah untuk pembuatan patok ukur bowplank dan diserahkan ke pengrajin.', bukti_manifest: null }
    ],
    users: [
        { id: 1, email: 'admin@proyek.com', password: 'password123', name: 'Ir. Hendra Gunawan', role: 'admin', jabatan: 'Project Manager' },
        { id: 2, email: 'material@proyek.com', password: 'password123', name: 'Bambang Subagyo', role: 'material', jabatan: 'Petugas Gudang & Material' },
        { id: 3, email: 'planner@proyek.com', password: 'password123', name: 'Dian Paramitha, S.T.', role: 'planner', jabatan: 'Site Engineer & Planner' },
        { id: 4, email: 'mandor@proyek.com', password: 'password123', name: 'Pak Trisno (Mandor)', role: 'mandor', jabatan: 'Mandor Utama' },
        { id: 5, email: 'qc@proyek.com', password: 'password123', name: 'Ir. Reza Fahmi', role: 'qc', jabatan: 'Quality Control Engineer' },
        { id: 6, email: 'risk@proyek.com', password: 'password123', name: 'Siti Aminah, S.K.M.', role: 'risk', jabatan: 'Petugas HSE & K3' },
        { id: 7, email: 'waste@proyek.com', password: 'password123', name: 'Agus Purnomo', role: 'waste', jabatan: 'Petugas Lingkungan & Limbah' },
        { id: 8, email: 'alat@proyek.com', password: 'password123', name: 'Rahmat Hidayat', role: 'logistics', jabatan: 'Koordinator Alat Berat' },
        { id: 9, email: 'pekerja@proyek.com', password: 'password123', name: 'Wahyu Ramadhan', role: 'viewer', jabatan: 'Pekerja Lapangan (Tamu)' }
    ]
};

// ==============================================================================
// KONFIGURASI MULTER STORAGE (DUKUNGAN .MPP, .XML, .XLSX, .CSV, & GAMBAR)
// ==============================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedProjectExts = ['.xml', '.mpp', '.xlsx', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'xml_file' || file.fieldname === 'project_file') {
        if (allowedProjectExts.includes(ext) || file.mimetype.includes('xml') || file.mimetype.includes('project')) {
            return cb(null, true);
        }
        return cb(new Error('Format file tidak didukung! Harap upload file MS Project (.mpp, .xml, atau .xlsx/.csv).'), false);
    } else if (file.fieldname === 'bukti_manifest') {
        if (allowedImageExts.includes(ext) || ext === '.pdf' || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            return cb(null, true);
        }
        return cb(new Error('Format dokumen manifest tidak didukung! Harap upload JPG, PNG, WebP, atau PDF.'), false);
    } else {
        if (allowedImageExts.includes(ext) || file.mimetype.startsWith('image/')) {
            return cb(null, true);
        }
        return cb(new Error('Format gambar tidak didukung! Harap upload JPG, PNG, atau WebP.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: fileFilter
});

// ==============================================================================
// KONFIGURASI DATABASE MYSQL CONNECTION POOL
// ==============================================================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'green_construction',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    dateStrings: true
};

const pool = mysql.createPool(dbConfig);

// Inisialisasi Database MySQL & Auto-Bootstrap Skema & Tabel
async function ensureTablesExist(conn) {
    try {
        const [tables] = await conn.query(`SHOW TABLES LIKE 'schedules'`);
        if (!tables || tables.length === 0) {
            console.log("⚙️ [Database] Mendeteksi database kosong. Membuat seluruh tabel otomatis...");

            // 1. Kebutuhan Tenaga Kerja (Labor Requirements)
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`labor_requirements\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`nama_pekerjaan\` VARCHAR(150) NOT NULL,
                    \`volume\` DECIMAL(12, 2) NOT NULL,
                    \`satuan\` VARCHAR(50) NOT NULL,
                    \`koef_pekerja\` DECIMAL(8, 4) NOT NULL,
                    \`koef_tukang\` DECIMAL(8, 4) NOT NULL,
                    \`target_hari\` INT NOT NULL,
                    \`total_oh_pekerja\` DECIMAL(12, 2) NOT NULL,
                    \`total_oh_tukang\` DECIMAL(12, 2) NOT NULL,
                    \`total_oh\` DECIMAL(12, 2) NOT NULL,
                    \`pekerja_per_hari\` INT NOT NULL,
                    \`tukang_per_hari\` INT NOT NULL,
                    \`total_pekerja_hari\` INT NOT NULL,
                    \`catatan\` VARCHAR(255) NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // Attendance (Legacy Fallback)
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`attendance\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`tanggal\` DATE NOT NULL,
                    \`nama_pekerja\` VARCHAR(100) NOT NULL,
                    \`jabatan\` VARCHAR(100) NOT NULL,
                    \`status\` ENUM('Hadir', 'Izin', 'Sakit', 'Alpha') NOT NULL DEFAULT 'Hadir',
                    \`bukti_foto\` VARCHAR(255) NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX \`idx_attendance_tanggal\` (\`tanggal\`),
                    INDEX \`idx_attendance_status\` (\`status\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // 2. Materials
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`materials\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`nama_material\` VARCHAR(150) NOT NULL,
                    \`satuan\` VARCHAR(50) NOT NULL,
                    \`stok_masuk\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                    \`stok_keluar\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                    \`sisa_stok\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                    \`min_stok\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_materials_sisa\` (\`sisa_stok\`, \`min_stok\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // 3. Schedules
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`schedules\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`nama_pekerjaan\` VARCHAR(200) NOT NULL,
                    \`start_date\` DATE NOT NULL,
                    \`end_date\` DATE NOT NULL,
                    \`plan_progress\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                    \`actual_progress\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                    \`bobot\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                    \`status\` ENUM('Belum Mulai', 'Sedang Berjalan', 'Selesai', 'Terlambat') NOT NULL DEFAULT 'Belum Mulai',
                    \`delay_days\` INT NOT NULL DEFAULT 0,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_schedules_dates\` (\`start_date\`, \`end_date\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // 4. SCurve Plan
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`scurve_plan\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`periode\` VARCHAR(50) NOT NULL,
                    \`plan_kumulatif\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                    \`actual_kumulatif\` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY \`uk_scurve_periode\` (\`periode\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // 5. Quality Control (QC)
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`quality_control\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`item_pekerjaan\` VARCHAR(200) NOT NULL,
                    \`kategori\` VARCHAR(100) NOT NULL,
                    \`metode_uji\` VARCHAR(200) NOT NULL,
                    \`standar_acuan\` VARCHAR(150) NULL,
                    \`tanggal_inspeksi\` DATE NOT NULL,
                    \`pic\` VARCHAR(100) NOT NULL,
                    \`urgensi\` ENUM('Minor', 'Moderate', 'Major', 'Critical') NOT NULL DEFAULT 'Moderate',
                    \`status\` ENUM('Lolos QC / Approved', 'Perlu Perbaikan / Punch List', 'Ditolak / Rejected', 'Menunggu Uji Lab') NOT NULL DEFAULT 'Perlu Perbaikan / Punch List',
                    \`deskripsi\` TEXT NULL,
                    \`foto_inspeksi\` VARCHAR(255) NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_qc_status\` (\`status\`),
                    INDEX \`idx_qc_tanggal\` (\`tanggal_inspeksi\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // Maintenance (Legacy Fallback)
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`maintenance\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`nama_komponen\` VARCHAR(150) NOT NULL,
                    \`kategori\` VARCHAR(100) NOT NULL,
                    \`jenis_maintenance\` ENUM('Preventive', 'Corrective', 'Emergency', 'Predictive') NOT NULL DEFAULT 'Corrective',
                    \`tanggal_jadwal\` DATE NOT NULL,
                    \`biaya\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
                    \`pic\` VARCHAR(100) NOT NULL,
                    \`status\` ENUM('Pending', 'Dalam Proses', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Pending',
                    \`nama_owner\` VARCHAR(150) NOT NULL,
                    \`deskripsi\` TEXT NULL,
                    \`urgensi\` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
                    \`foto_kerusakan\` VARCHAR(255) NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_maintenance_status\` (\`status\`),
                    INDEX \`idx_maintenance_urgensi\` (\`urgensi\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // 6. Risks
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`risks\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`nama_risiko\` VARCHAR(200) NOT NULL,
                    \`kategori\` VARCHAR(100) NOT NULL,
                    \`probability\` INT NOT NULL,
                    \`impact\` INT NOT NULL,
                    \`score\` INT NOT NULL,
                    \`level\` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
                    \`mitigasi\` TEXT NULL,
                    \`status\` ENUM('Open', 'Mitigated', 'Closed') NOT NULL DEFAULT 'Open',
                    \`pekerjaan_id\` INT NOT NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_risks_level\` (\`level\`),
                    INDEX \`idx_risks_pekerjaan\` (\`pekerjaan_id\`),
                    CONSTRAINT \`fk_risks_schedules\` FOREIGN KEY (\`pekerjaan_id\`) REFERENCES \`schedules\`(\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // 7. Waste Management (Analisis & Manajemen Limbah Terpisah)
            await conn.query(`
                CREATE TABLE IF NOT EXISTS \`waste_management\` (
                    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                    \`tanggal\` DATE NOT NULL,
                    \`nama_limbah\` VARCHAR(150) NOT NULL,
                    \`kategori\` ENUM('Limbah B3', 'Limbah Padat Daur Ulang', 'Limbah Non-B3 / Demolisi', 'Limbah Domestik / Organik') NOT NULL,
                    \`volume\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                    \`satuan\` VARCHAR(20) NOT NULL DEFAULT 'Kg',
                    \`metode_pengelolaan\` ENUM('Reuse', 'Recycle', 'Diserahkan ke Pihak ke-3 Berizin', 'Penampungan TPS Sementara') NOT NULL,
                    \`vendor_pengolah\` VARCHAR(150) NULL,
                    \`status\` ENUM('Tersimpan di TPS', 'Selesai Terangkut / Didaur Ulang') NOT NULL DEFAULT 'Tersimpan di TPS',
                    \`keterangan\` TEXT NULL,
                    \`bukti_manifest\` VARCHAR(255) NULL,
                    \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX \`idx_waste_kategori\` (\`kategori\`),
                    INDEX \`idx_waste_status\` (\`status\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);

            // Isi Data Awal (Seeds) ke MySQL
            for (const s of inMemoryStore.schedules) {
                await conn.query(
                    `INSERT INTO schedules (id, nama_pekerjaan, start_date, end_date, plan_progress, actual_progress, bobot, status, delay_days)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [s.id, s.nama_pekerjaan, s.start_date, s.end_date, s.plan_progress, s.actual_progress, s.bobot, s.status, s.delay_days]
                );
            }

            for (const m of inMemoryStore.materials) {
                await conn.query(
                    `INSERT INTO materials (id, nama_material, satuan, stok_masuk, stok_keluar, sisa_stok, min_stok)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [m.id, m.nama_material, m.satuan, m.stok_masuk, m.stok_keluar, m.sisa_stok, m.min_stok]
                );
            }

            for (const a of inMemoryStore.attendance) {
                await conn.query(
                    `INSERT INTO attendance (id, tanggal, nama_pekerja, jabatan, status, bukti_foto)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [a.id, a.tanggal, a.nama_pekerja, a.jabatan, a.status, a.bukti_foto]
                );
            }

            for (const m of inMemoryStore.maintenance) {
                await conn.query(
                    `INSERT INTO maintenance (id, nama_komponen, kategori, jenis_maintenance, tanggal_jadwal, biaya, pic, status, nama_owner, deskripsi, urgensi, foto_kerusakan)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [m.id, m.nama_komponen, m.kategori, m.jenis_maintenance, m.tanggal_jadwal, m.biaya, m.pic, m.status, m.nama_owner, m.deskripsi, m.urgensi, m.foto_kerusakan]
                );
            }

            for (const r of inMemoryStore.risks) {
                await conn.query(
                    `INSERT INTO risks (id, nama_risiko, kategori, probability, impact, score, level, mitigasi, status, pekerjaan_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [r.id, r.nama_risiko, r.kategori, r.probability, r.impact, r.score, r.level, r.mitigasi, r.status, r.pekerjaan_id]
                );
            }

            for (const w of inMemoryStore.waste) {
                await conn.query(
                    `INSERT INTO waste_management (id, tanggal, nama_limbah, kategori, volume, satuan, metode_pengelolaan, vendor_pengolah, status, keterangan, bukti_manifest)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [w.id, w.tanggal, w.nama_limbah, w.kategori, w.volume, w.satuan, w.metode_pengelolaan, w.vendor_pengolah, w.status, w.keterangan, w.bukti_manifest]
                );
            }

            console.log("✅ [Database] Seluruh tabel (schedules, materials, attendance, maintenance, risks, waste_management) & data awal berhasil dibuat!");
        } else {
            // Cek apakah tabel waste_management sudah dibuat terpisah
            const [wasteCheck] = await conn.query(`SHOW TABLES LIKE 'waste_management'`);
            if (!wasteCheck || wasteCheck.length === 0) {
                console.log("⚙️ [Database] Menambahkan tabel 'waste_management' yang terpisah...");
                await conn.query(`
                    CREATE TABLE IF NOT EXISTS \`waste_management\` (
                        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                        \`tanggal\` DATE NOT NULL,
                        \`nama_limbah\` VARCHAR(150) NOT NULL,
                        \`kategori\` ENUM('Limbah B3', 'Limbah Padat Daur Ulang', 'Limbah Non-B3 / Demolisi', 'Limbah Domestik / Organik') NOT NULL,
                        \`volume\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                        \`satuan\` VARCHAR(20) NOT NULL DEFAULT 'Kg',
                        \`metode_pengelolaan\` ENUM('Reuse', 'Recycle', 'Diserahkan ke Pihak ke-3 Berizin', 'Penampungan TPS Sementara') NOT NULL,
                        \`vendor_pengolah\` VARCHAR(150) NULL,
                        \`status\` ENUM('Tersimpan di TPS', 'Selesai Terangkut / Didaur Ulang') NOT NULL DEFAULT 'Tersimpan di TPS',
                        \`keterangan\` TEXT NULL,
                        \`bukti_manifest\` VARCHAR(255) NULL,
                        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX \`idx_waste_kategori\` (\`kategori\`),
                        INDEX \`idx_waste_status\` (\`status\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                `);
                for (const w of inMemoryStore.waste) {
                    await conn.query(
                        `INSERT INTO waste_management (id, tanggal, nama_limbah, kategori, volume, satuan, metode_pengelolaan, vendor_pengolah, status, keterangan, bukti_manifest)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [w.id, w.tanggal, w.nama_limbah, w.kategori, w.volume, w.satuan, w.metode_pengelolaan, w.vendor_pengolah, w.status, w.keterangan, w.bukti_manifest]
                    );
                }
                console.log("✅ [Database] Tabel 'waste_management' terpisah berhasil diaktifkan!");
            }
        }
    } catch (createErr) {
        console.error("❌ [Database] Error saat auto-create tabel:", createErr.message);
    }
}

async function initDatabase() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ [Database] Berhasil terhubung ke MySQL database:', dbConfig.database);
        isDbConnected = true;
        // Pastikan tabel ada, jika belum ada buat otomatis!
        await ensureTablesExist(connection);
        connection.release();
        await calculateAndSaveSCurve();
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            console.warn('⚠️ [Database] Service MySQL belum aktif (ECONNREFUSED pada port ' + dbConfig.port + ').');
            console.log('💡 [System] Mengaktifkan Mode In-Memory Resilient. Aplikasi tetap berfungsi penuh!');
            isDbConnected = false;
        } else if (err.code === 'ER_BAD_DB_ERROR' || (err.message && err.message.includes('Unknown database'))) {
            console.warn(`⚠️ [Database] Database '${dbConfig.database}' belum ada. Mencoba membuat otomatis...`);
            try {
                const rootConn = await mysql.createConnection({
                    host: dbConfig.host,
                    user: dbConfig.user,
                    password: dbConfig.password,
                    port: dbConfig.port
                });
                await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
                await rootConn.end();

                const dbConn = await mysql.createConnection({
                    host: dbConfig.host,
                    user: dbConfig.user,
                    password: dbConfig.password,
                    database: dbConfig.database,
                    port: dbConfig.port
                });
                await ensureTablesExist(dbConn);
                await dbConn.end();
                isDbConnected = true;
            } catch (createErr) {
                console.error('❌ [Database] Gagal membuat database otomatis:', createErr.message);
            }
        } else {
            console.warn('⚠️ [Database] Koneksi MySQL:', err.message);
        }
        await calculateAndSaveSCurve();
    }
}
initDatabase();

// ==============================================================================
// HELPER: KALKULASI & DISTRIBUSI KURVA S PROYEK (S-CURVE ENGINE)
// ==============================================================================
async function calculateAndSaveSCurve() {
    try {
        let tasks = [];
        if (isDbConnected) {
            try {
                const [rows] = await pool.query(`SELECT * FROM schedules ORDER BY start_date ASC`);
                tasks = rows || [];
            } catch (queryErr) {
                if (queryErr.code === 'ER_NO_SUCH_TABLE' || (queryErr.message && queryErr.message.includes("doesn't exist"))) {
                    console.log("⚙️ [Database] Tabel 'schedules' belum ada. Membuat tabel & data otomatis...");
                    const conn = await pool.getConnection();
                    await ensureTablesExist(conn);
                    conn.release();
                    const [retryRows] = await pool.query(`SELECT * FROM schedules ORDER BY start_date ASC`);
                    tasks = retryRows || [];
                } else {
                    throw queryErr;
                }
            }
        } else {
            tasks = inMemoryStore.schedules;
        }

        if (!tasks || tasks.length === 0) {
            inMemoryStore.scurve_plan = [];
            return;
        }

        let minStart = new Date(tasks[0].start_date);
        let maxEnd = new Date(tasks[0].end_date);

        tasks.forEach(t => {
            const s = new Date(t.start_date);
            const e = new Date(t.end_date);
            if (s < minStart) minStart = s;
            if (e > maxEnd) maxEnd = e;
        });

        const totalDurationDays = Math.max(1, Math.ceil((maxEnd - minStart) / (1000 * 60 * 60 * 24)));
        const totalWeeks = Math.max(4, Math.ceil(totalDurationDays / 7));

        let totalWeightGiven = tasks.reduce((sum, t) => sum + parseFloat(t.bobot || 0), 0);
        const normalizedTasks = tasks.map(t => {
            const taskDur = Math.max(1, Math.ceil((new Date(t.end_date) - new Date(t.start_date)) / (1000 * 60 * 60 * 24)));
            let weight = parseFloat(t.bobot || 0);
            if (totalWeightGiven <= 0) {
                weight = (taskDur / totalDurationDays) * 100;
            } else {
                weight = (weight / totalWeightGiven) * 100;
            }
            return {
                ...t,
                weight: weight,
                taskDuration: taskDur,
                sDate: new Date(t.start_date),
                eDate: new Date(t.end_date)
            };
        });

        const weeklyData = [];
        for (let w = 1; w <= totalWeeks; w++) {
            const weekEndDate = new Date(minStart.getTime() + w * 7 * 24 * 60 * 60 * 1000);

            let weekPlannedProgress = 0;
            let weekActualProgress = 0;

            normalizedTasks.forEach(task => {
                let planRatio = 0;
                if (weekEndDate >= task.eDate) {
                    planRatio = 1.0;
                } else if (weekEndDate <= task.sDate) {
                    planRatio = 0.0;
                } else {
                    const elapsed = (weekEndDate - task.sDate) / (1000 * 60 * 60 * 24);
                    planRatio = Math.min(1.0, elapsed / task.taskDuration);
                }

                let actualRatio = 0;
                const reportedActual = (parseFloat(task.actual_progress) || 0) / 100;
                if (weekEndDate >= task.eDate) {
                    actualRatio = reportedActual;
                } else if (weekEndDate <= task.sDate) {
                    actualRatio = 0.0;
                } else {
                    const elapsed = (weekEndDate - task.sDate) / (1000 * 60 * 60 * 24);
                    const linearRatio = Math.min(1.0, elapsed / task.taskDuration);
                    actualRatio = Math.min(reportedActual, linearRatio * reportedActual);
                }

                weekPlannedProgress += task.weight * planRatio;
                weekActualProgress += task.weight * actualRatio;
            });

            const planKum = Math.min(100, Math.round(weekPlannedProgress * 100) / 100);
            const actKum = Math.min(100, Math.round(weekActualProgress * 100) / 100);

            weeklyData.push({
                id: w,
                periode: `Minggu ${w}`,
                plan_kumulatif: planKum,
                actual_kumulatif: actKum
            });
        }

        inMemoryStore.scurve_plan = weeklyData;

        if (isDbConnected) {
            await pool.query(`DELETE FROM scurve_plan`);
            for (const item of weeklyData) {
                await pool.query(
                    `INSERT INTO scurve_plan (periode, plan_kumulatif, actual_kumulatif) VALUES (?, ?, ?)`,
                    [item.periode, item.plan_kumulatif, item.actual_kumulatif]
                );
            }
        }
    } catch (err) {
        console.error('❌ [S-Curve Engine] Error kalkulasi Kurva S:', err.message);
    }
}

// ==============================================================================
// HELPER: PARSER FILE MS PROJECT (.MPP, .XML, .CSV)
// ==============================================================================
function parseProjectFile(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();
    const parsedTasks = [];

    if (ext === '.xml') {
        const xmlContent = fs.readFileSync(filePath, 'utf8');
        try {
            const { XMLParser } = require('fast-xml-parser');
            const parser = new XMLParser({ ignoreAttributes: false });
            const jsonObj = parser.parse(xmlContent);
            let tasksContainer = jsonObj?.Project?.Tasks?.Task || jsonObj?.Tasks?.Task;
            if (tasksContainer) {
                const rawTasks = Array.isArray(tasksContainer) ? tasksContainer : [tasksContainer];
                rawTasks.forEach(task => {
                    if (task.Name && task.Start && task.Finish) {
                        const name = String(task.Name).trim();
                        if (name && !name.toLowerCase().includes('project summary')) {
                            parsedTasks.push({
                                name: name,
                                start: String(task.Start).substring(0, 10),
                                end: String(task.Finish).substring(0, 10),
                                progress: parseFloat(task.PercentComplete) || 0
                            });
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('⚠️ Fallback regex parser XML...');
        }

        if (parsedTasks.length === 0) {
            const taskMatches = xmlContent.match(/<Task[\s\S]*?<\/Task>/gi) || [];
            taskMatches.forEach(taskBlock => {
                const nameMatch = taskBlock.match(/<Name>([\s\S]*?)<\/Name>/i);
                const startMatch = taskBlock.match(/<Start>([\s\S]*?)<\/Start>/i);
                const finishMatch = taskBlock.match(/<Finish>([\s\S]*?)<\/Finish>/i);
                const percentMatch = taskBlock.match(/<PercentComplete>([\s\S]*?)<\/PercentComplete>/i);

                if (nameMatch && startMatch && finishMatch) {
                    const name = nameMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                    const start = startMatch[1].substring(0, 10);
                    const finish = finishMatch[1].substring(0, 10);
                    const progress = percentMatch ? (parseFloat(percentMatch[1]) || 0) : 0;
                    if (name.length > 0 && !name.toLowerCase().includes('project summary')) {
                        parsedTasks.push({ name, start, end: finish, progress });
                    }
                }
            });
        }
    } else if (ext === '.csv') {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length > 1) {
            const header = lines[0].toLowerCase().split(/[,;\t]/).map(h => h.trim().replace(/["']/g, ''));
            const nameIdx = header.findIndex(h => h.includes('name') || h.includes('nama') || h.includes('task') || h.includes('pekerjaan'));
            const startIdx = header.findIndex(h => h.includes('start') || h.includes('mulai'));
            const endIdx = header.findIndex(h => h.includes('finish') || h.includes('end') || h.includes('selesai'));
            const progIdx = header.findIndex(h => h.includes('progress') || h.includes('progres') || h.includes('percent') || h.includes('%'));

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
                const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
                const start = startIdx >= 0 && cols[startIdx] ? cols[startIdx] : new Date().toISOString().substring(0, 10);
                const end = endIdx >= 0 && cols[endIdx] ? cols[endIdx] : new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 10);
                const progress = progIdx >= 0 ? (parseFloat(cols[progIdx]) || 0) : 0;
                if (name && name.length > 2) {
                    parsedTasks.push({ name, start: start.substring(0, 10), end: end.substring(0, 10), progress });
                }
            }
        }
    } else if (ext === '.mpp') {
        // Ekstraksi UTF-16LE dari berkas biner MS Project (.mpp)
        const buffer = fs.readFileSync(filePath);
        const utf16Str = buffer.toString('utf16le');
        const candidates = utf16Str.match(/([A-Za-z0-9\s&/()\-.,]{6,75})/g) || [];
        const seen = new Set();
        const baseDate = new Date();

        candidates.forEach(c => {
            const cleaned = c.trim();
            const lower = cleaned.toLowerCase();
            const isRelevant = lower.includes('pekerjaan') || lower.includes('struktur') || lower.includes('pondasi') || 
                               lower.includes('beton') || lower.includes('dinding') || lower.includes('mep') || 
                               lower.includes('finishing') || lower.includes('green') || lower.includes('atap') || 
                               lower.includes('plumbing') || lower.includes('solar') || lower.includes('lantai') ||
                               lower.includes('persiapan') || lower.includes('instalasi') || lower.includes('proyek');

            if (isRelevant && !seen.has(lower) && cleaned.length >= 8) {
                seen.add(lower);
                const s = new Date(baseDate.getTime() + (parsedTasks.length * 7 * 86400000));
                const e = new Date(s.getTime() + (14 * 86400000));
                parsedTasks.push({
                    name: cleaned,
                    start: s.toISOString().substring(0, 10),
                    end: e.toISOString().substring(0, 10),
                    progress: 0
                });
            }
        });
    }

    return parsedTasks;
}

// ==============================================================================
// 1. MODUL: KONTROL MATERIAL
// ==============================================================================
app.get('/api/materials', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, nama_material, satuan, 
                       CAST(stok_masuk AS DECIMAL(12,2)) as stok_masuk,
                       CAST(stok_keluar AS DECIMAL(12,2)) as stok_keluar,
                       CAST((stok_masuk - stok_keluar) AS DECIMAL(12,2)) as sisa_stok,
                       CAST(min_stok AS DECIMAL(12,2)) as min_stok,
                       CASE WHEN (stok_masuk - stok_keluar) <= min_stok THEN 1 ELSE 0 END AS perlu_reorder,
                       DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') as updated_at
                FROM materials ORDER BY id DESC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.materials });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.materials });
    }
});

app.post('/api/materials', async (req, res) => {
    try {
        const { nama_material, satuan, stok_masuk, stok_keluar, min_stok } = req.body;
        const masuk = parseFloat(stok_masuk) || 0;
        const keluar = parseFloat(stok_keluar) || 0;
        const sisa = masuk - keluar;
        const min = parseFloat(min_stok) || 0;

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO materials (nama_material, satuan, stok_masuk, stok_keluar, sisa_stok, min_stok) VALUES (?, ?, ?, ?, ?, ?)`,
                [nama_material, satuan, masuk, keluar, sisa, min]
            );
            return res.status(201).json({ success: true, message: 'Material berhasil ditambahkan!', id: result.insertId });
        }

        const newId = inMemoryStore.materials.length + 1;
        inMemoryStore.materials.unshift({
            id: newId,
            nama_material,
            satuan,
            stok_masuk: masuk,
            stok_keluar: keluar,
            sisa_stok: sisa,
            min_stok: min,
            perlu_reorder: sisa <= min ? 1 : 0,
            updated_at: new Date().toISOString().substring(0, 16).replace('T', ' ')
        });
        res.status(201).json({ success: true, message: 'Material berhasil ditambahkan (In-Memory)!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_material, satuan, stok_masuk, stok_keluar, min_stok } = req.body;
        const masuk = parseFloat(stok_masuk) || 0;
        const keluar = parseFloat(stok_keluar) || 0;
        const sisa = masuk - keluar;
        const min = parseFloat(min_stok) || 0;

        if (isDbConnected) {
            await pool.query(
                `UPDATE materials SET nama_material=?, satuan=?, stok_masuk=?, stok_keluar=?, sisa_stok=?, min_stok=? WHERE id=?`,
                [nama_material, satuan, masuk, keluar, sisa, min, id]
            );
        } else {
            const item = inMemoryStore.materials.find(m => m.id == id);
            if (item) {
                Object.assign(item, { nama_material, satuan, stok_masuk: masuk, stok_keluar: keluar, sisa_stok: sisa, min_stok: min, perlu_reorder: sisa <= min ? 1 : 0 });
            }
        }
        res.json({ success: true, message: 'Material berhasil diperbarui!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/materials/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM materials WHERE id = ?`, [id]);
        } else {
            inMemoryStore.materials = inMemoryStore.materials.filter(m => m.id != id);
        }
        res.json({ success: true, message: 'Material berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================================================
// 2. MODUL: KEBUTUHAN TENAGA KERJA (LABOR REQUIREMENTS)
// ==============================================================================
app.get('/api/labor-requirements', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, nama_pekerjaan, volume, satuan, koef_pekerja, koef_tukang,
                       target_hari, total_oh_pekerja, total_oh_tukang, total_oh,
                       pekerja_per_hari, tukang_per_hari, total_pekerja_hari, catatan,
                       DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at
                FROM labor_requirements ORDER BY id DESC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.labor_requirements });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.labor_requirements });
    }
});

app.post('/api/labor-requirements', async (req, res) => {
    try {
        const {
            nama_pekerjaan, volume, satuan, koef_pekerja, koef_tukang, target_hari, catatan
        } = req.body;

        const vol = parseFloat(volume) || 0;
        const kp = parseFloat(koef_pekerja) || 0;
        const kt = parseFloat(koef_tukang) || 0;
        const dur = parseInt(target_hari) || 1;

        const totalOhPekerja = parseFloat((vol * kp).toFixed(2));
        const totalOhTukang = parseFloat((vol * kt).toFixed(2));
        const totalOh = parseFloat((totalOhPekerja + totalOhTukang).toFixed(2));
        const pekerjaPerHari = Math.ceil(totalOhPekerja / dur) || 0;
        const tukangPerHari = Math.ceil(totalOhTukang / dur) || 0;
        const totalPekerjaHari = pekerjaPerHari + tukangPerHari;

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO labor_requirements 
                (nama_pekerjaan, volume, satuan, koef_pekerja, koef_tukang, target_hari, total_oh_pekerja, total_oh_tukang, total_oh, pekerja_per_hari, tukang_per_hari, total_pekerja_hari, catatan) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nama_pekerjaan, vol, satuan || 'm³', kp, kt, dur, totalOhPekerja, totalOhTukang, totalOh, pekerjaPerHari, tukangPerHari, totalPekerjaHari, catatan || '']
            );
            return res.status(201).json({ success: true, message: 'Analisis kebutuhan tenaga kerja berhasil disimpan!', id: result.insertId });
        }

        const newId = inMemoryStore.labor_requirements.length + 1;
        const newItem = {
            id: newId,
            nama_pekerjaan,
            volume: vol,
            satuan: satuan || 'm³',
            koef_pekerja: kp,
            koef_tukang: kt,
            target_hari: dur,
            total_oh_pekerja: totalOhPekerja,
            total_oh_tukang: totalOhTukang,
            total_oh: totalOh,
            pekerja_per_hari: pekerjaPerHari,
            tukang_per_hari: tukangPerHari,
            total_pekerja_hari: totalPekerjaHari,
            catatan: catatan || '',
            created_at: new Date().toISOString()
        };
        inMemoryStore.labor_requirements.unshift(newItem);
        res.status(201).json({ success: true, message: 'Analisis kebutuhan tenaga kerja berhasil disimpan!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/labor-requirements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM labor_requirements WHERE id = ?`, [id]);
        } else {
            inMemoryStore.labor_requirements = inMemoryStore.labor_requirements.filter(a => a.id != id);
        }
        res.json({ success: true, message: 'Analisis kebutuhan tenaga kerja berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Fallback Routes: Presensi / Attendance (Backward-Compatibility)
app.get('/api/attendance', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal, nama_pekerja, jabatan, status, bukti_foto,
                       DATE_FORMAT(created_at, '%H:%i WIB') as jam_absen
                FROM attendance ORDER BY tanggal DESC, id DESC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.attendance });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.attendance });
    }
});

app.post('/api/attendance', upload.single('bukti_foto'), async (req, res) => {
    try {
        const { tanggal, nama_pekerja, jabatan, status } = req.body;
        const buktiFotoPath = req.file ? `/uploads/${req.file.filename}` : null;

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO attendance (tanggal, nama_pekerja, jabatan, status, bukti_foto) VALUES (?, ?, ?, ?, ?)`,
                [tanggal, nama_pekerja, jabatan, status || 'Hadir', buktiFotoPath]
            );
            return res.status(201).json({ success: true, message: 'Presensi berhasil disimpan!', id: result.insertId });
        }

        const newId = inMemoryStore.attendance.length + 1;
        inMemoryStore.attendance.unshift({
            id: newId,
            tanggal,
            nama_pekerja,
            jabatan,
            status: status || 'Hadir',
            bukti_foto: buktiFotoPath,
            jam_absen: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        });
        res.status(201).json({ success: true, message: 'Presensi berhasil disimpan!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/attendance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM attendance WHERE id = ?`, [id]);
        } else {
            inMemoryStore.attendance = inMemoryStore.attendance.filter(a => a.id != id);
        }
        res.json({ success: true, message: 'Presensi berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================================================
// 3. MODUL: QUALITY CONTROL (QC) & KENDALI MUTU KONSTRUKSI
// ==============================================================================
app.get('/api/quality-control', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, item_pekerjaan, kategori, metode_uji, standar_acuan,
                       DATE_FORMAT(tanggal_inspeksi, '%Y-%m-%d') as tanggal_inspeksi,
                       pic, urgensi, status, deskripsi, foto_inspeksi,
                       DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at
                FROM quality_control ORDER BY id DESC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.quality_control });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.quality_control });
    }
});

app.post('/api/quality-control', upload.single('foto_inspeksi'), async (req, res) => {
    try {
        const { item_pekerjaan, kategori, metode_uji, standar_acuan, tanggal_inspeksi, pic, urgensi, status, deskripsi } = req.body;
        const fotoInspeksi = req.file ? `/uploads/${req.file.filename}` : null;

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO quality_control (item_pekerjaan, kategori, metode_uji, standar_acuan, tanggal_inspeksi, pic, urgensi, status, deskripsi, foto_inspeksi)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [item_pekerjaan, kategori || 'Umum', metode_uji, standar_acuan || '-', tanggal_inspeksi, pic, urgensi || 'Moderate', status || 'Perlu Perbaikan / Punch List', deskripsi || '', fotoInspeksi]
            );
            return res.status(201).json({ success: true, message: 'Laporan Quality Control berhasil disimpan!', id: result.insertId });
        }

        const newId = inMemoryStore.quality_control.length + 1;
        inMemoryStore.quality_control.unshift({
            id: newId,
            item_pekerjaan,
            kategori: kategori || 'Umum',
            metode_uji,
            standar_acuan: standar_acuan || '-',
            tanggal_inspeksi,
            pic,
            urgensi: urgensi || 'Moderate',
            status: status || 'Perlu Perbaikan / Punch List',
            deskripsi: deskripsi || '',
            foto_inspeksi: fotoInspeksi,
            created_at: new Date().toISOString()
        });
        res.status(201).json({ success: true, message: 'Laporan Quality Control berhasil disimpan!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/quality-control/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (isDbConnected) {
            await pool.query(`UPDATE quality_control SET status = ? WHERE id = ?`, [status, id]);
        } else {
            const item = inMemoryStore.quality_control.find(q => q.id == id);
            if (item) item.status = status;
        }
        res.json({ success: true, message: 'Status QC berhasil diperbarui!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/quality-control/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM quality_control WHERE id = ?`, [id]);
        } else {
            inMemoryStore.quality_control = inMemoryStore.quality_control.filter(q => q.id != id);
        }
        res.json({ success: true, message: 'Catatan Quality Control berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Fallback Routes: Aduan & Pemeliharaan (Backward-Compatibility)
app.get('/api/maintenance', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, nama_komponen, kategori, jenis_maintenance, 
                       DATE_FORMAT(tanggal_jadwal, '%Y-%m-%d') as tanggal_jadwal,
                       CAST(biaya AS DECIMAL(14,2)) as biaya, pic, status, nama_owner, deskripsi, 
                       urgensi, foto_kerusakan, DATE_FORMAT(created_at, '%Y-%m-%d') as tgl_buat
                FROM maintenance ORDER BY tanggal_jadwal ASC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.maintenance });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.maintenance });
    }
});

app.post('/api/maintenance', upload.single('foto_kerusakan'), async (req, res) => {
    try {
        const { nama_komponen, kategori, jenis_maintenance, tanggal_jadwal, biaya, pic, status, nama_owner, deskripsi, urgensi } = req.body;
        const fotoKerusakan = req.file ? `/uploads/${req.file.filename}` : null;

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO maintenance (nama_komponen, kategori, jenis_maintenance, tanggal_jadwal, biaya, pic, status, nama_owner, deskripsi, urgensi, foto_kerusakan)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nama_komponen, kategori || 'Umum', jenis_maintenance || 'Corrective', tanggal_jadwal, parseFloat(biaya) || 0, pic || 'Tim Lapangan', status || 'Pending', nama_owner, deskripsi || '', urgensi || 'Medium', fotoKerusakan]
            );
            return res.status(201).json({ success: true, message: 'Aduan pemeliharaan berhasil didaftarkan!', id: result.insertId });
        }

        const newId = inMemoryStore.maintenance.length + 1;
        inMemoryStore.maintenance.unshift({
            id: newId,
            nama_komponen,
            kategori: kategori || 'Umum',
            jenis_maintenance: jenis_maintenance || 'Corrective',
            tanggal_jadwal,
            biaya: parseFloat(biaya) || 0,
            pic: pic || 'Tim Lapangan',
            status: status || 'Pending',
            nama_owner,
            deskripsi: deskripsi || '',
            urgensi: urgensi || 'Medium',
            foto_kerusakan: fotoKerusakan,
            tgl_buat: new Date().toISOString().substring(0, 10)
        });
        res.status(201).json({ success: true, message: 'Aduan pemeliharaan berhasil didaftarkan!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/maintenance/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (isDbConnected) {
            await pool.query(`UPDATE maintenance SET status = ? WHERE id = ?`, [status, id]);
        } else {
            const item = inMemoryStore.maintenance.find(m => m.id == id);
            if (item) item.status = status;
        }
        res.json({ success: true, message: `Status berhasil diubah menjadi "${status}".` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/maintenance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM maintenance WHERE id = ?`, [id]);
        } else {
            inMemoryStore.maintenance = inMemoryStore.maintenance.filter(m => m.id != id);
        }
        res.json({ success: true, message: 'Tiket pemeliharaan berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================================================
// 4. MODUL: JADWAL WBS & PARSING FILE MS PROJECT (.MPP / .XML / .CSV)
// ==============================================================================
app.get('/api/schedules', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, nama_pekerjaan, 
                       DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, 
                       DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, 
                       CAST(plan_progress AS DECIMAL(5,2)) as plan_progress, 
                       CAST(actual_progress AS DECIMAL(5,2)) as actual_progress, 
                       CAST(bobot AS DECIMAL(5,2)) as bobot,
                       status, delay_days,
                       DATEDIFF(end_date, start_date) as durasi_hari
                FROM schedules ORDER BY start_date ASC, id ASC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.schedules });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.schedules });
    }
});

// FITUR UTAMA BARU: INPUT / UPDATE PROGRES REALISASI WBS
app.put('/api/schedules/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;
        const actual_progress = Math.min(100, Math.max(0, parseFloat(req.body.actual_progress) || 0));

        let currentTask = null;

        if (isDbConnected) {
            const [rows] = await pool.query('SELECT * FROM schedules WHERE id = ?', [id]);
            if (rows.length === 0) return res.status(404).json({ success: false, message: 'Item WBS tidak ditemukan.' });
            currentTask = rows[0];

            let newStatus = 'Belum Mulai';
            if (actual_progress >= 100) {
                newStatus = 'Selesai';
            } else if (actual_progress > 0) {
                newStatus = (actual_progress < parseFloat(currentTask.plan_progress) || currentTask.delay_days > 0) ? 'Terlambat' : 'Sedang Berjalan';
            }

            await pool.query(
                `UPDATE schedules SET actual_progress = ?, status = ? WHERE id = ?`,
                [actual_progress, newStatus, id]
            );
            await calculateAndSaveSCurve();
        } else {
            const item = inMemoryStore.schedules.find(s => s.id == id);
            if (!item) return res.status(404).json({ success: false, message: 'Item WBS tidak ditemukan.' });
            item.actual_progress = actual_progress;
            if (actual_progress >= 100) {
                item.status = 'Selesai';
            } else if (actual_progress > 0) {
                item.status = (actual_progress < item.plan_progress || item.delay_days > 0) ? 'Terlambat' : 'Sedang Berjalan';
            } else {
                item.status = 'Belum Mulai';
            }
            await calculateAndSaveSCurve();
        }

        res.json({
            success: true,
            message: `Progres realisasi berhasil diperbarui menjadi ${actual_progress}%! Kurva S telah dikalkulasi ulang.`,
            actual_progress: actual_progress
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memperbarui progres realisasi: ' + err.message });
    }
});

// FITUR UTAMA BARU: BATCH UPDATE PROGRES REALISASI
app.post('/api/schedules/batch-progress', async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, actual_progress }
        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Data update progres tidak valid!' });
        }

        for (const item of updates) {
            const prog = Math.min(100, Math.max(0, parseFloat(item.actual_progress) || 0));
            if (isDbConnected) {
                await pool.query(
                    `UPDATE schedules SET actual_progress = ?, status = CASE WHEN ? >= 100 THEN 'Selesai' WHEN ? > 0 THEN 'Sedang Berjalan' ELSE 'Belum Mulai' END WHERE id = ?`,
                    [prog, prog, prog, item.id]
                );
            } else {
                const target = inMemoryStore.schedules.find(s => s.id == item.id);
                if (target) {
                    target.actual_progress = prog;
                    target.status = prog >= 100 ? 'Selesai' : (prog > 0 ? 'Sedang Berjalan' : 'Belum Mulai');
                }
            }
        }

        await calculateAndSaveSCurve();
        res.json({ success: true, message: `Berhasil memperbarui progres ${updates.length} pekerjaan WBS!` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// TAMBAH WBS MANUAL
app.post('/api/schedules', async (req, res) => {
    try {
        const { nama_pekerjaan, start_date, end_date, plan_progress, actual_progress, bobot } = req.body;
        const plan = parseFloat(plan_progress) || 100;
        const act = parseFloat(actual_progress) || 0;
        const bbt = parseFloat(bobot) || 0;
        const status = act >= 100 ? 'Selesai' : (act > 0 ? 'Sedang Berjalan' : 'Belum Mulai');

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO schedules (nama_pekerjaan, start_date, end_date, plan_progress, actual_progress, bobot, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [nama_pekerjaan, start_date, end_date, plan, act, bbt, status]
            );
            await calculateAndSaveSCurve();
            return res.status(201).json({ success: true, message: 'Pekerjaan WBS berhasil ditambahkan!', id: result.insertId });
        }

        const newId = inMemoryStore.schedules.length + 1;
        inMemoryStore.schedules.push({
            id: newId,
            nama_pekerjaan,
            start_date,
            end_date,
            plan_progress: plan,
            actual_progress: act,
            bobot: bbt,
            status,
            delay_days: 0,
            durasi_hari: Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000))
        });
        await calculateAndSaveSCurve();
        res.status(201).json({ success: true, message: 'Pekerjaan WBS berhasil ditambahkan!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// FITUR UTAMA BARU: UPLOAD & PARSING FILE MS PROJECT (.MPP / .XML / .XLSX / .CSV)
app.post(['/api/schedules/upload-xml', '/api/schedules/upload-project'], upload.single('xml_file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Harap sertakan file MS Project (.mpp, .xml, atau .xlsx/.csv)!' });
        }

        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const parsedTasks = parseProjectFile(filePath, originalName);

        // Jika file .mpp binary sangat kompleks dan tidak ada teks task yang bisa diekstrak murni:
        if (parsedTasks.length === 0) {
            const ext = path.extname(originalName).toLowerCase();
            if (ext === '.mpp') {
                return res.status(200).json({
                    success: false,
                    is_mpp_notice: true,
                    message: `File "${originalName}" diterima, namun Microsoft Project menggunakan enkripsi biner proprietary tertutup.\n\n💡 SOLUSI MUDAH 100% AKURAT:\nDi Microsoft Project, klik Menu File > Save As (Simpan Sebagai) > Pilih jenis file 'XML Format (*.xml)', lalu unggah file .xml tersebut ke sistem ini.`
                });
            }
            return res.status(400).json({ success: false, message: 'Tidak ada task valid yang dapat diimpor dari file ini.' });
        }

        let totalDays = 0;
        parsedTasks.forEach(t => {
            const diff = Math.max(1, Math.ceil((new Date(t.end) - new Date(t.start)) / 86400000));
            t.duration = diff;
            totalDays += diff;
        });

        const newSchedules = [];
        let idCounter = 1;

        if (isDbConnected) {
            await pool.query('SET FOREIGN_KEY_CHECKS = 0');
            await pool.query('TRUNCATE TABLE risks');
            await pool.query('TRUNCATE TABLE schedules');
            await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        } else {
            inMemoryStore.schedules = [];
            inMemoryStore.risks = [];
        }

        for (const task of parsedTasks) {
            const bobot = parseFloat(((task.duration / totalDays) * 100).toFixed(2));
            const status = task.progress >= 100 ? 'Selesai' : (task.progress > 0 ? 'Sedang Berjalan' : 'Belum Mulai');

            if (isDbConnected) {
                await pool.query(
                    `INSERT INTO schedules (nama_pekerjaan, start_date, end_date, plan_progress, actual_progress, bobot, status, delay_days)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                    [task.name, task.start, task.end, 100.00, task.progress, bobot, status]
                );
            } else {
                inMemoryStore.schedules.push({
                    id: idCounter++,
                    nama_pekerjaan: task.name,
                    start_date: task.start,
                    end_date: task.end,
                    plan_progress: 100.00,
                    actual_progress: task.progress,
                    bobot,
                    status,
                    delay_days: 0,
                    durasi_hari: task.duration
                });
            }
        }

        await calculateAndSaveSCurve();

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: `Berhasil mengimpor ${parsedTasks.length} pekerjaan WBS dari file MS Project ("${originalName}") dan mengkalkulasi Kurva S!`,
            tasks_count: parsedTasks.length
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal memproses file MS Project: ' + err.message });
    }
});

// RELOAD DEMO SAMPLE MS PROJECT
app.post('/api/schedules/load-demo', async (req, res) => {
    try {
        const sampleXmlPath = path.join(__dirname, 'sample_project.xml');
        if (!fs.existsSync(sampleXmlPath)) {
            return res.status(404).json({ success: false, message: 'File sample_project.xml tidak ditemukan.' });
        }
        const tasks = parseProjectFile(sampleXmlPath, 'sample_project.xml');

        let totalDays = 0;
        tasks.forEach(t => {
            const diff = Math.max(1, Math.ceil((new Date(t.end) - new Date(t.start)) / 86400000));
            t.duration = diff;
            totalDays += diff;
        });

        if (isDbConnected) {
            await pool.query('SET FOREIGN_KEY_CHECKS = 0');
            await pool.query('TRUNCATE TABLE risks');
            await pool.query('TRUNCATE TABLE schedules');
            await pool.query('SET FOREIGN_KEY_CHECKS = 1');
            for (const t of tasks) {
                const bbt = parseFloat(((t.duration / totalDays) * 100).toFixed(2));
                const st = t.progress >= 100 ? 'Selesai' : (t.progress > 0 ? 'Sedang Berjalan' : 'Belum Mulai');
                await pool.query(
                    `INSERT INTO schedules (nama_pekerjaan, start_date, end_date, plan_progress, actual_progress, bobot, status, delay_days) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
                    [t.name, t.start, t.end, 100.00, t.progress, bbt, st]
                );
            }
        } else {
            inMemoryStore.schedules = tasks.map((t, i) => ({
                id: i + 1,
                nama_pekerjaan: t.name,
                start_date: t.start,
                end_date: t.end,
                plan_progress: 100.00,
                actual_progress: t.progress,
                bobot: parseFloat(((t.duration / totalDays) * 100).toFixed(2)),
                status: t.progress >= 100 ? 'Selesai' : (t.progress > 0 ? 'Sedang Berjalan' : 'Belum Mulai'),
                delay_days: 0,
                durasi_hari: t.duration
            }));
        }

        await calculateAndSaveSCurve();
        res.json({ success: true, message: 'Berhasil memuat contoh proyek MS Project Green Building!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: KURVA S
app.get('/api/scurve', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, periode, 
                       CAST(plan_kumulatif AS DECIMAL(5,2)) as plan_kumulatif, 
                       CAST(actual_kumulatif AS DECIMAL(5,2)) as actual_kumulatif,
                       CAST((actual_kumulatif - plan_kumulatif) AS DECIMAL(5,2)) as deviasi
                FROM scurve_plan ORDER BY id ASC
            `);
            if (rows && rows.length > 0) return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.scurve_plan });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.scurve_plan });
    }
});

// ==============================================================================
// 5. MODUL: MANAJEMEN RISIKO, LIMBAH & RISK IMPACT ENGINE
// ==============================================================================
app.get('/api/risks', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT r.id, r.nama_risiko, r.kategori, r.probability, r.impact, r.score, r.level, 
                       r.mitigasi, r.status, r.pekerjaan_id,
                       s.nama_pekerjaan, 
                       DATE_FORMAT(s.start_date, '%Y-%m-%d') as wbs_start,
                       DATE_FORMAT(s.end_date, '%Y-%m-%d') as wbs_end,
                       s.delay_days
                FROM risks r
                LEFT JOIN schedules s ON r.pekerjaan_id = s.id
                ORDER BY r.score DESC, r.id DESC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.risks });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.risks });
    }
});

app.post('/api/risks', async (req, res) => {
    try {
        const { nama_risiko, kategori, probability, impact, mitigasi, status, pekerjaan_id } = req.body;
        const prob = Math.min(5, Math.max(1, parseInt(probability) || 1));
        const imp = Math.min(5, Math.max(1, parseInt(impact) || 1));
        const score = prob * imp;

        let level = 'Low';
        if (score >= 20) level = 'Critical';
        else if (score >= 12) level = 'High';
        else if (score >= 6) level = 'Medium';

        let impactDetails = { applied: false, delay_added_days: 0, impact_level: level, message: 'Risiko tidak memicu delay.' };

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO risks (nama_risiko, kategori, probability, impact, score, level, mitigasi, status, pekerjaan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [nama_risiko, kategori || 'Umum', prob, imp, score, level, mitigasi || '', status || 'Open', pekerjaan_id]
            );

            if (level === 'Critical' || level === 'High') {
                const addedDays = level === 'Critical' ? 7 : 3;
                const progressLagPenalty = level === 'Critical' ? 10.0 : 5.0;

                await pool.query(`
                    UPDATE schedules 
                    SET end_date = DATE_ADD(end_date, INTERVAL ? DAY),
                        delay_days = delay_days + ?,
                        actual_progress = GREATEST(0.00, actual_progress - ?),
                        status = CASE WHEN actual_progress >= 100 THEN 'Selesai' ELSE 'Terlambat' END
                    WHERE id = ?
                `, [addedDays, addedDays, progressLagPenalty, pekerjaan_id]);

                await calculateAndSaveSCurve();

                impactDetails = {
                    applied: true,
                    delay_added_days: addedDays,
                    impact_level: level,
                    message: `⚠️ [RISK IMPACT ENGINE AKTIF] Risiko level ${level} (Skor: ${score}) menambah +${addedDays} hari pada WBS #${pekerjaan_id} dan Kurva S Realisasi telah dirender ulang!`
                };
            }
            return res.status(201).json({ success: true, message: `Risiko dicatat.`, id: result.insertId, score, level, impact: impactDetails });
        }

        // In-Memory Mode
        const newId = inMemoryStore.risks.length + 1;
        const targetWbs = inMemoryStore.schedules.find(s => s.id == pekerjaan_id);
        const wbsName = targetWbs ? targetWbs.nama_pekerjaan : `WBS #${pekerjaan_id}`;

        if (targetWbs && (level === 'Critical' || level === 'High')) {
            const addedDays = level === 'Critical' ? 7 : 3;
            const progressLagPenalty = level === 'Critical' ? 10.0 : 5.0;
            const curEnd = new Date(targetWbs.end_date);
            curEnd.setDate(curEnd.getDate() + addedDays);
            targetWbs.end_date = curEnd.toISOString().substring(0, 10);
            targetWbs.delay_days = (targetWbs.delay_days || 0) + addedDays;
            targetWbs.actual_progress = Math.max(0, targetWbs.actual_progress - progressLagPenalty);
            targetWbs.status = targetWbs.actual_progress >= 100 ? 'Selesai' : 'Terlambat';

            await calculateAndSaveSCurve();

            impactDetails = {
                applied: true,
                delay_added_days: addedDays,
                impact_level: level,
                message: `⚠️ [RISK IMPACT ENGINE AKTIF] Risiko level ${level} (Skor: ${score}) menambah +${addedDays} hari pada WBS #${pekerjaan_id} dan Kurva S Realisasi telah dirender ulang!`
            };
        }

        inMemoryStore.risks.unshift({
            id: newId,
            nama_risiko,
            kategori: kategori || 'Umum',
            probability: prob,
            impact: imp,
            score,
            level,
            mitigasi: mitigasi || '',
            status: status || 'Open',
            pekerjaan_id,
            nama_pekerjaan: wbsName
        });

        res.status(201).json({ success: true, message: `Risiko dicatat.`, id: newId, score, level, impact: impactDetails });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/risks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM risks WHERE id = ?`, [id]);
        } else {
            inMemoryStore.risks = inMemoryStore.risks.filter(r => r.id != id);
        }
        res.json({ success: true, message: 'Data risiko berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/risks/matrix', async (req, res) => {
    try {
        let risksList = [];
        let totalDelay = 0;

        if (isDbConnected) {
            const [rows] = await pool.query(`SELECT * FROM risks`);
            risksList = rows || [];
            const [delaySum] = await pool.query(`SELECT SUM(delay_days) as total_delay FROM schedules`);
            totalDelay = delaySum[0]?.total_delay || 0;
        } else {
            risksList = inMemoryStore.risks;
            totalDelay = inMemoryStore.schedules.reduce((sum, s) => sum + (s.delay_days || 0), 0);
        }

        const matrix = {};
        for (let p = 1; p <= 5; p++) {
            matrix[p] = {};
            for (let i = 1; i <= 5; i++) matrix[p][i] = 0;
        }

        let critical_count = 0, high_count = 0, medium_count = 0, low_count = 0, open_count = 0;

        risksList.forEach(r => {
            const p = r.probability, i = r.impact;
            if (matrix[p] && matrix[p][i] !== undefined) matrix[p][i]++;
            if (r.level === 'Critical') critical_count++;
            else if (r.level === 'High') high_count++;
            else if (r.level === 'Medium') medium_count++;
            else low_count++;
            if (r.status === 'Open') open_count++;
        });

        res.json({
            success: true,
            matrix,
            summary: {
                total_risks: risksList.length,
                critical_count,
                high_count,
                medium_count,
                low_count,
                open_count
            },
            total_delay_days: totalDelay
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================================================
// 6. MODUL: MANAJEMEN & ANALISIS LIMBAH KONSTRUKSI (TERPISAH)
// ==============================================================================
// GET: Ambil Daftar Log Limbah Konstruksi
app.get('/api/waste', async (req, res) => {
    try {
        if (isDbConnected) {
            const [rows] = await pool.query(`
                SELECT id, DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal, nama_limbah, kategori, 
                       CAST(volume AS DECIMAL(10,2)) as volume, satuan, metode_pengelolaan, 
                       vendor_pengolah, status, keterangan, bukti_manifest,
                       DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at
                FROM waste_management 
                ORDER BY tanggal DESC, id DESC
            `);
            return res.json({ success: true, data: rows });
        }
        res.json({ success: true, data: inMemoryStore.waste });
    } catch (err) {
        res.json({ success: true, data: inMemoryStore.waste });
    }
});

// POST: Catat Timbulan Limbah Baru (Upload Bukti Manifest / Foto TPS)
app.post('/api/waste', upload.single('bukti_manifest'), async (req, res) => {
    try {
        const { tanggal, nama_limbah, kategori, volume, satuan, metode_pengelolaan, vendor_pengolah, status, keterangan } = req.body;
        if (!tanggal || !nama_limbah || !volume) {
            return res.status(400).json({ success: false, message: 'Tanggal, nama limbah, dan volume wajib diisi!' });
        }
        const vol = parseFloat(volume) || 0;
        const buktiFile = req.file ? `/uploads/${req.file.filename}` : null;

        if (isDbConnected) {
            const [result] = await pool.query(
                `INSERT INTO waste_management (tanggal, nama_limbah, kategori, volume, satuan, metode_pengelolaan, vendor_pengolah, status, keterangan, bukti_manifest)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [tanggal, nama_limbah, kategori || 'Limbah Padat Daur Ulang', vol, satuan || 'Kg', metode_pengelolaan || 'Recycle', vendor_pengolah || '', status || 'Tersimpan di TPS', keterangan || '', buktiFile]
            );
            return res.status(201).json({ success: true, message: 'Data limbah konstruksi berhasil dicatat!', id: result.insertId });
        }

        const newId = inMemoryStore.waste.length + 1;
        inMemoryStore.waste.unshift({
            id: newId,
            tanggal,
            nama_limbah,
            kategori: kategori || 'Limbah Padat Daur Ulang',
            volume: vol,
            satuan: satuan || 'Kg',
            metode_pengelolaan: metode_pengelolaan || 'Recycle',
            vendor_pengolah: vendor_pengolah || '',
            status: status || 'Tersimpan di TPS',
            keterangan: keterangan || '',
            bukti_manifest: buktiFile
        });
        res.status(201).json({ success: true, message: 'Data limbah konstruksi berhasil dicatat!', id: newId });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mencatat limbah: ' + err.message });
    }
});

// PUT: Perbarui Status Pengelolaan Limbah (Tersimpan di TPS -> Selesai Terangkut)
app.put('/api/waste/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (isDbConnected) {
            await pool.query(`UPDATE waste_management SET status = ? WHERE id = ?`, [status, id]);
        } else {
            const item = inMemoryStore.waste.find(w => w.id == id);
            if (item) item.status = status;
        }
        res.json({ success: true, message: `Status limbah berhasil diubah menjadi "${status}".` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE: Hapus Data Limbah
app.delete('/api/waste/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (isDbConnected) {
            await pool.query(`DELETE FROM waste_management WHERE id = ?`, [id]);
        } else {
            inMemoryStore.waste = inMemoryStore.waste.filter(w => w.id != id);
        }
        res.json({ success: true, message: 'Data limbah berhasil dihapus!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET: Statistik & Neraca Limbah Konstruksi (KPI & Data Chart)
app.get('/api/waste/stats', async (req, res) => {
    try {
        let items = [];
        if (isDbConnected) {
            const [rows] = await pool.query(`SELECT * FROM waste_management`);
            items = rows || [];
        } else {
            items = inMemoryStore.waste;
        }

        let totalVolumeKg = 0;
        let divertedVolumeKg = 0;
        let b3ItemsCount = 0;
        let tpsStoredCount = 0;

        const categories = {
            'Limbah B3': { count: 0, volume: 0 },
            'Limbah Padat Daur Ulang': { count: 0, volume: 0 },
            'Limbah Non-B3 / Demolisi': { count: 0, volume: 0 },
            'Limbah Domestik / Organik': { count: 0, volume: 0 }
        };

        items.forEach(w => {
            const vol = parseFloat(w.volume) || 0;
            const volKg = (w.satuan && w.satuan.toLowerCase() === 'ton') ? vol * 1000 : vol;
            totalVolumeKg += volKg;

            if (w.metode_pengelolaan === 'Reuse' || w.metode_pengelolaan === 'Recycle' || w.status === 'Selesai Terangkut / Didaur Ulang') {
                divertedVolumeKg += volKg;
            }

            if (w.kategori === 'Limbah B3') b3ItemsCount++;
            if (w.status === 'Tersimpan di TPS') tpsStoredCount++;

            if (categories[w.kategori]) {
                categories[w.kategori].count++;
                categories[w.kategori].volume += volKg;
            }
        });

        const diversionRate = totalVolumeKg > 0 ? ((divertedVolumeKg / totalVolumeKg) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            total_items: items.length,
            total_volume_kg: parseFloat(totalVolumeKg.toFixed(2)),
            diverted_volume_kg: parseFloat(divertedVolumeKg.toFixed(2)),
            diversion_rate: parseFloat(diversionRate),
            b3_count: b3ItemsCount,
            tps_stored_count: tpsStoredCount,
            category_breakdown: categories
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================================================
// 7. DASHBOARD EXECUTIVE KPI SUMMARY & HEALTH CHECK
// ==============================================================================
app.get('/api/dashboard/summary', async (req, res) => {
    try {
        if (isDbConnected) {
            const [matAlert] = await pool.query(`SELECT COUNT(*) as low_stock FROM materials WHERE (stok_masuk - stok_keluar) <= min_stok`);
            const [laborSum] = await pool.query(`SELECT SUM(total_pekerja_hari) as total_tenaga, SUM(tukang_per_hari) as total_tukang, SUM(pekerja_per_hari) as total_pekerja FROM labor_requirements`);
            const [qcCount] = await pool.query(`SELECT COUNT(*) as active_qc FROM quality_control WHERE status != 'Lolos QC / Approved'`);
            const [maintCount] = await pool.query(`SELECT COUNT(*) as pending_maint FROM maintenance WHERE status IN ('Pending', 'Dalam Proses')`);
            const [critRisks] = await pool.query(`SELECT COUNT(*) as crit_count FROM risks WHERE level = 'Critical' AND status = 'Open'`);
            const [prog] = await pool.query(`SELECT AVG(actual_progress) as avg_progress FROM schedules`);

            const workersNeeded = parseInt(laborSum[0]?.total_tenaga) || 0;
            const tukangNeeded = parseInt(laborSum[0]?.total_tukang) || 0;
            const pekerjaNeeded = parseInt(laborSum[0]?.total_pekerja) || 0;
            const activeQc = parseInt(qcCount[0]?.active_qc) || 0;

            return res.json({
                success: true,
                low_stock_materials: matAlert[0]?.low_stock || 0,
                workers_needed_per_day: workersNeeded,
                tukang_needed_per_day: tukangNeeded,
                pekerja_needed_per_day: pekerjaNeeded,
                workers_present_today: workersNeeded,
                active_qc_items: activeQc,
                active_maintenance: activeQc || (maintCount[0]?.pending_maint || 0),
                critical_risks: critRisks[0]?.crit_count || 0,
                average_progress: parseFloat((prog[0]?.avg_progress || 0).toFixed(1))
            });
        }

        // In-Memory Mode
        const low_stock = inMemoryStore.materials.filter(m => m.perlu_reorder === 1).length;
        const totalTenagaNeeded = inMemoryStore.labor_requirements.reduce((acc, l) => acc + (parseInt(l.total_pekerja_hari) || 0), 0);
        const tukangNeeded = inMemoryStore.labor_requirements.reduce((acc, l) => acc + (parseInt(l.tukang_per_hari) || 0), 0);
        const pekerjaNeeded = inMemoryStore.labor_requirements.reduce((acc, l) => acc + (parseInt(l.pekerja_per_hari) || 0), 0);
        const active_qc = inMemoryStore.quality_control.filter(q => q.status !== 'Lolos QC / Approved').length;
        const crit_risks = inMemoryStore.risks.filter(r => r.level === 'Critical' && r.status === 'Open').length;
        const totalProg = inMemoryStore.schedules.reduce((sum, s) => sum + (parseFloat(s.actual_progress) || 0), 0);
        const avg_prog = inMemoryStore.schedules.length > 0 ? (totalProg / inMemoryStore.schedules.length).toFixed(1) : 0;

        res.json({
            success: true,
            low_stock_materials: low_stock,
            workers_needed_per_day: totalTenagaNeeded,
            tukang_needed_per_day: tukangNeeded,
            pekerja_needed_per_day: pekerjaNeeded,
            workers_present_today: totalTenagaNeeded,
            active_qc_items: active_qc,
            active_maintenance: active_qc,
            critical_risks: crit_risks,
            average_progress: parseFloat(avg_prog)
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==============================================================================
// ENDPOINT: AUTENTIKASI & HAK AKSES PEKERJA (SIGN IN, REGISTER, USERS)
// ==============================================================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email dan password wajib diisi!' });
        }

        let user = null;
        if (isDbConnected) {
            try {
                const [rows] = await dbPool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
                if (rows && rows.length > 0) user = rows[0];
            } catch (dbErr) {
                console.warn('MySQL auth query error, fallback to inMemoryStore:', dbErr.message);
            }
        }

        if (!user) {
            user = inMemoryStore.users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Email pekerja tidak ditemukan.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ success: false, message: 'Password salah!' });
        }

        const { password: _, ...userSafe } = user;
        res.json({ success: true, message: 'Login berhasil!', user: userSafe });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login: ' + err.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name || !role) {
            return res.status(400).json({ success: false, message: 'Semua kolom registrasi wajib diisi!' });
        }

        const cleanEmail = email.trim().toLowerCase();
        let exists = inMemoryStore.users.find(u => u.email === cleanEmail);

        if (!exists && isDbConnected) {
            try {
                const [rows] = await dbPool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
                if (rows.length > 0) exists = true;
            } catch (e) {}
        }

        if (exists) {
            return res.status(400).json({ success: false, message: 'Email pekerja sudah terdaftar!' });
        }

        const newUser = {
            id: Date.now(),
            email: cleanEmail,
            password,
            name: name.trim(),
            role,
            jabatan: role === 'admin' ? 'Project Manager' : `Petugas ${role.toUpperCase()}`
        };

        if (isDbConnected) {
            try {
                const [result] = await dbPool.query(
                    'INSERT INTO users (email, password, name, role, jabatan) VALUES (?, ?, ?, ?, ?)',
                    [cleanEmail, password, name.trim(), role, newUser.jabatan]
                );
                newUser.id = result.insertId;
            } catch (e) {
                console.warn('Failed inserting user into MySQL, saved to in-memory:', e.message);
            }
        }

        inMemoryStore.users.push(newUser);
        const { password: _, ...userSafe } = newUser;
        res.status(201).json({ success: true, message: 'Registrasi pekerja berhasil!', user: userSafe });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal mendaftarkan pekerja: ' + err.message });
    }
});

app.get('/api/auth/users', (req, res) => {
    const safeUsers = inMemoryStore.users.map(({ password, ...u }) => u);
    res.json({ success: true, users: safeUsers });
});

app.get('/api/status', async (req, res) => {
    res.json({
        success: true,
        db_connected: isDbConnected,
        mode: isDbConnected ? 'MySQL Connected' : 'In-Memory Resilient Mode',
        message: isDbConnected
            ? 'Database MySQL aktif dan terhubung.'
            : 'Menjalankan In-Memory Resilient Mode. Untuk menyimpan data permanen ke MySQL, pastikan service MySQL aktif di port 3306.'
    });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`🚀 PENGENDALIAN PROYEK SERVER RUNNING!`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`📂 Uploads: ${UPLOADS_DIR}`);
    console.log(`💡 Mode: ${isDbConnected ? 'MySQL Database' : 'In-Memory Resilient Mode'}`);
    console.log(`=============================================================`);
});
