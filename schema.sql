-- ==============================================================================
-- PROYEK: PENGENDALIAN PROYEK KONSTRUKSI
-- SKEMA DATABASE LENGKAP DENGAN INTEGRASI WBS, KURVA S, KONTROL MATERIAL & RISIKO
-- DBMS: MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- ==============================================================================

-- 1. PEMBUATAN DATABASE
CREATE DATABASE IF NOT EXISTS `green_construction`
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `green_construction`;

-- Matikan foreign key check sementara untuk reset skema jika diperlukan
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `risks`;
DROP TABLE IF EXISTS `scurve_plan`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `materials`;
DROP TABLE IF EXISTS `labor_requirements`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `quality_control`;
DROP TABLE IF EXISTS `maintenance`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 2. TABEL: labor_requirements (Analisis Kebutuhan Tenaga Kerja Konstruksi)
-- Menghitung alokasi jumlah pekerja & tukang berdasarkan koefisien AHSP, volume, & target hari
-- ==============================================================================
CREATE TABLE `labor_requirements` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_pekerjaan` VARCHAR(150) NOT NULL,
    `volume` DECIMAL(12, 2) NOT NULL,
    `satuan` VARCHAR(50) NOT NULL,
    `koef_pekerja` DECIMAL(8, 4) NOT NULL,
    `koef_tukang` DECIMAL(8, 4) NOT NULL,
    `target_hari` INT NOT NULL,
    `total_oh_pekerja` DECIMAL(12, 2) NOT NULL,
    `total_oh_tukang` DECIMAL(12, 2) NOT NULL,
    `total_oh` DECIMAL(12, 2) NOT NULL,
    `pekerja_per_hari` INT NOT NULL,
    `tukang_per_hari` INT NOT NULL,
    `total_pekerja_hari` INT NOT NULL,
    `catatan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Fallback: attendance (Absensi Pekerja Lapangan)
CREATE TABLE `attendance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tanggal` DATE NOT NULL,
    `nama_pekerja` VARCHAR(100) NOT NULL,
    `jabatan` VARCHAR(100) NOT NULL,
    `status` ENUM('Hadir', 'Izin', 'Sakit', 'Alpha') NOT NULL DEFAULT 'Hadir',
    `bukti_foto` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_attendance_tanggal` (`tanggal`),
    INDEX `idx_attendance_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. TABEL: materials (Kontrol Material & Logistik Hijau)
-- Mengawasi stok masuk, keluar, sisa stok, serta peringatan min_stok (reorder)
-- ==============================================================================
CREATE TABLE `materials` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_material` VARCHAR(150) NOT NULL,
    `satuan` VARCHAR(50) NOT NULL,
    `stok_masuk` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `stok_keluar` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `sisa_stok` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `min_stok` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_materials_sisa` (`sisa_stok`, `min_stok`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger untuk menjaga keakuratan sisa_stok = stok_masuk - stok_keluar
DELIMITER $$
CREATE TRIGGER `trg_materials_before_insert`
BEFORE INSERT ON `materials`
FOR EACH ROW
BEGIN
    SET NEW.sisa_stok = NEW.stok_masuk - NEW.stok_keluar;
END$$

CREATE TRIGGER `trg_materials_before_update`
BEFORE UPDATE ON `materials`
FOR EACH ROW
BEGIN
    SET NEW.sisa_stok = NEW.stok_masuk - NEW.stok_keluar;
END$$
DELIMITER ;

-- ==============================================================================
-- 4. TABEL: schedules (WBS - Work Breakdown Structure Proyek)
-- Menyimpan jadwal pekerjaan konstruksi, durasi, bobot, dan progres rencana/realisasi
-- ==============================================================================
CREATE TABLE `schedules` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_pekerjaan` VARCHAR(200) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `plan_progress` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `actual_progress` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `bobot` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('Belum Mulai', 'Sedang Berjalan', 'Selesai', 'Terlambat') NOT NULL DEFAULT 'Belum Mulai',
    `delay_days` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_schedules_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. TABEL: scurve_plan (Distribusi Kurva S Proyek)
-- Menyimpan rekapitulasi progres kumulatif per periode (mingguan)
-- ==============================================================================
CREATE TABLE `scurve_plan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `periode` VARCHAR(50) NOT NULL,
    `plan_kumulatif` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `actual_kumulatif` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_scurve_periode` (`periode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 6. TABEL: quality_control (Inspeksi Mutu & Quality Control Konstruksi)
-- Pengelolaan inspeksi mutu lapangan, checklist toleransi, & punch list status
-- ==============================================================================
CREATE TABLE `quality_control` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `item_pekerjaan` VARCHAR(200) NOT NULL,
    `kategori` VARCHAR(100) NOT NULL,
    `metode_uji` VARCHAR(200) NOT NULL,
    `standar_acuan` VARCHAR(150) NULL,
    `tanggal_inspeksi` DATE NOT NULL,
    `pic` VARCHAR(100) NOT NULL,
    `urgensi` ENUM('Minor', 'Moderate', 'Major', 'Critical') NOT NULL DEFAULT 'Moderate',
    `status` ENUM('Lolos QC / Approved', 'Perlu Perbaikan / Punch List', 'Ditolak / Rejected', 'Menunggu Uji Lab') NOT NULL DEFAULT 'Perlu Perbaikan / Punch List',
    `deskripsi` TEXT NULL,
    `foto_inspeksi` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_qc_status` (`status`),
    INDEX `idx_qc_tanggal` (`tanggal_inspeksi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabel Fallback: maintenance (Aduan & Pemeliharaan Bangunan)
CREATE TABLE `maintenance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_komponen` VARCHAR(150) NOT NULL,
    `kategori` VARCHAR(100) NOT NULL,
    `jenis_maintenance` ENUM('Preventive', 'Corrective', 'Emergency', 'Predictive') NOT NULL DEFAULT 'Corrective',
    `tanggal_jadwal` DATE NOT NULL,
    `biaya` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `pic` VARCHAR(100) NOT NULL,
    `status` ENUM('Pending', 'Dalam Proses', 'Selesai', 'Dibatalkan') NOT NULL DEFAULT 'Pending',
    `nama_owner` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NULL,
    `urgensi` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    `foto_kerusakan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_maintenance_status` (`status`),
    INDEX `idx_maintenance_urgensi` (`urgensi`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 7. TABEL: risks (Manajemen Risiko Proyek Terhubung ke WBS Schedules)
-- Terhubung ke WBS (schedules) dengan foreign key ON DELETE CASCADE
-- ==============================================================================
CREATE TABLE `risks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nama_risiko` VARCHAR(200) NOT NULL,
    `kategori` VARCHAR(100) NOT NULL,
    `probability` INT NOT NULL,
    `impact` INT NOT NULL,
    `score` INT NOT NULL,
    `level` ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    `mitigasi` TEXT NULL,
    `status` ENUM('Open', 'Mitigated', 'Closed') NOT NULL DEFAULT 'Open',
    `pekerjaan_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `chk_probability` CHECK (`probability` BETWEEN 1 AND 5),
    CONSTRAINT `chk_impact` CHECK (`impact` BETWEEN 1 AND 5),
    CONSTRAINT `fk_risks_schedules` FOREIGN KEY (`pekerjaan_id`) 
        REFERENCES `schedules`(`id`) 
        ON DELETE CASCADE,
    INDEX `idx_risks_level` (`level`),
    INDEX `idx_risks_pekerjaan` (`pekerjaan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 8. TABEL: waste_management (Analisis & Manajemen Limbah Konstruksi Hijau)
-- Pengelolaan neraca limbah B3, daur ulang (reuse/recycle), dan residu sesuai ISO 14001
-- ==============================================================================
CREATE TABLE `waste_management` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tanggal` DATE NOT NULL,
    `nama_limbah` VARCHAR(150) NOT NULL,
    `kategori` ENUM('Limbah B3', 'Limbah Padat Daur Ulang', 'Limbah Non-B3 / Demolisi', 'Limbah Domestik / Organik') NOT NULL,
    `volume` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `satuan` VARCHAR(20) NOT NULL DEFAULT 'Kg',
    `metode_pengelolaan` ENUM('Reuse', 'Recycle', 'Diserahkan ke Pihak ke-3 Berizin', 'Penampungan TPS Sementara') NOT NULL,
    `vendor_pengolah` VARCHAR(150) NULL,
    `status` ENUM('Tersimpan di TPS', 'Selesai Terangkut / Didaur Ulang') NOT NULL DEFAULT 'Tersimpan di TPS',
    `keterangan` TEXT NULL,
    `bukti_manifest` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_waste_kategori` (`kategori`),
    INDEX `idx_waste_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 9. DATA AWAL (SEEDS) UNTUK TESTING & DEMO LANGSUNG
-- ==============================================================================

-- Data Awal: Material Konstruksi Berkelanjutan (Green Building)
INSERT INTO `materials` (`nama_material`, `satuan`, `stok_masuk`, `stok_keluar`, `sisa_stok`, `min_stok`) VALUES
('Semen Ramah Lingkungan (PCC Blended Fly Ash)', 'Sak', 1200.00, 950.00, 250.00, 300.00), -- Status: Alert Reorder!
('Baja Tulangan Daur Ulang BJTS 420B (Ulir 16mm)', 'Batang', 850.00, 600.00, 250.00, 150.00),
('Porous Paving Block (Permeable Concrete)', 'M2', 500.00, 480.00, 20.00, 50.00),    -- Status: Alert Reorder!
('Bambu Petung Terawetkan Struktural', 'Batang', 300.00, 120.00, 180.00, 60.00),
('Cat Dinding Interior Low-VOC Eco-Shield', 'Pail', 80.00, 35.00, 45.00, 20.00),
('Solar PV Panel Monocrystalline 550Wp', 'Unit', 60.00, 10.00, 50.00, 15.00);

-- Data Awal: WBS Schedules
INSERT INTO `schedules` (`id`, `nama_pekerjaan`, `start_date`, `end_date`, `plan_progress`, `actual_progress`, `bobot`, `status`, `delay_days`) VALUES
(1, 'Pekerjaan Persiapan & Manajemen Limbah Demolisi B3', '2026-11-01', '2026-11-14', 100.00, 100.00, 8.00, 'Selesai', 0),
(2, 'Pondasi Bore Pile & Green Concrete Rendah Karbon', '2026-11-10', '2026-12-05', 100.00, 95.00, 18.00, 'Sedang Berjalan', 0),
(3, 'Struktur Kolom & Balok Baja Daur Ulang Bertingkat', '2026-11-25', '2026-12-30', 65.00, 50.00, 24.00, 'Sedang Berjalan', 0),
(4, 'Dinding Bata Ringan Ramah Lingkungan & Insulasi Termal', '2026-12-15', '2027-01-20', 25.00, 15.00, 16.00, 'Sedang Berjalan', 0),
(5, 'Instalasi MEP, Rainwater Harvesting & Solar Rooftop', '2027-01-05', '2027-02-15', 0.00, 0.00, 20.00, 'Belum Mulai', 0),
(6, 'Pekerjaan Finishing Green Building & Sertifikasi Greenship', '2027-02-01', '2027-02-28', 0.00, 0.00, 14.00, 'Belum Mulai', 0);

-- Data Awal: Distribusi Kurva S Mingguan
INSERT INTO `scurve_plan` (`periode`, `plan_kumulatif`, `actual_kumulatif`) VALUES
('Minggu 1', 2.50, 2.50),
('Minggu 2', 7.50, 7.00),
('Minggu 3', 15.00, 14.20),
('Minggu 4', 25.00, 22.50),
('Minggu 5', 38.00, 34.00),
('Minggu 6', 53.00, 46.50),
('Minggu 7', 68.00, 58.00),
('Minggu 8', 81.00, 70.00),
('Minggu 9', 91.00, 80.50),
('Minggu 10', 97.00, 88.00),
('Minggu 11', 100.00, 93.50);

-- Data Awal: Kebutuhan Tenaga Kerja Lapangan
INSERT INTO `labor_requirements` (`nama_pekerjaan`, `volume`, `satuan`, `koef_pekerja`, `koef_tukang`, `target_hari`, `total_oh_pekerja`, `total_oh_tukang`, `total_oh`, `pekerja_per_hari`, `tukang_per_hari`, `total_pekerja_hari`, `catatan`) VALUES
('Pondasi Bore Pile & Green Concrete Rendah Karbon', 450.00, 'm³', 0.2500, 0.0500, 25, 112.50, 22.50, 135.00, 5, 1, 6, 'Acuan SNI 7394:2008 Beton Ready Mix Rendah Emisi'),
('Struktur Kolom & Balok Baja Daur Ulang Bertingkat', 12000.00, 'kg', 0.0080, 0.0080, 35, 96.00, 96.00, 192.00, 3, 3, 6, 'Erection & Sambungan Baut Mutu Tinggi BJTS 420B'),
('Dinding Bata Ringan Ramah Lingkungan & Insulasi Termal', 900.00, 'm²', 0.1000, 0.0500, 36, 90.00, 45.00, 135.00, 3, 2, 5, 'AAC Block tebal 10cm + Mortar Thinbed Ramah Lingkungan'),
('Instalasi MEP, Rainwater Harvesting & Solar Rooftop', 150.00, 'titik', 0.2000, 0.3500, 41, 30.00, 52.50, 82.50, 1, 2, 3, 'Wiring Inverter Surya PV & Pipa Resapan Biopori');

-- Data Awal: Absensi Pekerja
INSERT INTO `attendance` (`tanggal`, `nama_pekerja`, `jabatan`, `status`, `bukti_foto`) VALUES
('2026-11-03', 'Budi Santoso', 'Site Engineer', 'Hadir', NULL),
('2026-11-03', 'Ahmad Hidayat', 'HSE Officer Green Building', 'Hadir', NULL),
('2026-11-03', 'Supardi', 'Mandor Pembesian', 'Hadir', NULL),
('2026-11-03', 'Joko Susilo', 'Operator Tower Crane', 'Hadir', NULL),
('2026-11-03', 'Wahyu Pratama', 'Teknisi MEP', 'Izin', NULL);

-- Data Awal: Quality Control & Inspeksi Mutu
INSERT INTO `quality_control` (`item_pekerjaan`, `kategori`, `metode_uji`, `standar_acuan`, `tanggal_inspeksi`, `pic`, `urgensi`, `status`, `deskripsi`, `foto_inspeksi`) VALUES
('Pengecoran Beton Ready Mix Kolom Lantai 2 (Zona A)', 'Struktur & Pembesian', 'Uji Slump (12±2 cm) & Uji Kuat Tekan Silinder fc\' 30 MPa', 'SNI 2847:2019 / ASTM C39', '2026-11-03', 'Ir. Reza Fahmi (QC Eng.)', 'Critical', 'Lolos QC / Approved', 'Nilai slump rata-rata 11.5 cm memenuhi toleransi. Benda uji silinder 6 sampel disiapkan untuk uji tekan 7, 14, dan 28 hari.', NULL),
('Pemasangan Tulangan Kolom & Selimut Beton (Rebar Spacing)', 'Struktur & Pembesian', 'Pemeriksaan Diameter, Jumlah Bar, Overlap Splice & Beton Decking', 'Gambar DED & SNI 2052:2017', '2026-11-04', 'Supardi (Site Inspector)', 'High', 'Perlu Perbaikan / Punch List', 'Ditemukan 3 titik decking beton pecah pada sisi timur kolom K-04 sehingga jarak selimut beton kurang dari 40 mm. Wajib dipasang kembali sebelum pouring beton.', NULL),
('Pipa Distribusi Air Bersih & Rainwater Harvesting', 'MEP & Plumbing', 'Hydrostatic Pressure Test (Tekanan Uji 10 Bar selama 2 Jam)', 'SNI 03-6481-2000 Sistem Plambing', '2026-11-05', 'Dedi Suwandi (MEP Inspector)', 'Medium', 'Lolos QC / Approved', 'Tekanan konstan 10 bar selama 2 jam tanpa ada penurunan jarum manometer. Tidak ada rembesan pada sambungan socket pipa HDPE.', NULL),
('Ketegakan & Plesteran Dinding Bata Ringan Koridor Lt. 1', 'Arsitektur & Façade', 'Uji Ketegakan Plumb Bob & Waterpass 2 Meter', 'Toleransi Deviasi Maks 3mm per 2 Meter', '2026-11-06', 'Budi Santoso (Site Engineer)', 'Low', 'Perlu Perbaikan / Punch List', 'Ditemukan deviasi ketegakan 5mm pada sudut barat dinding koridor. Perlu perataan dan acian ulang sebelum pengecatan primer.', NULL);

-- Data Awal: Aduan Pemeliharaan Owner (Legacy)
INSERT INTO `maintenance` (`nama_komponen`, `kategori`, `jenis_maintenance`, `tanggal_jadwal`, `biaya`, `pic`, `status`, `nama_owner`, `deskripsi`, `urgensi`, `foto_kerusakan`) VALUES
('Sistem Infiltrasi Rainwater Harvesting', 'Sanitasi & Plumbing', 'Corrective', '2026-11-15', 4500000.00, 'Ir. Reza Fahmi', 'Dalam Proses', 'PT. Investama Hijau Lestari', 'Debit resapan air hujan mengalami perlambatan akibat endapan sedimentasi pasir pasca hujan deras.', 'High', NULL),
('Sensor Smart Lighting Koridor Lantai 2', 'MEP & Listrik', 'Preventive', '2026-11-18', 1200000.00, 'Dedi Suwandi', 'Pending', 'Bpk. Hendrawan (Tenant Direksi)', 'Kalibrasi rutin foton dan motion sensor efisiensi energi penerangan.', 'Low', NULL),
('Lapisan Cat Exterior Weathercoat Sisi Barat', 'Arsitektur & Façade', 'Emergency', '2026-11-12', 7800000.00, 'Supardi', 'Pending', 'PT. Graha Hijau Nusantara', 'Terdapat retak rambut dan rembesan air pada façade akibat cuaca ekstrem.', 'Critical', NULL);

-- Data Awal: Analisis Risiko Proyek
INSERT INTO `risks` (`nama_risiko`, `kategori`, `probability`, `impact`, `score`, `level`, `mitigasi`, `status`, `pekerjaan_id`) VALUES
('Keterlambatan Pasokan Beton Readymix Rendah Karbon', 'Material & Waktu', 4, 3, 12, 'High', 'Melakukan dual-sourcing batching plant bersertifikat ramah lingkungan terdekat.', 'Open', 2),
('Curah Hujan Ekstrem Mengganggu Pengecoran Kolom', 'Faktor Cuaca / Alam', 3, 4, 12, 'High', 'Penyediaan tenda pelindung struktur dan pompa dewatering cadangan.', 'Open', 2),
('Keterlambatan Fabrikasi Sambungan Struktur Baja Daur Ulang', 'Mutu & Jadwal', 5, 4, 20, 'Critical', 'Inspeksi berkala ke workshop vendor dan penambahan shift perakitan erection.', 'Open', 3);

-- Data Awal: Manajemen & Analisis Limbah Konstruksi
INSERT INTO `waste_management` (`tanggal`, `nama_limbah`, `kategori`, `volume`, `satuan`, `metode_pengelolaan`, `vendor_pengolah`, `status`, `keterangan`, `bukti_manifest`) VALUES
('2026-11-02', 'Limbah Oli Bekas Alat Berat & Excavator', 'Limbah B3', 120.00, 'Liter', 'Diserahkan ke Pihak ke-3 Berizin', 'PT. Wastec International B3', 'Selesai Terangkut / Didaur Ulang', 'Penyerahan limbah oli hidrolik drum berizin B3 lengkap dengan berita acara manifest.', NULL),
('2026-11-03', 'Sisa Potongan Besi Beton Tulangan (Scrap Rebar)', 'Limbah Padat Daur Ulang', 450.00, 'Kg', 'Recycle', 'PT. Baja Daur Ulang Mandiri', 'Selesai Terangkut / Didaur Ulang', 'Dijual ke peleburan baja berlisensi daur ulang untuk diolah kembali.', NULL),
('2026-11-04', 'Puing Beton & Mortar Demolisi Bangunan Lama', 'Limbah Non-B3 / Demolisi', 12.50, 'Ton', 'Reuse', 'Internal Proyek', 'Selesai Terangkut / Didaur Ulang', 'Dihancurkan (crushed) untuk material urugan lapis pondasi jalan kerja sementara.', NULL),
('2026-11-05', 'Kemasan Kaleng Cat Kimia & Thinner Low-VOC', 'Limbah B3', 35.00, 'Kg', 'Penampungan TPS Sementara', 'TPS B3 Proyek', 'Tersimpan di TPS', 'Disimpan di TPS B3 berizin beratap dan berpalet kedap air.', NULL),
('2026-11-06', 'Potongan Kayu Bekisting Rusak', 'Limbah Padat Daur Ulang', 280.00, 'Kg', 'Reuse', 'Pengrajin Palet Lokal', 'Tersimpan di TPS', 'Dipilah untuk pembuatan patok ukur bowplank dan diserahkan ke pengrajin.', NULL);

-- ==============================================================================
-- 10. TABEL: users (Akun Autentikasi & Hak Akses Pekerja / RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'viewer',
    `jabatan` VARCHAR(150) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_email` (`email`),
    INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Awal: Akun Pekerja Terdaftar Default (Password: password123)
INSERT INTO `users` (`email`, `password`, `name`, `role`, `jabatan`) VALUES
('admin@proyek.com', 'password123', 'Ir. Hendra Gunawan', 'admin', 'Project Manager'),
('material@proyek.com', 'password123', 'Bambang Subagyo', 'material', 'Petugas Gudang & Material'),
('planner@proyek.com', 'password123', 'Dian Paramitha, S.T.', 'planner', 'Site Engineer & Planner'),
('mandor@proyek.com', 'password123', 'Pak Trisno (Mandor)', 'mandor', 'Mandor Utama'),
('qc@proyek.com', 'password123', 'Ir. Reza Fahmi', 'qc', 'Quality Control Engineer'),
('risk@proyek.com', 'password123', 'Siti Aminah, S.K.M.', 'risk', 'Petugas HSE & K3'),
('waste@proyek.com', 'password123', 'Agus Purnomo', 'waste', 'Petugas Lingkungan & Limbah'),
('alat@proyek.com', 'password123', 'Rahmat Hidayat', 'logistics', 'Koordinator Alat Berat'),
('pekerja@proyek.com', 'password123', 'Wahyu Ramadhan', 'viewer', 'Pekerja Lapangan (Tamu)');
