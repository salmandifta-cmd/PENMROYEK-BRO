# PENMROYEK
> **Pengendalian dan Monitoring Proyek Konstruksi (Civil Engineering Systems & Project Control)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)](https://getbootstrap.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-orange.svg)](https://www.chartjs.org/)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success.svg)]()

Aplikasi web modern untuk manajemen, pengendalian mutu, dan pemantauan proyek konstruksi terpadu berbasis prinsip **Project Control**, **Earned Value Management (EVM)**, **SNI / AHSP Kebutuhan Tenaga Kerja**, **Quality Control (QC) Mutu**, **ISO 31000 Risk Management**, **Green Construction Waste Diversion**, dan **Logistik JIT Alat Berat**.

---

## 🌐 Cara Akses & Publikasi di GitHub Pages (Langsung Online Gratis)

Aplikasi ini dapat langsung dipublikasikan dan diakses secara daring gratis melalui **GitHub Pages**:

1. Buat repository baru di [GitHub](https://github.com/new) dengan nama `PENMROYEK`.
2. Unggah file-file proyek ini ke repository.
3. Buka menu **Settings** &rarr; **Pages** di repository Anda.
4. Pada bagian **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** (atau **master**) / folder **/(root)**
   - Klik **Save**.
5. Tunggu 1–2 menit, website PENMROYEK akan aktif dan dapat diakses publik melalui:
   `https://<username-anda>.github.io/PENMROYEK/`

---

## 🛠️ Stack Teknologi

- **Frontend**: HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, Vanilla JavaScript (DOM & Fetch API), Chart.js 4.4
- **Backend**: Node.js, Express.js, Multer (File & Image Upload Handler), fast-xml-parser (dengan Regex fallback parser)
- **Database**: MySQL 5.7+ / 8.0+ / MariaDB 10.3+ (Driver: `mysql2/promise`)

---

## 📁 Struktur Direktori

```text
gravity/
├── package.json              # Konfigurasi dependensi Node.js
├── .env.example              # Template konfigurasi environment (Port, MySQL DB)
├── schema.sql                # DDL skema database MySQL lengkap + Data Seed
├── server.js                 # Backend REST API Server & Risk Impact Engine
├── sample_project.xml        # Contoh file ekspor MS Project XML siap uji
├── index.html                # Frontend UI Responsif (Bootstrap 5)
├── app.js                    # Controller Logika Frontend (Fetch API & Chart.js)
├── style.css                 # Custom Styling Tema Eco-Engineering & Matriks Risiko
├── uploads/                  # Direktori penyimpanan upload foto & file
└── public/                   # Asset statis publik mirror
```

---

## ⚡ Panduan Instalasi & Menjalankan Aplikasi

### 1. Persiapan Database MySQL
1. Buka MySQL Client / phpMyAdmin / DBeaver / Navicat / Terminal MySQL:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Atau salin seluruh isi file [`schema.sql`](file:///schema.sql) dan jalankan pada query editor SQL Anda.
3. Database `green_construction` beserta 6 tabel (`attendance`, `materials`, `schedules`, `scurve_plan`, `maintenance`, `risks`) dan sample data akan otomatis terbuat.

### 2. Instalasi Dependensi Node.js
Pastikan Node.js dan npm telah terpasang di komputer Anda, lalu jalankan:
```bash
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Salin `.env.example` menjadi `.env` jika kredensial MySQL Anda berbeda:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=green_construction
DB_PORT=3306
```

### 4. Menjalankan Server
```bash
npm start
```
Buka browser dan akses: **`http://localhost:3000`**

---

## 🚀 Fitur Utama & Cara Kerja Sistem

### 1. 📦 Kontrol Material & Batas Ambang Kritis
- Menghitung mutasi stok secara otomatis: `sisa_stok = stok_masuk - stok_keluar`.
- Dilengkapi sistem peringatan dini **REORDER SEGERA** (pulsing badge) jika `sisa_stok <= min_stok`.
- Mendukung tambah, edit, dan hapus material.

### 2. 📊 Progres Jadwal & Kurva S (MS Project XML Parser)
- **Chart.js Kurva S Dinamis**: Membandingkan kurva S Rencana vs Realisasi.
- **Upload MS Project (.xml)**: Mampu mengekstrak hierarki pekerjaan WBS, tanggal mulai, tanggal selesai, durasi, bobot otomatis, serta merekonstruksi kurva S mingguan. Tersedia file [`sample_project.xml`](file:///sample_project.xml) untuk pengujian instan.
- **WBS Tracking**: Menampilkan target jadwal, durasi, progres, status, serta indikator keterlambatan (`+X Hari Delay`).

### 3. 👷 Analisis Kebutuhan Tenaga Kerja (Labor Requirements Calculator)
- Menghitung kebutuhan alokasi tenaga kerja di lapangan per hari (Pekerja & Tukang) berdasarkan Koefisien AHSP/SNI, Volume Pekerjaan, dan Target Hari Selesai.
- Dilengkapi template preset AHSP (Pengecoran beton, pembesian, pasangan bata ringan, plesteran, galian tanah, MEP/solar rooftop, pengecatan).
- Kalkulator *live real-time preview* yang menghitung Total Orang-Hari (OH / Man-Days) serta rasio komposisi regu kerja secara otomatis.
- Fitur sinkronisasi langsung dengan paket pekerjaan WBS dan ekspor/cetak laporan kebutuhan tenaga kerja.

### 4. 🔍 Quality Control (QC) & Kendali Mutu Lapangan
- Pengelolaan inspeksi mutu konstruksi, checklist parameter pengujian (Slump test, uji kuat tekan silinder beton, uji tarik tulangan, hydrostatic test pipa, uji ketegakan & leveling).
- Standar acuan toleransi mutu (SNI, ASTM, RKS Spesifikasi Teknis).
- Pengawasan tingkat keparahan (*Minor, Moderate, Major, Critical*) dan status hasil QC (*Lolos QC / Approved, Perlu Perbaikan / Punch List, Ditolak / Rejected, Menunggu Uji Lab*).
- Unggah bukti foto temuan cacat atau sertifikat pengujian lab serta ekspor laporan rekapitulasi QC.

### 5. 🛡️ Analisis Limbah & Risiko (Risk Impact Engine)
- **Matriks Risiko 5x5 Interaktif**: Grid probabilitas (1-5) &times; dampak (1-5) dengan heatmap warna (Low: Hijau, Medium: Kuning, High: Oranye, Critical: Merah).
- **Civil Engineering Risk Impact Engine**:
  - Ketika risiko baru diinput dengan taraf **Critical (Skor &ge; 20)**, backend secara otomatis:
    - Menambah durasi jadwal WBS terkait **+7 Hari** (`end_date = DATE_ADD(end_date, INTERVAL 7 DAY)`).
    - Menyesuaikan penurunan progres (`actual_progress`).
    - Merender ulang distribusi Kurva S Realisasi (slippage delay).
  - Ketika risiko bertaraf **High (Skor &ge; 12)**:
    - Menambah durasi jadwal WBS terkait **+3 Hari**.
    - Menyesuaikan penurunan progres dan merender ulang Kurva S Realisasi.
- **Kesimpulan Status Risiko Proyek**: Menyajikan status kesehatan proyek (*Normal*, *Waspada*, *Kritis*) dan akumulasi hari keterlambatan total.

### 6. 🔐 Sistem Autentikasi & Hak Akses Pekerja (Role-Based Access Control / RBAC)
- **Sign In dengan Email & Password**: Setiap pekerja masuk dengan akun resmi mereka. Tersedia juga fitur pendaftaran pekerja baru dan switch role 1-klik untuk pengujian.
- **Prinsip Hak Akses**: Setiap fitur hanya dapat diakses (ditambah, diedit, dihapus) oleh pekerja yang bersangkutan sesuai bidang tugasnya. Pekerja lain yang tidak bersangkutan **hanya dapat melihat (Read-Only)** seluruh data, grafik, dan statistik tanpa hak modifikasi.
- **Daftar Akun Pekerja Bawaan (Password default: `password123`)**:
  - `admin@proyek.com` &rarr; **Project Manager / Admin**: Akses penuh (7 modul).
  - `material@proyek.com` &rarr; **Petugas Gudang & Material**: Khusus Kontrol Material.
  - `planner@proyek.com` &rarr; **Site Engineer & Planner**: Khusus Jadwal WBS & Kurva S.
  - `mandor@proyek.com` &rarr; **Mandor Utama / Pelaksana**: Khusus Kebutuhan Tenaga Kerja.
  - `qc@proyek.com` &rarr; **Quality Control Inspector**: Khusus Kendali Mutu & Punch List.
  - `risk@proyek.com` &rarr; **Petugas HSE & K3**: Khusus Analisis Risiko ISO 31000.
  - `waste@proyek.com` &rarr; **Petugas Lingkungan & Limbah**: Khusus Neraca Limbah.
  - `alat@proyek.com` &rarr; **Koordinator Alat Berat & Logistik**: Khusus Logistik JIT & Armada.
  - `pekerja@proyek.com` &rarr; **Pekerja Lapangan / Tamu**: Mode Hanya Lihat (*Read-Only*) seluruh modul.
