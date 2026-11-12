#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script untuk membuat:
1. MODUL_PANDUAN_PENGENDALIAN_PROYEK.docx (Microsoft Word Document)
2. MODUL_PANDUAN_PENGENDALIAN_PROYEK.pdf  (PDF Dokumen Panduan)
3. MODUL_PANDUAN_PENGENDALIAN_PROYEK.html (Versi Web Siap Cetak / Print-Ready)
"""

import os
import zipfile
import html
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.patches as patches

# ==============================================================================
# 1. GENERATOR MICROSOFT WORD (.DOCX)
# ==============================================================================

class DocxBuilder:
    def __init__(self):
        self.body_xml = []

    def escape(self, text):
        return html.escape(str(text))

    def add_title(self, text, subtitle=None):
        self.body_xml.append(f"""
        <w:p>
            <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:before="600" w:after="200"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="52"/>
                    <w:szCs w:val="52"/>
                    <w:color w:val="0F172A"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
            </w:r>
        </w:p>
        """)
        if subtitle:
            self.body_xml.append(f"""
            <w:p>
                <w:pPr>
                    <w:jc w:val="center"/>
                    <w:spacing w:before="0" w:after="500"/>
                </w:pPr>
                <w:r>
                    <w:rPr>
                        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                        <w:i/>
                        <w:sz w:val="26"/>
                        <w:szCs w:val="26"/>
                        <w:color w:val="475569"/>
                    </w:rPr>
                    <w:t>{self.escape(subtitle)}</w:t>
                </w:r>
            </w:p>
            """)

    def add_h1(self, text):
        self.body_xml.append(f"""
        <w:p>
            <w:pPr>
                <w:pStyle w:val="Heading1"/>
                <w:spacing w:before="400" w:after="160"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="32"/>
                    <w:szCs w:val="32"/>
                    <w:color w:val="0F172A"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
            </w:r>
        </w:p>
        """)

    def add_h2(self, text):
        self.body_xml.append(f"""
        <w:p>
            <w:pPr>
                <w:pStyle w:val="Heading2"/>
                <w:spacing w:before="260" w:after="120"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="26"/>
                    <w:szCs w:val="26"/>
                    <w:color w:val="1E40AF"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
            </w:r>
        </w:p>
        """)

    def add_h3(self, text):
        self.body_xml.append(f"""
        <w:p>
            <w:pPr>
                <w:pStyle w:val="Heading3"/>
                <w:spacing w:before="180" w:after="80"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="22"/>
                    <w:szCs w:val="22"/>
                    <w:color w:val="0369A1"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
            </w:r>
        </w:p>
        """)

    def add_paragraph(self, text, bold=False, italic=False, color="334155", align="both"):
        jc_val = "both" if align == "both" else ("center" if align == "center" else "left")
        b_tag = "<w:b/>" if bold else ""
        i_tag = "<w:i/>" if italic else ""
        self.body_xml.append(f"""
        <w:p>
            <w:pPr>
                <w:jc w:val="{jc_val}"/>
                <w:spacing w:line="276" w:lineRule="auto" w:after="140"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    {b_tag}
                    {i_tag}
                    <w:sz w:val="22"/>
                    <w:szCs w:val="22"/>
                    <w:color w:val="{color}"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
            </w:r>
        </w:p>
        """)

    def add_bullet(self, bold_prefix, text):
        self.body_xml.append(f"""
        <w:p>
            <w:pPr>
                <w:ind w:left="400" w:hanging="240"/>
                <w:spacing w:line="260" w:lineRule="auto" w:after="80"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:color w:val="1E40AF"/>
                </w:rPr>
                <w:t>• </w:t>
            </w:r>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:color w:val="0F172A"/>
                </w:rPr>
                <w:t>{self.escape(bold_prefix)}: </w:t>
            </w:r>
            <w:r>
                <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:color w:val="334155"/>
                </w:rPr>
                <w:t>{self.escape(text)}</w:t>
            </w:r>
        </w:p>
        """)

    def add_callout(self, title, text, border_color="2563EB", bg_color="F8FAFC"):
        self.body_xml.append(f"""
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="9360" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="none"/>
                    <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>
                    <w:bottom w:val="none"/>
                    <w:right w:val="none"/>
                </w:tblBorders>
                <w:tblCellMar>
                    <w:top w:w="160" w:type="dxa"/>
                    <w:left w:w="240" w:type="dxa"/>
                    <w:bottom w:w="160" w:type="dxa"/>
                    <w:right w:w="200" w:type="dxa"/>
                </w:tblCellMar>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="9360" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="{bg_color}"/>
                    </w:tcPr>
                    <w:p>
                        <w:pPr><w:spacing w:after="60"/></w:pPr>
                        <w:r>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:b/>
                                <w:color w:val="{border_color}"/>
                            </w:rPr>
                            <w:t>{self.escape(title)}</w:t>
                        </w:r>
                    </w:p>
                    <w:p>
                        <w:pPr><w:spacing w:after="40"/></w:pPr>
                        <w:r>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:color w:val="334155"/>
                            </w:rPr>
                            <w:t>{self.escape(text)}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>
            </w:tr>
        </w:tbl>
        <w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>
        """)

    def add_table(self, headers, rows, col_widths=None):
        total_width = 9360
        num_cols = len(headers)
        if not col_widths:
            col_widths = [int(total_width / num_cols)] * num_cols

        tbl_xml = [f"""
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="{total_width}" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
                    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
                </w:tblBorders>
                <w:tblCellMar>
                    <w:top w:w="120" w:type="dxa"/>
                    <w:left w:w="160" w:type="dxa"/>
                    <w:bottom w:w="120" w:type="dxa"/>
                    <w:right w:w="160" w:type="dxa"/>
                </w:tblCellMar>
            </w:tblPr>
        """]

        # Header Row
        tbl_xml.append("<w:tr><w:trPr><w:tblHeader/></w:trPr>")
        for i, h in enumerate(headers):
            w = col_widths[i]
            tbl_xml.append(f"""
            <w:tc>
                <w:tcPr>
                    <w:tcW w:w="{w}" w:type="dxa"/>
                    <w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/>
                </w:tcPr>
                <w:p>
                    <w:pPr>
                        <w:spacing w:after="40" w:before="40"/>
                        <w:jc w:val="center"/>
                    </w:pPr>
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                            <w:b/>
                            <w:sz w:val="20"/>
                            <w:szCs w:val="20"/>
                            <w:color w:val="FFFFFF"/>
                        </w:rPr>
                        <w:t>{self.escape(h)}</w:t>
                    </w:r>
                </w:p>
            </w:tc>
            """)
        tbl_xml.append("</w:tr>")

        # Data Rows
        for r_idx, row in enumerate(rows):
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            tbl_xml.append("<w:tr>")
            for i, val in enumerate(row):
                w = col_widths[i]
                align = "center" if i == 0 or i == len(row) - 1 else "left"
                tbl_xml.append(f"""
                <w:tc>
                    <w:tcPr>
                        <w:tcW w:w="{w}" w:type="dxa"/>
                        <w:shd w:val="clear" w:color="auto" w:fill="{bg}"/>
                    </w:tcPr>
                    <w:p>
                        <w:pPr>
                            <w:spacing w:after="40" w:before="40"/>
                            <w:jc w:val="{align}"/>
                        </w:pPr>
                        <w:r>
                            <w:rPr>
                                <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                                <w:sz w:val="20"/>
                                <w:szCs w:val="20"/>
                                <w:color w:val="1E293B"/>
                            </w:rPr>
                            <w:t>{self.escape(val)}</w:t>
                        </w:r>
                    </w:p>
                </w:tc>
                """)
            tbl_xml.append("</w:tr>")

        tbl_xml.append('</w:tbl><w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>')
        self.body_xml.append("".join(tbl_xml))

    def add_page_break(self):
        self.body_xml.append("""
        <w:p>
            <w:r>
                <w:br w:type="page"/>
            </w:r>
        </w:p>
        """)

    def save(self, output_path):
        content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

        rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

        doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

        styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="334155"/>
        <w:lang w:val="id-ID"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:after="140"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="360" w:after="160"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="0F172A"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="1E40AF"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="0369A1"/></w:rPr>
  </w:style>
</w:styles>"""

        document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(self.body_xml)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""

        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('[Content_Types].xml', content_types)
            zf.writestr('_rels/.rels', rels)
            zf.writestr('word/_rels/document.xml.rels', doc_rels)
            zf.writestr('word/styles.xml', styles)
            zf.writestr('word/document.xml', document)


# ==============================================================================
# 2. BUILD KONTEN LENGKAP PANDUAN PENGENDALIAN PROYEK
# ==============================================================================

def generate_full_docx(filename):
    doc = DocxBuilder()

    # COVER PAGE
    doc.add_title(
        "MODUL PANDUAN PENGGUNAAN & TUJUAN OUTPUT SISTEM",
        "Aplikasi Terpadu 'PENGENDALIAN PROYEK' (Civil Engineering Project Control & Quality System)"
    )
    doc.add_callout(
        "INFORMASI DOKUMEN & SPESIFIKASI SISTEM",
        "Versi Aplikasi: 2.5 Enterprise Edition | Tanggal Terbit: November 2026\n"
        "Klasifikasi: Panduan Operasional & Teknis Pengendalian Proyek Konstruksi\n"
        "Standar Acuan: SNI Tata Cara Perhitungan Kebutuhan Tenaga Kerja PUPR, Earned Value Management (EVM), "
        "ISO 31000 Risk Management, ISO 14001 Waste Diversion, dan SNI/ASTM Kendali Mutu.",
        border_color="0F172A", bg_color="F1F5F9"
    )
    doc.add_page_break()

    # BAB I
    doc.add_h1("BAB I: PENDAHULUAN & TUJUAN APLIKASI")
    doc.add_h2("1.1 Latar Belakang & Filosofi Aplikasi")
    doc.add_paragraph(
        "Dalam industri konstruksi modern, kegagalan proyek sebagian besar bersumber dari kurangnya integrasi antara "
        "perencanaan waktu (schedule), logistik pengadaan material, ketersediaan tenaga kerja di lapangan, kendali mutu (quality control), "
        "dan mitigasi risiko teknis. Aplikasi 'PENGENDALIAN PROYEK' dibangun sebagai platform sistem terpadu yang memadukan "
        "prinsip Civil Engineering Systems, Earned Value Management (EVM), dan Standar Nasional Indonesia (SNI) ke dalam satu dashboard dinamis."
    )

    doc.add_h2("1.2 Tujuan Utama Aplikasi")
    doc.add_paragraph(
        "Aplikasi ini dikembangkan dengan tujuan-tujuan strategis sebagai berikut:"
    )
    doc.add_bullet("Pengendalian Jadwal & Deteksi Keterlambatan Dini", 
                   "Memodelkan Kurva S Rencana vs Realisasi Lapangan secara matematis dan real-time, mendeteksi deviasi fisik lapangan terhadap jadwal baseline.")
    doc.add_bullet("Civil Engineering Risk Impact Engine", 
                   "Mengintegrasikan risiko berperingkat tinggi secara otomatis terhadap durasi WBS (+7 Hari untuk risiko Critical dan +3 Hari untuk High), sehingga proyeksi slippage Kurva S langsung terdistorsi secara realistis.")
    doc.add_bullet("Akurasi Perencanaan Kebutuhan Tenaga Kerja", 
                   "Menggantikan pencatatan absensi pasif dengan kalkulator kebutuhan tenaga kerja berbasis koefisien AHSP SNI PUPR, volume pekerjaan, dan target hari selesai guna mencegah pembengkakan biaya tenaga kerja (overstaffing) maupun kekurangan tenaga kerja (understaffing).")
    doc.add_bullet("Zero-Defect Quality Control (QC)", 
                   "Mengendalikan pengujian mutu konstruksi (slump test, silinder beton, uji tarik baja, hydrostatic test) dan mengelola daftar cacat perbaikan (punch list) secara terstruktur sebelum serah terima pekerjaan.")
    doc.add_bullet("Manajemen Logistik Material Ramah Lingkungan & Alat Berat", 
                   "Memantau persediaan material bersertifikat hijau, ambang batas minimum pemesanan ulang (reorder), jadwal kedatangan armada Just-In-Time (JIT), serta verifikasi masa berlaku izin kelaikan K3 SIA/SILO alat berat.")
    doc.add_bullet("Kepatuhan Lingkungan & Neraca Limbah Konstruksi (ISO 14001)", 
                   "Mencatat timbulan limbah proyek, manifest serah-terima B3, dan mengukur rasio daur ulang (waste diversion rate).")

    doc.add_h2("1.3 Arsitektur Sistem & Ketahanan Eksekusi")
    doc.add_paragraph(
        "Aplikasi didesain menggunakan arsitektur hybrid modern dengan 2 mode operasional:"
    )
    doc.add_bullet("100% Client-Side Offline Engine (LocalStorage Persistent)", 
                   "Aplikasi dapat berjalan mandiri di browser tanpa server atau database luar (siap di-deploy ke Netlify/GitHub Pages). Seluruh data proyek tersimpan aman di peramban lokal pengguna.")
    doc.add_bullet("Full-Stack Enterprise Server (Node.js Express + MySQL)", 
                   "Disediakan backend REST API server terintegrasi dengan upload handler bukti foto/surat jalan dan database relasional multi-user MySQL.")

    doc.add_page_break()

    # BAB II
    doc.add_h1("BAB II: SISTEM AUTENTIKASI & HAK AKSES PEKERJA (RBAC)")
    doc.add_h2("2.1 Prinsip Pembatasan Hak Akses")
    doc.add_callout(
        "ATURAN UTAMA HAK AKSES PEKERJA",
        "Setiap fitur dan modul hanya dapat diedit, ditambah, dan dimodifikasi oleh pekerja yang bersangkutan sesuai bidang wewenang tugasnya. "
        "Pekerja lain yang tidak bersangkutan tetap dapat membuka modul tersebut namun secara otomatis dikunci ke dalam Mode Hanya Lihat (Read-Only) "
        "tanpa izin merusak atau mengubah data.",
        border_color="DC2626", bg_color="FEF2F2"
    )

    doc.add_h2("2.2 Matriks Hak Akses & Akun Pekerja Terdaftar")
    doc.add_paragraph(
        "Sistem dilengkapi dengan 9 akun pekerja bawaan untuk membedakan hak akses secara presisi (Password default: password123):"
    )

    rbac_headers = ["Email Akun", "Nama Pekerja", "Peran (Role)", "Wewenang Edit (Hak Tulis)", "Fitur Lainnya"]
    rbac_rows = [
        ["admin@proyek.com", "Ir. Hendra Gunawan", "Project Manager", "Akses Penuh (7 Modul)", "Semua Modul"],
        ["material@proyek.com", "Bambang Subagyo", "Logistik Material", "📦 Kontrol Material", "Mode Hanya Lihat"],
        ["planner@proyek.com", "Dian Paramitha, S.T.", "Planner / Scheduler", "📊 Jadwal & Kurva S", "Mode Hanya Lihat"],
        ["mandor@proyek.com", "Pak Trisno (Mandor)", "Mandor Utama", "👷 Kebutuhan Tenaga Kerja", "Mode Hanya Lihat"],
        ["qc@proyek.com", "Ir. Reza Fahmi", "QC Inspector", "🔍 Quality Control (QC)", "Mode Hanya Lihat"],
        ["risk@proyek.com", "Siti Aminah, S.K.M.", "HSE & Risk Officer", "🛡️ Analisis Risiko Proyek", "Mode Hanya Lihat"],
        ["waste@proyek.com", "Agus Purnomo", "Petugas Limbah", "♻️ Manajemen Limbah", "Mode Hanya Lihat"],
        ["alat@proyek.com", "Rahmat Hidayat", "Koordinator Alat", "🚜 Logistik & Alat Berat", "Mode Hanya Lihat"],
        ["pekerja@proyek.com", "Wahyu Ramadhan", "Pekerja Lapangan", "Tidak Ada Hak Tulis", "Semua Modul Hanya Lihat"]
    ]
    doc.add_table(rbac_headers, rbac_rows, [2200, 2000, 1800, 1900, 1460])

    doc.add_h2("2.3 Prosedur Masuk (Sign In) & Ganti Peran (Role Switcher)")
    doc.add_bullet("Masuk dengan Email & Password", 
                   "Klik tombol profil pekerja pada bilah navigasi kanan atas, pilih menu 'Login Akun Lain', masukkan alamat email pekerja serta password, lalu klik 'Masuk Sekarang'.")
    doc.add_bullet("Ganti Pekerja Cepat (1-Klik Demo)", 
                   "Buka modal autentikasi, klik tab 'Pilih Pekerja (1-Klik)', lalu pilih salah satu kartu profil pekerja untuk beralih identitas secara instan tanpa perlu mengetik ulang.")
    doc.add_bullet("Daftar Pekerja Baru", 
                   "Pilih tab 'Daftar Pekerja Baru', lengkapi Nama Lengkap, Email, Password, serta pilih Wewenang Akses Modul yang dikehendaki.")

    doc.add_h2("2.4 Ciri-Ciri Mode Hanya Lihat (Read-Only) pada Tampilan")
    doc.add_paragraph(
        "Ketika pengguna sedang membuka modul yang bukan wewenangnya, sistem secara otomatis mengaktifkan pengamanan antarmuka:"
    )
    doc.add_bullet("Banner Peringatan Kuning/Abu-abu", 
                   "Muncul di bagian paling atas modul yang menerangkan: 'Mode Hanya Lihat (Read-Only) - Anda masuk sebagai [Nama] ([Peran]). Hak akses tulis dibatasi untuk modul ini.'")
    doc.add_bullet("Formulir & Tombol Input Terkunci", 
                   "Semua input text, angka, dropdown pilihan, dan tombol simpan dinonaktifkan (disabled = true).")
    doc.add_bullet("Lencana Gembok pada Tabel", 
                   "Tombol aksi 'Edit' dan 'Hapus' pada tabel digantikan oleh lencana gembok abu-abu bertuliskan 'Hanya Lihat', dan dropdown status berubah menjadi teks statis.")

    doc.add_page_break()

    # BAB III
    doc.add_h1("BAB III: PANDUAN PENGGUNAAN SETIAP MODUL")

    doc.add_h2("3.1 Dashboard Ringkasan Eksekutif KPI Proyek")
    doc.add_paragraph(
        "Di bagian atas halaman utama, tersedia 5 kartu indikator kinerja utama (KPI) yang diperbarui secara otomatis setiap kali ada perubahan data:"
    )
    doc.add_bullet("Rata-rata Progres Proyek", "Persentase kumulatif penyelesaian fisik seluruh paket pekerjaan WBS.")
    doc.add_bullet("Material Kritis (Low Stock)", "Jumlah item material yang stok tersisanya berada di bawah batas ambang minimum reorder.")
    doc.add_bullet("Kebutuhan Tenaga Kerja", "Total tenaga kerja per hari yang dibutuhkan di lapangan (Tukang + Pekerja) hasil analisis AHSP.")
    doc.add_bullet("Temuan QC / Punch List", "Jumlah catatan inspeksi mutu yang masih membutuhkan perbaikan (rework) di lapangan.")
    doc.add_bullet("Risiko Kritis", "Jumlah risiko proyek aktif bertaraf Critical (Skor 20-25) yang berpotensi memicu keterlambatan besar.")

    doc.add_h2("3.2 Modul 1: Kontrol Material & Logistik Hijau")
    doc.add_paragraph(
        "Dikelola oleh Petugas Gudang & Material (material@proyek.com). Berfungsi mengontrol persediaan material konstruksi ramah lingkungan."
    )
    doc.add_bullet("Langkah Menambah Material", 
                   "Klik tombol hijau '+ Tambah Material Baru'. Isi Nama Material, Satuan (Sak, Batang, M2, dll.), Stok Masuk Awal, Stok Keluar, dan Ambang Batas Minimum Reorder. Klik 'Simpan Material'.")
    doc.add_bullet("Perhitungan Otomatis Stok", 
                   "Sistem menghitung otomatis rumus: Sisa Stok = Stok Masuk - Stok Keluar.")
    doc.add_bullet("Peringatan Reorder Segera", 
                   "Jika Sisa Stok <= Min Stok, tabel menampilkan lencana merah berkedip 'REORDER SEGERA' dan KPI Material Kritis bertambah secara otomatis.")

    doc.add_h2("3.3 Modul 2: Progres Jadwal & Kurva S Dinamis")
    doc.add_paragraph(
        "Dikelola oleh Site Engineer & Planner (planner@proyek.com). Menyajikan visualisasi Kurva S Rencana vs Realisasi dan Work Breakdown Structure (WBS)."
    )
    doc.add_bullet("Import Jadwal MS Project (.mpp / .xml / .xlsx)", 
                   "Pilih file ekspor Microsoft Project dalam format XML atau CSV/XLSX pada panel impor, lalu klik 'Unggah & Kalkulasi Kurva S'. Sistem mengekstrak nama task, tanggal mulai, tanggal selesai, menghitung durasi hari, dan merekonstruksi kurva S mingguan.")
    doc.add_bullet("Menggunakan Template Proyek Demo", 
                   "Klik tombol 'Muat Template Proyek' untuk langsung memuat contoh 6 paket pekerjaan struktur green building.")
    doc.add_bullet("Input Progres Realisasi Lapangan", 
                   "Pada tabel WBS, klik tombol 'Update Progres'. Geser slider persentase fisik yang dicapai di lapangan (0-100%). Kurva S Realisasi otomatis dirender ulang dan deviasi keterlambatan dihitung seketika.")

    doc.add_h2("3.4 Modul 3: Analisis Kebutuhan Tenaga Kerja (Labor Requirements)")
    doc.add_paragraph(
        "Dikelola oleh Mandor Utama / Supervisor Lapangan (mandor@proyek.com). Menggantikan pencatatan absensi pasif dengan kalkulator kebutuhan pekerja berbasis SNI/AHSP."
    )
    doc.add_callout(
        "FORMULA PERHITUNGAN KEBUTUHAN TENAGA KERJA (STANDAR SNI PUPR)",
        "1. Total Beban Kerja Pekerja (OH) = Volume Pekerjaan × Koefisien Pekerja\n"
        "2. Total Beban Kerja Tukang (OH) = Volume Pekerjaan × Koefisien Tukang\n"
        "3. Kebutuhan Pekerja per Hari = Pembulatan Ke Atas (Total OH Pekerja / Target Hari Selesai)\n"
        "4. Kebutuhan Tukang per Hari = Pembulatan Ke Atas (Total OH Tukang / Target Hari Selesai)\n"
        "5. Total Tenaga Kerja per Hari = Kebutuhan Pekerja/Hari + Kebutuhan Tukang/Hari",
        border_color="059669", bg_color="ECFDF5"
    )
    doc.add_bullet("Langkah Pengisian Formulir", 
                   "Pilih Template Preset AHSP SNI (misal: Pengecoran Beton, Pembesian Baja, Pasangan Dinding AAC, Plesteran, MEP Solar PV). Sistem otomatis mengisi koefisien pekerja dan tukang sesuai standar SNI PUPR. Masukkan Volume Pekerjaan dan Target Hari Selesai.")
    doc.add_bullet("Live Real-Time Preview", 
                   "Sembari mengetik angka, kotak pratinjau langsung menampilkan estimasi Orang-Hari (OH), jumlah pekerja/hari, tukang/hari, serta rasio komposisi regu kerja (contoh: 1 Tukang : 5 Pekerja).")
    doc.add_bullet("Cetak / Ekspor Rekapitulasi", 
                   "Klik tombol 'Cetak / Ekspor' untuk mencetak laporan alokasi kebutuhan tenaga kerja resmi yang siap diserahkan kepada site manager atau bagian keuangan logistik.")

    doc.add_h2("3.5 Modul 4: Quality Control (QC) & Kendali Mutu")
    doc.add_paragraph(
        "Dikelola oleh Quality Control Engineer (qc@proyek.com). Berfungsi menginspeksi dan mencatat kepatuhan mutu terhadap spesifikasi teknis dan gambar DED."
    )
    doc.add_bullet("Input Inspeksi Mutu Baru", 
                   "Pilih kategori pekerjaan (Struktur, Arsitektur, MEP, Infrastruktur), masukkan metode pengujian (Uji Slump, Uji Kuat Tekan Silinder fc' 30 MPa, Hydrostatic Pressure Test, Uji Ketegakan Plumb Bob), standar acuan (SNI/ASTM), nama PIC QC, dan tingkat urgensi.")
    doc.add_bullet("Tingkat Urgensi Cacat", 
                   "Tersedia 4 level keparahan: Minor (cacat kosmetik), Moderate (cacat permukaan non-struktural), Major (penyimpangan dimensi/toleransi), dan Critical (kegagalan uji kekuatan struktur).")
    doc.add_bullet("Status Hasil Inspeksi", 
                   "Pilih status mutu: 'Lolos QC / Approved', 'Perlu Perbaikan / Punch List' (pekerjaan rework), 'Ditolak / Rejected', atau 'Menunggu Uji Lab'.")
    doc.add_bullet("Foto Bukti Inspeksi", 
                   "Unggah foto temuan cacat atau bukti silinder beton. Foto langsung tersimpan dalam format Base64 dan dapat diperbesar dengan mengklik thumbnail gambar.")

    doc.add_h2("3.6 Modul 5: Analisis Risiko Proyek & Risk Impact Engine")
    doc.add_paragraph(
        "Dikelola oleh Petugas HSE & Manajemen Risiko K3 (risk@proyek.com). Menerapkan kerangka kerja ISO 31000 Risk Management."
    )
    doc.add_bullet("Matriks Risiko 5x5 Interaktif", 
                   "Tampilan visual grid matriks 5x5 (Probabilitas 1-5 × Dampak 1-5 = Skor 1-25) yang otomatis menyorot konsentrasi risiko proyek.")
    doc.add_callout(
        "CARA KERJA CIVIL ENGINEERING RISK IMPACT ENGINE",
        "• Jika risiko diinput dengan skor Critical (Skor >= 20): Sistem otomatis menambah durasi WBS terkait +7 HARI, memotong progres realisasi, dan mendistorsi Kurva S Realisasi (slippage delay).\n"
        "• Jika risiko diinput dengan skor High (Skor >= 12): Sistem otomatis menambah durasi WBS terkait +3 HARI dan mendistorsi Kurva S Realisasi.\n"
        "Engine ini memberikan simulasi dampak risiko nyata terhadap jadwal serah terima proyek.",
        border_color="EA580C", bg_color="FFF7ED"
    )

    doc.add_h2("3.7 Modul 6: Manajemen & Analisis Limbah Konstruksi")
    doc.add_paragraph(
        "Dikelola oleh Petugas Lingkungan & Limbah (waste@proyek.com). Memastikan kepatuhan terhadap sertifikasi green building dan ISO 14001."
    )
    doc.add_bullet("Pencatatan Neraca Limbah", 
                   "Catat timbulan limbah proyek (Limbah B3, Limbah Padat Daur Ulang, Limbah Domestik), volume, metode pengelolaan (Reuse, Recycle, TPS Sementara, Pihak ke-3 Berizin), dan vendor berlisensi.")
    doc.add_bullet("Unggah Bukti Manifest B3", 
                   "Unggah foto/dokumen berita acara manifest penyerahan limbah B3 resmi.")
    doc.add_bullet("Analisis Waste Diversion Rate", 
                   "Dashboard otomatis menampilkan persentase limbah yang berhasil diselamatkan dari Tempat Pembuangan Akhir (TPA).")

    doc.add_h2("3.8 Modul 7: Logistik Just-In-Time (JIT) & Alat Berat")
    doc.add_paragraph(
        "Dikelola oleh Koordinator Alat Berat & Logistik (alat@proyek.com). Mencegah kemacetan area proyek (site congestion) dan memastikan keselamatan alat berat."
    )
    doc.add_bullet("Jadwal Kedatangan Material JIT", 
                   "Jadwalkan tanggal dan jam kedatangan truk material beserta titik bongkar (drop point). Tersedia fitur upload Surat Jalan (DO).")
    doc.add_bullet("Tombol QC Pass & Auto Sinkronisasi Stok", 
                   "Saat truk material tiba, petugas mengklik tombol 'QC Pass'. Sistem otomatis memverifikasi kedatangan dan MENAMBAHKAN volume material tersebut secara instan ke Modul Kontrol Material.")
    doc.add_bullet("Registrasi Alat Berat & Verifikasi SIA/SILO", 
                   "Daftarkan Tower Crane, Excavator, Concrete Pump, Mobile Crane, dan catat status Surat Izin Alat (SIA) dan Surat Izin Layak Operasi (SILO) untuk mencegah kecelakaan kerja K3.")

    doc.add_page_break()

    # BAB IV
    doc.add_h1("BAB IV: TUJUAN OUTPUT APLIKASI & PELAPORAN EKSEKUTIF")
    doc.add_h2("4.1 Manfaat Output bagi Setiap Stakeholder")
    doc.add_paragraph(
        "Setiap modul dalam aplikasi menghasilkan output analitis bernilai tinggi untuk berbagai pihak:"
    )

    out_headers = ["Pihak / Stakeholder", "Output Utama yang Dihasilkan", "Manfaat Nyata bagi Proyek"]
    out_rows = [
        ["Project Manager (PM)", "Kurva S Dinamis, Indeks Deviasi, Matriks Risiko ISO 31000", "Pengambilan keputusan strategis, mitigasi slippage jadwal, dan laporan progres ke Direksi."],
        ["Site Engineer / Planner", "WBS Milestone Tracking, Durasi Kritis, Rekalkulasi Kurva S", "Monitoring deviasi rencana vs realisasi mingguan dan penyesuaian alokasi sumber daya."],
        ["Mandor & Pelaksana Lapangan", "Tabel Kebutuhan Pekerja & Tukang Harian berbasis SNI", "Kepastian jumlah regu kerja setiap pekerjaan, menghindari kekurangan tukang atau overbudget."],
        ["Quality Control (QC) Inspector", "Punch List Rework Tracking, Bukti Uji Lab & Approval", "Jaminan mutu spesifikasi teknis, dokumen serah terima zero-defect tanpa klaim kegagalan bangunan."],
        ["Petugas Gudang & Logistik", "Notifikasi Reorder Segera & Sinkronisasi DO Kedatangan", "Menghilangkan risiko pekerjaan terhenti akibat material habis (stockout prevention)."],
        ["HSE & Ahli K3 Konstruksi", "Pemantauan Masa Berlaku SIA/SILO Alat Berat & Mitigasi Risiko", "Pencegahan insiden fatal alat berat dan kepatuhan penuh terhadap regulasi K3 Permenaker."],
        ["Owner / Pemilik Proyek", "Dashboard Eksekutif KPI Proyek Real-time & Sertifikasi Hijau", "Transparansi penuh progres fisik, kepastian tanggal selesai proyek, dan akuntabilitas biaya."]
    ]
    doc.add_table(out_headers, out_rows, [2200, 3600, 3560])

    doc.add_h2("4.2 Fitur Ekspor & Pelaporan Siap Cetak")
    doc.add_paragraph(
        "Aplikasi menyediakan kemampuan cetak dan ekspor langsung tanpa ketergantungan software pihak ketiga:"
    )
    doc.add_bullet("Cetak Laporan Kebutuhan Tenaga Kerja", "Menghasilkan format rekapitulasi kebutuhan pekerja dan tukang per hari lengkap dengan referensi standar SNI.")
    doc.add_bullet("Ekspor Grafik Kurva S", "Kurva S berbasis Chart.js interaktif dengan tooltip angka progres mingguan yang dapat dicetak langsung melalui fungsi print browser (Ctrl + P).")

    doc.add_page_break()

    # BAB V
    doc.add_h1("BAB V: TROUBLESHOOTING & PETUNJUK TEKNIS")
    doc.add_h2("5.1 Pertanyaan yang Sering Diajukan (FAQ)")
    doc.add_bullet("Bagaimana jika saya membuka fitur yang bukan wewenang saya?", 
                   "Sistem tetap mengizinkan Anda melihat seluruh data, tabel, dan grafik secara lengkap. Namun tombol edit, tombol hapus, dan formulir input otomatis dinonaktifkan demi menjaga integritas data.")
    doc.add_bullet("Apakah data saya akan hilang jika browser ditutup?", 
                   "Tidak. Sistem menggunakan teknologi LocalStorage persistent layer yang menyimpan seluruh data secara permanen di komputer Anda meskipun browser ditutup atau komputer dimatikan.")
    doc.add_bullet("Bagaimana cara mereset kembali ke data awal bawaan?", 
                   "Cukup buka console peramban (F12 > Console), ketik `localStorage.clear()` lalu tekan Enter dan muat ulang halaman (F5). Sistem akan otomatis menginisialisasi ulang seluruh data seed standar.")
    doc.add_bullet("Bagaimana cara menjalankan aplikasi dengan server MySQL?", 
                   "Pastikan MySQL XAMPP aktif di port 3306, jalankan perintah `npm start` di folder proyek, lalu buka alamat `http://localhost:3000` di browser Anda.")

    doc.save(filename)
    print(f"Berhasil membuat dokumen Word: {filename} ({os.path.getsize(filename)} bytes)")


# ==============================================================================
# 3. BUILD PDF LENGKAP MENGGUNAKAN MATPLOTLIB BACKEND
# ==============================================================================

def draw_pdf_page(ax, title, sections, page_num, total_pages=5):
    ax.clear()
    ax.axis('off')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 140)

    # Top header bar
    ax.add_patch(patches.Rectangle((0, 132), 100, 8, facecolor='#0F172A', edgecolor='none'))
    ax.text(5, 135, "PENGENDALIAN PROYEK - MODUL PANDUAN RESMI", fontsize=9, color='#FFFFFF', fontweight='bold', va='center')
    ax.text(95, 135, "SISTEM MUTU & PROYEK", fontsize=8, color='#94A3B8', va='center', ha='right')

    # Page Title
    ax.text(5, 125, title, fontsize=15, color='#0F172A', fontweight='bold', va='top')
    ax.plot([5, 95], [121, 121], color='#2563EB', linewidth=2)

    # Content cursor
    y = 116
    for sec in sections:
        sec_type = sec.get('type')
        if sec_type == 'h2':
            y -= 3
            ax.text(5, y, sec['text'], fontsize=11, color='#1E40AF', fontweight='bold', va='top')
            y -= 5
        elif sec_type == 'p':
            lines = sec['text'].split('\n')
            for line in lines:
                ax.text(5, y, line, fontsize=8.5, color='#334155', va='top', wrap=True)
                y -= 3.8
            y -= 1.5
        elif sec_type == 'callout':
            box_height = sec.get('height', 14)
            y -= 2
            ax.add_patch(patches.Rectangle((5, y - box_height), 90, box_height, facecolor=sec.get('bg', '#F8FAFC'), edgecolor=sec.get('border', '#2563EB'), linewidth=1.5))
            ax.text(7, y - 2.5, sec['title'], fontsize=9, color=sec.get('border', '#2563EB'), fontweight='bold', va='top')
            lines = sec['text'].split('\n')
            cy = y - 6.5
            for line in lines:
                ax.text(7, cy, line, fontsize=7.8, color='#334155', va='top')
                cy -= 3.2
            y -= (box_height + 4)
        elif sec_type == 'bullet':
            ax.text(7, y, "•", fontsize=9, color='#2563EB', fontweight='bold', va='top')
            ax.text(10, y, sec['prefix'] + ": ", fontsize=8.5, color='#0F172A', fontweight='bold', va='top')
            prefix_len = len(sec['prefix']) * 0.95
            ax.text(10 + prefix_len, y, sec['text'], fontsize=8.5, color='#334155', va='top')
            y -= 4.2
        elif sec_type == 'table':
            headers = sec['headers']
            rows = sec['rows']
            col_x = sec.get('col_x', [5, 25, 45, 70, 85])
            col_w = sec.get('col_w', [20, 20, 25, 15, 15])
            row_h = 4.2

            # Table Header
            ax.add_patch(patches.Rectangle((5, y - row_h), 90, row_h, facecolor='#1E3A8A', edgecolor='none'))
            for idx, h_text in enumerate(headers):
                ax.text(col_x[idx] + 1, y - (row_h / 2), h_text, fontsize=7.5, color='#FFFFFF', fontweight='bold', va='center')
            y -= row_h

            # Table Rows
            for r_idx, r_data in enumerate(rows):
                bg = '#F8FAFC' if r_idx % 2 == 1 else '#FFFFFF'
                ax.add_patch(patches.Rectangle((5, y - row_h), 90, row_h, facecolor=bg, edgecolor='#E2E8F0', linewidth=0.5))
                for idx, cell_text in enumerate(r_data):
                    ax.text(col_x[idx] + 1, y - (row_h / 2), str(cell_text), fontsize=7.2, color='#1E293B', va='center')
                y -= row_h
            y -= 4

    # Bottom footer bar
    ax.add_patch(patches.Rectangle((0, 0), 100, 6, facecolor='#F1F5F9', edgecolor='none'))
    ax.plot([0, 100], [6, 6], color='#CBD5E1', linewidth=0.8)
    ax.text(5, 3, "Dokumen Resmi Pengendalian Proyek Konstruksi - Standar SNI & ISO 31000", fontsize=7.5, color='#64748B', va='center')
    ax.text(95, 3, f"Halaman {page_num} dari {total_pages}", fontsize=7.5, color='#64748B', va='center', ha='right')


def generate_full_pdf(filename):
    total_pages = 5
    with PdfPages(filename) as pdf:
        fig, ax = plt.subplots(figsize=(8.27, 11.69))  # A4 size

        # HALAMAN 1: COVER & PENDAHULUAN
        p1_sections = [
            {'type': 'callout', 'title': 'SISTEM TERPADU PENGENDALIAN PROYEK KONSTRUKSI',
             'text': 'Panduan Operasional Teknis & Manajemen Mutu Terpadu\n'
                     'Versi: 2.5 Enterprise Edition | Tanggal: November 2026\n'
                     'Standar Acuan: SNI Tata Cara Perhitungan Kebutuhan Tenaga Kerja PUPR,\n'
                     'Earned Value Management (EVM), Kurva S Dinamis, & ISO 31000 Risk Engine.',
             'border': '#0F172A', 'bg': '#F8FAFC', 'height': 20},
            {'type': 'h2', 'text': '1.1 Latar Belakang & Filosofi Sistem'},
            {'type': 'p', 'text': "Aplikasi 'PENGENDALIAN PROYEK' dibangun untuk memadukan manajemen waktu (Kurva S),\n"
                                 "logistik material ramah lingkungan, estimasi tenaga kerja berbasis SNI, kendali mutu (QC),\n"
                                 "serta mitigasi risiko teknis secara real-time dalam satu dasbor terintegrasi."},
            {'type': 'h2', 'text': '1.2 Tujuan Utama Aplikasi'},
            {'type': 'bullet', 'prefix': 'Kurva S Dinamis & WBS', 'text': 'Memodelkan realisasi lapangan vs rencana baseline serta mendeteksi keterlambatan.'},
            {'type': 'bullet', 'prefix': 'Civil Engineering Risk Engine', 'text': 'Mendistorsi Kurva S (+7 Hari Critical, +3 Hari High) akibat risiko teknis.'},
            {'type': 'bullet', 'prefix': 'Kalkulator Tenaga Kerja SNI', 'text': 'Mengganti absensi pasif dengan estimasi kebutuhan pekerja/hari acuan AHSP.'},
            {'type': 'bullet', 'prefix': 'Zero-Defect Quality Control', 'text': 'Mengelola inspeksi mutu uji beton/baja dan tracking perbaikan punch list.'},
            {'type': 'bullet', 'prefix': 'Logistik JIT & Kelaikan K3', 'text': 'Kedatangan armada tepat waktu dan verifikasi izin kelaikan SIA/SILO alat berat.'},
            {'type': 'callout', 'title': 'ARSITEKTUR RESILIENT OFFLINE & SERVER',
             'text': 'Aplikasi bekerja 100% mandiri di browser via LocalStorage (siap Netlify/GitHub Pages),\n'
                     'serta kompatibel dengan backend REST API Node.js/Express dan database MySQL.',
             'border': '#2563EB', 'bg': '#EFF6FF', 'height': 15}
        ]
        draw_pdf_page(ax, "BAB I: PENDAHULUAN & TUJUAN UTAMA APLIKASI", p1_sections, 1, total_pages)
        pdf.savefig(fig, bbox_inches='tight')

        # HALAMAN 2: SISTEM AUTENTIKASI & RBAC
        p2_sections = [
            {'type': 'callout', 'title': 'PRINSIP UTAMA PEMBATASAN HAK AKSES PEKERJA',
             'text': 'Setiap fitur hanya dapat diakses (diedit, ditambah, dihapus) oleh pekerja yang berwenang.\n'
                     'Pekerja lain yang tidak bersangkutan tetap dapat melihat seluruh data dalam mode\n'
                     'Hanya Lihat (Read-Only) demi menjamin keamanan dan akuntabilitas data proyek.',
             'border': '#DC2626', 'bg': '#FEF2F2', 'height': 16},
            {'type': 'h2', 'text': '2.1 Matriks Hak Akses Peran Pekerja (Password: password123)'},
            {'type': 'table',
             'headers': ['Email Akun', 'Nama Pekerja', 'Peran / Jabatan', 'Wewenang Modul'],
             'rows': [
                 ['admin@proyek.com', 'Ir. Hendra Gunawan', 'Project Manager', 'Akses Penuh (7 Modul)'],
                 ['material@proyek.com', 'Bambang Subagyo', 'Petugas Gudang', '[Material] Kontrol Material'],
                 ['planner@proyek.com', 'Dian Paramitha, S.T.', 'Site Engineer / Planner', '[Jadwal] Jadwal & Kurva S'],
                 ['mandor@proyek.com', 'Pak Trisno (Mandor)', 'Mandor Utama', '[Tenaga] Kebutuhan Pekerja'],
                 ['qc@proyek.com', 'Ir. Reza Fahmi', 'QC Inspector', '[QC] Quality Control (QC)'],
                 ['risk@proyek.com', 'Siti Aminah, S.K.M.', 'HSE & Risk Officer', '[Risiko] Analisis Risiko Proyek'],
                 ['waste@proyek.com', 'Agus Purnomo', 'Petugas Lingkungan', '[Limbah] Manajemen Limbah'],
                 ['alat@proyek.com', 'Rahmat Hidayat', 'Koordinator Alat Berat', '[Logistik] Logistik & Alat Berat'],
                 ['pekerja@proyek.com', 'Wahyu Ramadhan', 'Pekerja / Tamu', 'Semua Modul Hanya Lihat']
             ],
             'col_x': [5, 30, 56, 76],
             'col_w': [25, 26, 20, 19]},
            {'type': 'h2', 'text': '2.2 Ciri-Ciri Mode Hanya Lihat (Read-Only)'},
            {'type': 'bullet', 'prefix': 'Banner Peringatan Kuning/Abu', 'text': 'Tampil di atas modul: Anda masuk sebagai [Nama]. Akses tulis dibatasi.'},
            {'type': 'bullet', 'prefix': 'Formulir Input Terkunci', 'text': 'Seluruh input, pilihan dropdown, dan tombol simpan dinonaktifkan.'},
            {'type': 'bullet', 'prefix': 'Lencana Gembok pada Tabel', 'text': 'Aksi Edit/Hapus digantikan badge gembok bertuliskan Hanya Lihat.'}
        ]
        draw_pdf_page(ax, "BAB II: AUTENTIKASI & HAK AKSES PEKERJA (RBAC)", p2_sections, 2, total_pages)
        pdf.savefig(fig, bbox_inches='tight')

        # HALAMAN 3: MODUL OPERASIONAL 1, 2, 3
        p3_sections = [
            {'type': 'h2', 'text': '3.1 Modul 1: Kontrol Material & Logistik Hijau'},
            {'type': 'bullet', 'prefix': 'Formula Stok Otomatis', 'text': 'Sisa Stok = Stok Masuk - Stok Keluar.'},
            {'type': 'bullet', 'prefix': 'Peringatan Reorder Segera', 'text': 'Jika Sisa Stok <= Min Stok, muncul pulsing badge merah REORDER SEGERA.'},
            {'type': 'h2', 'text': '3.2 Modul 2: Progres Jadwal & Kurva S Dinamis'},
            {'type': 'bullet', 'prefix': 'Import MS Project (.xml/.xlsx)', 'text': 'Unggah file MS Project, sistem mengekstrak WBS dan kurva mingguan.'},
            {'type': 'bullet', 'prefix': 'Update Progres Realisasi', 'text': 'Input capaian fisik (0-100%), Kurva S Realisasi langsung dirender ulang.'},
            {'type': 'h2', 'text': '3.3 Modul 3: Analisis Kebutuhan Tenaga Kerja (Labor SNI)'},
            {'type': 'callout', 'title': 'FORMULA STANDAR SNI PUPR TATA CARA PERHITUNGAN KEBUTUHAN TENAGA KERJA',
             'text': '• Total OH Pekerja = Volume Pekerjaan × Koefisien Pekerja SNI\n'
                     '• Total OH Tukang = Volume Pekerjaan × Koefisien Tukang SNI\n'
                     '• Pekerja per Hari = RoundUp (Total OH Pekerja / Target Hari Selesai)\n'
                     '• Tukang per Hari = RoundUp (Total OH Tukang / Target Hari Selesai)\n'
                     '• Rasio Regu Kerja = Memastikan proporsi tukang terhadap pekerja ideal di lapangan.',
             'border': '#059669', 'bg': '#ECFDF5', 'height': 22},
            {'type': 'bullet', 'prefix': 'Preset AHSP SNI Bawaan', 'text': 'Pengecoran Beton, Pembesian Baja, Pasangan AAC, Plesteran, & MEP.'},
            {'type': 'bullet', 'prefix': 'Cetak & Ekspor Rekapitulasi', 'text': 'Menghasilkan dokumen resmi alokasi regu kerja harian.'}
        ]
        draw_pdf_page(ax, "BAB III: PANDUAN PENGGUNAAN FITUR (BAGIAN 1)", p3_sections, 3, total_pages)
        pdf.savefig(fig, bbox_inches='tight')

        # HALAMAN 4: MODUL OPERASIONAL 4, 5, 6, 7
        p4_sections = [
            {'type': 'h2', 'text': '3.4 Modul 4: Quality Control (QC) & Kendali Mutu'},
            {'type': 'bullet', 'prefix': 'Uji Mutu Konstruksi', 'text': 'Slump test beton, silinder fc 30 MPa, hydrostatic pipa, ketegakan dinding.'},
            {'type': 'bullet', 'prefix': 'Klasifikasi Tingkat Cacat', 'text': 'Minor (kosmetik), Moderate (permukaan), Major (dimensi), Critical (struktur).'},
            {'type': 'bullet', 'prefix': 'Tracking Punch List & Approval', 'text': 'Status Lolos QC, Perlu Perbaikan (Rework), Ditolak, atau Uji Lab.'},
            {'type': 'h2', 'text': '3.5 Modul 5: Analisis Risiko & Risk Impact Engine'},
            {'type': 'callout', 'title': 'INTEGRASI CIVIL ENGINEERING RISK IMPACT ENGINE ISO 31000',
             'text': '• Skor Critical (Skor >= 20): Otomatis menambah durasi WBS +7 Hari & slippage Kurva S.\n'
                     '• Skor High (Skor >= 12): Otomatis menambah durasi WBS +3 Hari & slippage Kurva S.\n'
                     'Memberikan proyeksi tanggal selesai realistis akibat kendala tak terduga.',
             'border': '#EA580C', 'bg': '#FFF7ED', 'height': 16},
            {'type': 'h2', 'text': '3.6 Modul 6: Manajemen Limbah Hijau (ISO 14001)'},
            {'type': 'bullet', 'prefix': 'Neraca Limbah & Manifest B3', 'text': 'Catat timbulan limbah, vendor berizin, dan berita acara penyerahan.'},
            {'type': 'h2', 'text': '3.7 Modul 7: Logistik Just-In-Time (JIT) & Alat Berat'},
            {'type': 'bullet', 'prefix': 'QC Pass & Auto Sinkronisasi', 'text': 'Klik QC Pass saat armada tiba, volume otomatis masuk stok material.'},
            {'type': 'bullet', 'prefix': 'Kelaikan K3 SIA/SILO Alat', 'text': 'Pengawasan masa berlaku izin alat berat (Crane, Excavator, Pump Truck).'}
        ]
        draw_pdf_page(ax, "BAB III: PANDUAN PENGGUNAAN FITUR (BAGIAN 2)", p4_sections, 4, total_pages)
        pdf.savefig(fig, bbox_inches='tight')

        # HALAMAN 5: OUTPUT APLIKASI & PELAPORAN
        p5_sections = [
            {'type': 'h2', 'text': '4.1 Manfaat Output bagi Setiap Stakeholder'},
            {'type': 'table',
             'headers': ['Stakeholder Proyek', 'Output Utama yang Dihasilkan', 'Manfaat Strategis & Nyata'],
             'rows': [
                 ['Project Manager', 'Kurva S Dinamis, Indeks Deviasi, Matriks Risiko', 'Keputusan tepat waktu, mitigasi delay sebelum membengkak.'],
                 ['Site Engineer / Planner', 'Tracking WBS, Milestone, Durasi Kritis', 'Kontrol deviasi fisik vs jadwal mingguan secara akurat.'],
                 ['Mandor / Pelaksana', 'Tabel Kebutuhan Tukang & Pekerja per Hari', 'Mencegah pembengkakan upah atau kekurangan tukang.'],
                 ['QC Inspector', 'Punch List Rework, Rekap Uji Mutu & Approval', 'Jaminan mutu zero-defect sebelum serah terima bangunan.'],
                 ['Petugas Gudang', 'Status Stok & Peringatan Reorder Segera', 'Mencegah pekerjaan berhenti akibat material habis.'],
                 ['HSE Officer', 'Status Kelaikan SIA/SILO & Mitigasi Risiko K3', 'Kepatuhan Permenaker & pencegahan insiden fatal alat.'],
                 ['Owner Proyek', 'Dasbor KPI Eksekutif Proyek Real-time', 'Transparansi total kemajuan fisik dan akuntabilitas biaya.']
             ],
             'col_x': [5, 27, 60],
             'col_w': [22, 33, 35]},
            {'type': 'h2', 'text': '4.2 Petunjuk Teknis & Troubleshooting Singkat'},
            {'type': 'bullet', 'prefix': 'Keamanan Penyimpanan Data', 'text': 'Data tersimpan otomatis di LocalStorage peramban dan tidak hilang saat ditutup.'},
            {'type': 'bullet', 'prefix': 'Reset Data Pabrik', 'text': 'Buka Console (F12), ketik localStorage.clear() dan refresh halaman.'},
            {'type': 'bullet', 'prefix': 'Cetak Laporan', 'text': 'Tekan tombol Cetak di tabel Tenaga Kerja atau gunakan pintasan Ctrl + P.'}
        ]
        draw_pdf_page(ax, "BAB IV & V: TUJUAN OUTPUT APLIKASI & PELAPORAN", p5_sections, 5, total_pages)
        pdf.savefig(fig, bbox_inches='tight')

        plt.close(fig)

    print(f"Berhasil membuat dokumen PDF: {filename} ({os.path.getsize(filename)} bytes)")


# ==============================================================================
# 4. BUILD HTML PRINT-READY (DAPAT DIKLIK & DICETAK LANGSUNG)
# ==============================================================================

def generate_full_html(filename):
    html_content = """<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modul Panduan Penggunaan & Tujuan Output - PENGENDALIAN PROYEK</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #f8fafc; line-height: 1.6; }
        .doc-container { max-width: 960px; margin: 30px auto; background: #ffffff; padding: 50px 60px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .cover-box { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); color: #ffffff; padding: 40px; border-radius: 10px; margin-bottom: 40px; }
        h1.doc-title { font-size: 2.2rem; font-weight: 800; margin-bottom: 12px; }
        h2.section-title { font-size: 1.45rem; font-weight: 700; color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 40px; margin-bottom: 20px; }
        h3.sub-title { font-size: 1.15rem; font-weight: 600; color: #1e40af; margin-top: 24px; margin-bottom: 12px; }
        .callout { background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
        .callout-danger { border-left-color: #dc2626; background-color: #fef2f2; }
        .callout-success { border-left-color: #059669; background-color: #ecfdf5; }
        .callout-warning { border-left-color: #ea580c; background-color: #fff7ed; }
        .table-custom { font-size: 0.9rem; }
        .table-custom th { background-color: #1e3a8a; color: #ffffff; font-weight: 600; text-align: center; }
        .badge-role { font-size: 0.75rem; padding: 4px 8px; }
        @media print {
            body { background: #ffffff; font-size: 10pt; }
            .doc-container { box-shadow: none; padding: 0; margin: 0; max-width: 100%; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
        }
    </style>
</head>
<body>
    <div class="container py-4">
        <div class="d-flex justify-content-end mb-3 no-print gap-2">
            <button onclick="window.print()" class="btn btn-primary btn-sm"><i class="bi bi-printer me-1"></i> Cetak Dokumen / Simpan PDF</button>
            <a href="MODUL_PANDUAN_PENGENDALIAN_PROYEK.docx" download class="btn btn-outline-success btn-sm"><i class="bi bi-file-earmark-word me-1"></i> Download Word (.docx)</a>
            <a href="MODUL_PANDUAN_PENGENDALIAN_PROYEK.pdf" download class="btn btn-outline-danger btn-sm"><i class="bi bi-file-earmark-pdf me-1"></i> Download PDF</a>
        </div>

        <div class="doc-container">
            <!-- COVER -->
            <div class="cover-box text-center">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle mb-3 px-3 py-1 fw-bold">DOKUMEN RESMI PANDUAN SISTEM</span>
                <h1 class="doc-title">MODUL PANDUAN PENGGUNAAN &amp; TUJUAN OUTPUT SISTEM</h1>
                <p class="lead text-white-50 mb-4">Aplikasi Terpadu 'PENGENDALIAN PROYEK' (Civil Engineering Project Control &amp; Quality System)</p>
                <div class="row g-2 justify-content-center small text-white-50">
                    <div class="col-auto"><i class="bi bi-tag me-1"></i> Versi 2.5 Enterprise</div>
                    <div class="col-auto">|</div>
                    <div class="col-auto"><i class="bi bi-calendar3 me-1"></i> November 2026</div>
                    <div class="col-auto">|</div>
                    <div class="col-auto"><i class="bi bi-shield-check me-1"></i> Terakreditasi SNI &amp; ISO 31000</div>
                </div>
            </div>

            <!-- BAB I -->
            <h2 class="section-title"><i class="bi bi-compass me-2 text-primary"></i>BAB I: PENDAHULUAN &amp; TUJUAN APLIKASI</h2>
            <h3 class="sub-title">1.1 Latar Belakang &amp; Filosofi Sistem</h3>
            <p>Dalam industri konstruksi modern, kegagalan proyek sebagian besar bersumber dari kurangnya integrasi antara perencanaan waktu (schedule), logistik material, alokasi tenaga kerja di lapangan, kendali mutu (quality control), dan mitigasi risiko teknis. Aplikasi <strong>PENGENDALIAN PROYEK</strong> dibangun sebagai platform sistem terpadu yang memadukan prinsip Civil Engineering Systems, Earned Value Management (EVM), dan Standar Nasional Indonesia (SNI) ke dalam satu dashboard dinamis.</p>

            <h3 class="sub-title">1.2 Tujuan Utama Aplikasi</h3>
            <ul class="list-unstyled">
                <li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i><strong>Pengendalian Jadwal &amp; Kurva S:</strong> Memodelkan kurva S rencana vs realisasi lapangan secara matematis dan real-time guna mendeteksi deviasi jadwal sedini mungkin.</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i><strong>Civil Engineering Risk Impact Engine:</strong> Mengintegrasikan risiko berperingkat tinggi secara otomatis terhadap durasi WBS (+7 Hari Critical, +3 Hari High) dan merender ulang Kurva S Realisasi (slippage delay).</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i><strong>Akurasi Kebutuhan Tenaga Kerja:</strong> Menggantikan pencatatan absensi pasif dengan kalkulator kebutuhan pekerja berbasis koefisien AHSP SNI PUPR, volume, dan target hari untuk mencegah overstaffing atau understaffing.</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i><strong>Zero-Defect Quality Control:</strong> Mengendalikan inspeksi mutu uji beton/baja serta mengelola punch list cacat perbaikan sebelum serah terima pekerjaan.</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-primary me-2"></i><strong>Logistik JIT &amp; Kelaikan Alat K3:</strong> Memantau ambang batas reorder material, jadwal armada Just-In-Time, dan verifikasi izin kelaikan SIA/SILO alat berat.</li>
            </ul>

            <div class="callout">
                <strong><i class="bi bi-cpu-fill text-primary me-1"></i> Arsitektur Hybrid Resilient:</strong>
                Aplikasi bekerja 100% mandiri secara offline di peramban pengguna menggunakan LocalStorage Persistent Layer (siap Netlify/GitHub Pages), dan secara otomatis mendukung koneksi database backend Node.js Express &amp; MySQL.
            </div>

            <div class="page-break"></div>

            <!-- BAB II -->
            <h2 class="section-title"><i class="bi bi-shield-lock me-2 text-danger"></i>BAB II: SISTEM AUTENTIKASI &amp; HAK AKSES PEKERJA (RBAC)</h2>
            <div class="callout callout-danger">
                <h5 class="fw-bold text-danger mb-1"><i class="bi bi-exclamation-triangle-fill me-2"></i>Aturan Inti Hak Akses Pekerja:</h5>
                <span>Setiap fitur dan modul hanya dapat diedit, ditambah, atau dimodifikasi oleh pekerja yang bersangkutan sesuai bidang wewenang tugasnya. Pekerja lain yang tidak bersangkutan tetap dapat membuka modul tersebut namun secara otomatis dikunci ke dalam <strong>Mode Hanya Lihat (Read-Only)</strong> tanpa hak mengubah data.</span>
            </div>

            <h3 class="sub-title">2.1 Matriks Hak Akses &amp; 9 Akun Bawaan (Password default: <code>password123</code>)</h3>
            <div class="table-responsive">
                <table class="table table-bordered table-hover table-custom align-middle">
                    <thead>
                        <tr>
                            <th>Email Akun</th>
                            <th>Nama Pekerja</th>
                            <th>Peran (Role)</th>
                            <th>Wewenang Modul (Dapat Edit)</th>
                            <th>Modul Lainnya</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>admin@proyek.com</code></td><td>Ir. Hendra Gunawan</td><td><span class="badge bg-primary badge-role">Project Manager</span></td><td><strong>Akses Penuh (7 Modul)</strong></td><td>Akses Penuh</td></tr>
                        <tr><td><code>material@proyek.com</code></td><td>Bambang Subagyo</td><td><span class="badge bg-success badge-role">Logistik Material</span></td><td>📦 Kontrol Material</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>planner@proyek.com</code></td><td>Dian Paramitha, S.T.</td><td><span class="badge bg-info text-dark badge-role">Planner / Scheduler</span></td><td>📊 Jadwal &amp; Kurva S</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>mandor@proyek.com</code></td><td>Pak Trisno (Mandor)</td><td><span class="badge bg-warning text-dark badge-role">Mandor Utama</span></td><td>👷 Kebutuhan Tenaga Kerja</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>qc@proyek.com</code></td><td>Ir. Reza Fahmi</td><td><span class="badge bg-danger badge-role">QC Inspector</span></td><td>🔍 Quality Control (QC)</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>risk@proyek.com</code></td><td>Siti Aminah, S.K.M.</td><td><span class="badge bg-dark badge-role">HSE &amp; Risk Officer</span></td><td>🛡️ Analisis Risiko Proyek</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>waste@proyek.com</code></td><td>Agus Purnomo</td><td><span class="badge bg-secondary badge-role">Petugas Limbah</span></td><td>♻️ Manajemen Limbah</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>alat@proyek.com</code></td><td>Rahmat Hidayat</td><td><span class="badge bg-primary-subtle text-primary border badge-role">Koordinator Alat</span></td><td>🚜 Logistik &amp; Alat Berat</td><td><span class="badge bg-light text-muted border">Hanya Lihat</span></td></tr>
                        <tr><td><code>pekerja@proyek.com</code></td><td>Wahyu Ramadhan</td><td><span class="badge bg-light text-dark border badge-role">Pekerja Lapangan</span></td><td><em>Tidak Ada Hak Tulis</em></td><td><span class="badge bg-light text-muted border">Seluruh Modul Hanya Lihat</span></td></tr>
                    </tbody>
                </table>
            </div>

            <div class="page-break"></div>

            <!-- BAB III -->
            <h2 class="section-title"><i class="bi bi-grid-3x3-gap me-2 text-primary"></i>BAB III: PANDUAN PENGGUNAAN SETIAP MODUL</h2>
            <h3 class="sub-title">3.1 Dashboard KPI Eksekutif</h3>
            <p>Menampilkan 5 metrik utama yang terhubung secara real-time: Rata-rata Progres WBS, Item Material Kritis, Kebutuhan Tenaga Kerja Lapangan, Temuan Punch List QC Aktif, dan Jumlah Risiko Kritis.</p>

            <h3 class="sub-title">3.2 Modul 1: Kontrol Material &amp; Batas Ambang Reorder</h3>
            <p>Dikelola oleh Petugas Material. Mengontrol mutasi stok dengan rumus otomatis: <code>Sisa Stok = Stok Masuk - Stok Keluar</code>. Jika sisa stok berada di bawah batas minimum, lencana merah berkedip <strong>REORDER SEGERA</strong> akan otomatis aktif.</p>

            <h3 class="sub-title">3.3 Modul 2: Progres Jadwal &amp; Kurva S (MS Project XML Parser)</h3>
            <p>Dikelola oleh Site Engineer / Planner. Mendukung unggah file MS Project (.mpp/.xml/.xlsx), perhitungan bobot durasi otomatis, rekonstruksi kurva S mingguan, dan pencatatan progres fisik lapangan.</p>

            <h3 class="sub-title">3.4 Modul 3: Analisis Kebutuhan Tenaga Kerja (Standar SNI PUPR)</h3>
            <p>Dikelola oleh Mandor Utama. Menghitung kebutuhan tenaga kerja harian berdasarkan rumus:</p>
            <div class="callout callout-success">
                <strong>Formula Kebutuhan Tenaga Kerja:</strong><br>
                • Total OH Pekerja = Volume × Koefisien Pekerja SNI<br>
                • Total OH Tukang = Volume × Koefisien Tukang SNI<br>
                • Kebutuhan Pekerja/Hari = RoundUp(Total OH Pekerja / Target Hari)<br>
                • Kebutuhan Tukang/Hari = RoundUp(Total OH Tukang / Target Hari)<br>
                • Rasio Komposisi Regu Kerja dihitung secara real-time.
            </div>

            <h3 class="sub-title">3.5 Modul 4: Quality Control (QC) &amp; Kendali Mutu</h3>
            <p>Dikelola oleh QC Inspector. Mencatat pengujian slump test, kuat tekan silinder beton fc 30 MPa, hydrostatic test pipa, tingkat urgensi cacat, dan tracking perbaikan punch list hingga status Lolos QC / Approved.</p>

            <h3 class="sub-title">3.6 Modul 5: Analisis Risiko &amp; Risk Impact Engine ISO 31000</h3>
            <p>Dikelola oleh HSE Officer. Matriks 5x5 dinamis. Risiko berperingkat <strong>Critical (Skor &ge; 20)</strong> otomatis memperpanjang durasi WBS <strong>+7 Hari</strong>, dan <strong>High (Skor &ge; 12)</strong> menambah <strong>+3 Hari</strong> serta mendistorsi Kurva S Realisasi.</p>

            <h3 class="sub-title">3.7 Modul 6 &amp; 7: Manajemen Limbah &amp; Logistik Alat Berat</h3>
            <p>Pengawasan neraca limbah konstruksi, berita acara manifest B3, jadwal kedatangan material Just-In-Time dengan auto-sinkronisasi stok via tombol 'QC Pass', serta verifikasi kelaikan izin SIA/SILO operator alat berat.</p>

            <div class="page-break"></div>

            <!-- BAB IV -->
            <h2 class="section-title"><i class="bi bi-graph-up-arrow me-2 text-success"></i>BAB IV: TUJUAN OUTPUT APLIKASI &amp; PELAPORAN EKSEKUTIF</h2>
            <div class="table-responsive">
                <table class="table table-bordered table-custom align-middle">
                    <thead>
                        <tr>
                            <th>Stakeholder Proyek</th>
                            <th>Output Utama Aplikasi</th>
                            <th>Manfaat Strategis &amp; Nyata</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Project Manager</strong></td><td>Kurva S Dinamis, Indeks Deviasi, Matriks Risiko ISO 31000</td><td>Keputusan tepat waktu, mitigasi delay sebelum membengkak.</td></tr>
                        <tr><td><strong>Site Engineer / Planner</strong></td><td>WBS Tracking, Durasi Kritis, Distribusi Kurva S</td><td>Kontrol deviasi fisik vs jadwal mingguan secara akurat.</td></tr>
                        <tr><td><strong>Mandor / Pelaksana</strong></td><td>Rekap Kebutuhan Pekerja &amp; Tukang per Hari (SNI)</td><td>Mencegah pembengkakan upah atau kekurangan tukang di lapangan.</td></tr>
                        <tr><td><strong>QC Inspector</strong></td><td>Punch List Rework, Rekap Uji Mutu &amp; Approval</td><td>Jaminan mutu zero-defect sebelum serah terima bangunan.</td></tr>
                        <tr><td><strong>Petugas Logistik Gudang</strong></td><td>Peringatan Reorder Segera &amp; Sinkronisasi Kedatangan DO</td><td>Mencegah pekerjaan berhenti akibat material habis (stockout prevention).</td></tr>
                        <tr><td><strong>HSE &amp; K3 Officer</strong></td><td>Status Kelaikan SIA/SILO &amp; Mitigasi Risiko K3</td><td>Kepatuhan regulasi Permenaker &amp; pencegahan insiden fatal alat berat.</td></tr>
                        <tr><td><strong>Owner / Pemilik Proyek</strong></td><td>Dashboard KPI Eksekutif Proyek Real-time</td><td>Transparansi total kemajuan fisik dan akuntabilitas biaya konstruksi.</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- BAB V -->
            <h2 class="section-title"><i class="bi bi-question-circle me-2 text-secondary"></i>BAB V: TROUBLESHOOTING &amp; PETUNJUK TEKNIS</h2>
            <ul>
                <li class="mb-2"><strong>Keamanan Penyimpanan Data:</strong> Data tersimpan otomatis di LocalStorage peramban dan tidak akan hilang meskipun browser ditutup.</li>
                <li class="mb-2"><strong>Reset Data Pabrik:</strong> Tekan F12 > Console, ketik <code>localStorage.clear()</code> lalu refresh halaman (F5).</li>
                <li class="mb-2"><strong>Cetak Dokumen Resmi:</strong> Gunakan tombol 'Cetak / Ekspor' pada modul Tenaga Kerja atau gunakan pintasan <code>Ctrl + P</code> pada browser.</li>
            </ul>
        </div>
    </div>
</body>
</html>"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Berhasil membuat dokumen HTML: {filename} ({os.path.getsize(filename)} bytes)")


if __name__ == '__main__':
    docx_file = "MODUL_PANDUAN_PENGENDALIAN_PROYEK.docx"
    pdf_file = "MODUL_PANDUAN_PENGENDALIAN_PROYEK.pdf"
    html_file = "MODUL_PANDUAN_PENGENDALIAN_PROYEK.html"

    generate_full_docx(docx_file)
    generate_full_pdf(pdf_file)
    generate_full_html(html_file)
    print("Seluruh modul panduan (Word, PDF, HTML) selesai dibuat dengan rapi!")
