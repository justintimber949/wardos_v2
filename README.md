# WardOS v2 — Ward Control System

> Sistem manajemen pasien bangsal untuk **Ko-asisten Kedokteran**  
> FK

[![Offline Ready](https://img.shields.io/badge/mode-offline%20ready-green)](#)
[![Storage](https://img.shields.io/badge/storage-localStorage-orange)](#)
[![No Build](https://img.shields.io/badge/build-none%20required-brightgreen)](#)

---

## Daftar Isi

- [Tentang](#tentang)
- [Cara Menjalankan](#cara-menjalankan)
- [Fitur Lengkap](#fitur-lengkap)
- [Fitur Baru](#fitur-baru)
- [Format Input](#format-input)
- [Format Batch](#format-batch-laporan-operan)
- [Groq AI Integration](#groq-ai-integration)
- [Struktur Folder](#struktur-folder)
- [Deploy ke GitHub Pages](#deploy-ke-github-pages)
- [Storage & Backup](#storage--backup)
- [Pengaturan](#pengaturan)
- [Ruangan Default](#ruangan-default)

---

## Tentang

WardOS v2 adalah aplikasi web **offline-first** (tidak butuh server) untuk membantu ko-asisten mendokumentasikan dan memantau pasien bangsal secara efisien. Berjalan langsung di browser, data tersimpan di `localStorage`, bisa di-*push* ke GitHub dan diakses via GitHub Pages.

**Tidak butuh backend. Tidak butuh login. Tidak butuh biaya.**

---

## Cara Menjalankan

### Lokal (Langsung)
1. Extract file ZIP
2. Buka `index.html` di browser (Chrome/Edge/Firefox)
3. Selesai — tidak perlu install apapun

### GitHub Pages
Lihat bagian [Deploy ke GitHub Pages](#deploy-ke-github-pages).

> ⚠️ Untuk fitur kamera QR (Import via QR), buka via `http://localhost` atau `https://` — kamera tidak bisa diakses dari file:// karena kebijakan browser.

---

## Fitur Lengkap

### 🗂 Dashboard
- **4 Stat Cards** — Total Aktif, Kritis (+ breakdown ruangan), KRS Hari Ini, Masuk Hari Ini
- **Today Filter Pills** — Filter cepat: Masuk Hari Ini, KRS Hari Ini, Meninggal Hari Ini, Pindah Hari Ini
- **Filter Row** — Pencarian bebas (nama, Dx, bed, dokter), filter per ruangan, status, DPJP
- **Patient Cards** — Nama, usia, JK, bed tag berwarna, diagnosis, tim dokter, TTV chip
- **LOS Badge** — Badge hari rawat di setiap kartu pasien (hijau normal · kuning ≥7 hari · merah ≥14 hari)

### ➕ Input Pasien
**Mode Single:**
- Input teks slash-format → parse otomatis → auto-fill form
- Input teks bebas (resume IGD, CPPT, ERM export) → **Groq AI** parse
- Form lengkap 7 seksi: Lokasi Bed, Identitas, Tim Dokter, Diagnosis, Konsul, TTV, Lab, Terapi, CPPT
- **Auto MRS** — jika tanggal MRS tidak diisi, otomatis diset ke hari ini

**Mode Batch:**
- Paste laporan operan WA langsung
- Auto-detect 4 format berbeda
- **Groq AI fallback** untuk format tidak dikenal
- Preview tabel — pilih/deselect pasien sebelum simpan
- Bed terisi otomatis ditandai agar tidak tumpang tindih

### 🗺 Peta Ruangan
- Visual mini-bed semua ruangan dalam satu layar
- Warna bed sesuai status pasien
- Outline biru = pasien masuk hari ini
- Klik bed → modal detail pasien

### 🏥 Room View
- Bed grid per kamar dengan SVG bed icon animasi
- Klik bed → modal detail

### 📋 Modal Detail Pasien
- Data lengkap semua seksi
- **LOS Counter** — hari ke rawat tampil di header modal
- **Tombol aksi di footer:**
  - ✏️ **Edit** — buka form pre-filled
  - 🔄 **Pindah Bed** — pilih bed tujuan
  - ✅ **KRS** — konfirmasi 2-step, tanggal otomatis
  - 🖤 **Meninggal** — konfirmasi 2-step, waktu otomatis
  - 🧹 **Bersihkan Bed** — hapus data pasien
  - ✦ **AI Hari Ini** — rekomendasi manajemen klinis hari ini via Groq
  - ✦ **Discharge Summary** — draft surat pulang via Groq (khusus status KRS)
  - 🖼 **Foto Lab** — upload & kelola foto hasil laboratorium
  - 📱 **QR** — generate QR code pasien untuk sinkronisasi antar perangkat

---

## Fitur Baru

### 📅 Length of Stay (LOS) Counter
Menghitung otomatis hari rawat pasien dari tanggal MRS:
- **Hijau** — ≤ 6 hari (normal)
- **Kuning** — 7–13 hari (perhatian)
- **Merah** — ≥ 14 hari (rawat lama)

Tampil di setiap patient card di dashboard dan di header modal detail pasien.

---

### ✦ AI Rekomendasi Manajemen Harian
Tombol **✦ AI Hari Ini** di footer modal pasien.

Groq AI menganalisis seluruh data klinis pasien (diagnosis, TTV, lab, terapi, CPPT, LOS) dan menghasilkan:
- **Asesmen kondisi** saat ini
- **Target hari ini** — 5 hal yang harus dilakukan hari ini (spesifik & actionable)
- **Monitoring ketat** — parameter yang perlu dipantau + frekuensinya
- **Saran penyesuaian terapi** (jika ada)
- **Rencana lab/imaging** hari ini
- **Estimasi & syarat KRS**
- **Warning sign** yang perlu diwaspadai

> ⚠️ Wajib diverifikasi dengan klinis dan supervisi DPJP. Bukan pengganti keputusan dokter.

---

### ✦ Discharge Summary Generator
Tombol **✦ Discharge Summary** muncul otomatis untuk pasien berstatus KRS/Lepas Rawat.

Groq AI menghasilkan draft surat ringkasan pulang lengkap:
- Diagnosis akhir & ringkasan perjalanan penyakit
- Kondisi saat pulang
- Obat pulang
- Instruksi untuk pasien (bahasa yang mudah dimengerti)
- Tanda bahaya — kapan harus kembali ke IGD
- Jadwal kontrol

Hasil bisa disalin ke clipboard dengan satu klik.

> ⚠️ Draft wajib direview dan ditandatangani DPJP sebelum diberikan ke pasien.

---

### 📱 Sinkronisasi via QR Code
**Export QR:**
- Buka modal pasien → klik 📱 **QR**
- QR Code pasien ditampilkan (bisa di-download sebagai PNG)

**Import QR:**
- Sidebar → 📷 **Import via QR**
- Pilih metode: upload gambar QR atau scan langsung via kamera
- Data pasien otomatis mengisi form → pilih bed tujuan → simpan

Berguna untuk transfer data pasien antar perangkat (HP ke laptop, atau sesama koas) tanpa perlu Export/Import JSON seluruh data.

---

### 🖼 Foto Hasil Lab
Tombol **🖼 Foto Lab** di footer modal setiap pasien.

**Upload foto:**
- Klik zona upload atau drag & drop langsung
- Bisa pilih banyak foto sekaligus
- Support JPG, PNG, WebP, HEIC

**Kompresi otomatis (tanpa AI, 100% di browser):**
- Canvas API resize gambar ke maksimal 1200px
- Kompres ke JPEG quality 75% → biasanya 50–150KB dari foto kamera 3–10MB
- Jika masih terlalu besar, quality diturunkan bertahap
- Bar indikator penggunaan storage tampil di modal

**Gallery:**
- Thumbnail grid — hover tampilkan tombol hapus
- Klik foto → lightbox fullscreen
- Navigasi antar foto dengan tombol ← → atau keyboard arrow key
- Download foto dari lightbox

**Storage:**
- Foto disimpan sebagai base64 di `patient.fotoLab[]` — menyatu dengan data pasien
- Ikut Export/Import JSON secara otomatis
- Indikator storage di modal foto memberikan warning jika mendekati batas

---

## Format Input

### Format Slash (Input Cepat)

```
Nama / Usia th / Ruangan Bed / Dx1, Dx2 / dr. X, Sp.Y (DPJP SP) / MRS DD/MM / KONSUL SP TGL / PINDAHAN A→B / STATUS
```

**Contoh lengkap:**
```
Ny. Lanita / 71 th / Kemuning 3D / DOC, Tumor Liver, Pneumonia / dr. Zain, Sp.PD, dr. Mulyati, Sp.P (DPJP IPD) / MRS 09/03 / KONSUL PARU 09/03 / PINDAHAN HCU-ICU / KRS
```

| Segmen | Contoh | Keterangan |
|--------|--------|-----------|
| Nama | `Ny. Lanita` | Tn./Ny. otomatis detect JK |
| Usia | `71 th` | dalam tahun |
| Lokasi | `Kemuning 3D` | nama ruangan + kode bed |
| Diagnosis | `TB Paru, DM` | koma = sekunder |
| DPJP | `dr. X, Sp.P (DPJP PARU)` | tag (DPJP SP) wajib untuk mark DPJP |
| MRS | `MRS 09/03` atau `OB 09/03` | format DD/MM atau DD/MM/YYYY |
| Konsul | `KONSUL PARU 09/03` | bisa banyak |
| Pindahan | `PINDAHAN HCU-ICU` | trail pindahan |
| Status | `KRS` / `MENINGGAL` / `LEPAS RAWAT` | akhir segmen |

---

## Format Batch (Laporan Operan)

App mengenali **4 format laporan WA** secara otomatis:

### Format A — KONRU IPD (Emoji Dokter)
```
📌 *KRISAN (7 PASIEN)*
🍎 Tn. Budi / 55 th / 3A / HF dd + AKI / dr. Ferdi, Sp.JP / MRS 01/03
🐠 Ny. Siti / 61 th / 2B / TB Paru / dr. Deden, Sp.P / MRS 05/03
```

### Format B — Numbered Simple
```
*KRISAN : 2 PASIEN*
1. Tn. Budi / 55 th / 3A / HF / dr. X (OB 01/03) 🔥
2. Ny. Siti / 61 th / 2B / TB Paru / dr. Y
```
*Emoji 🔥 di akhir = status kritis.*

### Format C — Stase Paru / Penyakit Dalam
```
*KEMUNING (7 pasien)*
1. Tn. Budi/55 th/Kemuning 3H/TB Paru/dr. Deden, Sp.P (DPJP PARU) MRS 10/03/2026 KONSUL PARU 09/03
*PASIEN KRS (2 pasien)*
2. Ny. Siti/...
```

### Format D — ObGyn Kelas-based
```
*Matahari (9 pasien)*
Kelas 1 (1 pasien)
1. 🔴Ny. Ratna/30/VK-3/G2P1A0 37w/dr. Budi, Sp.OG
```

### Groq AI Fallback
Jika format tidak dikenal, klik **✦ Groq + Parse**.

> **Catatan:** Parser mendukung ruangan custom yang ditambahkan melalui Pengaturan — tidak hanya ruangan default.

---

## Groq AI Integration

WardOS v2 menggunakan [Groq API](https://console.groq.com) (gratis) untuk:

| Fitur | Fungsi |
|-------|--------|
| Parse Single | Teks bebas apapun → data pasien terstruktur |
| Parse Batch | Laporan format tidak dikenal → semua pasien diekstrak |
| Ekstrak CPPT | Catatan perkembangan → TTV, lab, terapi |
| **AI Harian** | Analisis klinis + rekomendasi manajemen hari ini |
| **Discharge Summary** | Draft surat ringkasan pulang otomatis |

**Setup:**
1. Daftar gratis di [console.groq.com](https://console.groq.com)
2. Buat API Key baru
3. Buka WardOS → Pengaturan → Groq AI → paste key → Simpan
4. Model default: `llama-3.1-8b-instant`

**Model yang tersedia:**

| Model | Kecepatan | Akurasi | Cocok untuk |
|-------|-----------|---------|-------------|
| `llama-3.1-8b-instant` | ⚡ Sangat cepat | ★★★☆ | Parse batch, ekstrak cepat (default) |
| `llama-3.3-70b-versatile` | 🐌 Sedang | ★★★★★ | Discharge summary, rekomendasi klinis |
| `mixtral-8x7b-32768` | ⚡ Cepat | ★★★★☆ | Teks panjang |

> Tips: Ganti model ke `llama-3.3-70b-versatile` di Pengaturan saat butuh akurasi lebih tinggi untuk fitur AI klinis.

---

## Struktur Folder

```
WardOS-v2/
├── index.html                ← Buka file ini di browser
├── css/
│   └── style.css             ← Design system (variabel, komponen, layout)
├── js/
│   ├── data.js               ← Model data, localStorage, helpers foto lab
│   ├── parser.js             ← Slash parser + 4 format batch parser (dinamis)
│   ├── groq.js               ← Groq AI (parse, ekstrak, AI harian, discharge)
│   ├── ui.js                 ← Sidebar, toast, LOS counter, shared helpers
│   ├── modal.js              ← Modal detail, form, foto lab, AI panel, QR
│   ├── settings.js           ← Panel pengaturan ruangan & konfigurasi
│   ├── app.js                ← Router, init, export/import handler
│   ├── qr.js                 ← QR code export & import (kamera + upload)
│   └── views/
│       ├── dashboard.js      ← Dashboard (stat, filter, patient list + LOS)
│       ├── input.js          ← Input view (single + batch mode)
│       ├── peta.js           ← Peta Ruangan (mini-bed grid)
│       └── room.js           ← Room view (bed grid per kamar)
└── README.md
```

---

## Deploy ke GitHub Pages

```bash
# 1. Masuk ke folder project
cd path/to/WardOS-v2

# 2. Inisialisasi Git (jika belum)
git init
git branch -M main

# 3. Add & Commit semua file
git add .
git commit -m "WardOS v2 — initial deploy"

# 4. Buat repo baru di github.com lalu:
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

**Aktifkan GitHub Pages:**
1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` · Folder: `/ (root)`
4. Save → tunggu 1–3 menit
5. Akses: `https://USERNAME.github.io/REPO/`

**Update setelah perubahan:**
```bash
git add .
git commit -m "Update: deskripsi perubahan"
git push
```

> ⚠️ Fitur kamera QR membutuhkan HTTPS. GitHub Pages otomatis HTTPS — tidak perlu konfigurasi tambahan.

---

## Storage & Backup

Data disimpan di **`localStorage`** browser dengan key `wardos_v1`.

| Item | Detail |
|------|--------|
| Kapasitas | ~5 MB per browser |
| Foto lab | Otomatis dikompres ke <250KB per foto |
| Portabel | Tidak — data terikat browser + device |
| Tersinkron | Tidak — setiap device punya data sendiri |

### Export / Import JSON
- **Export**: Sidebar → 📤 **Export JSON** → file `wardos_backup_YYYY-MM-DD.json`
- **Import**: Sidebar → 📥 **Import JSON** → pilih file backup
- **QR**: Sidebar → 📷 **Import via QR** → untuk transfer pasien satu per satu

> Foto lab ikut ter-export dalam file JSON. Ukuran file backup akan lebih besar jika banyak foto.

### Tips Kelola Storage
- Cek indikator storage di modal **🖼 Foto Lab**
- Hapus foto lama yang tidak diperlukan secara berkala
- Export JSON secara rutin sebagai backup harian

---

## Pengaturan

Buka via Sidebar → **⚙️ Pengaturan**

| Pengaturan | Keterangan |
|-----------|-----------|
| Nama Rumah Sakit | Tampil di sidebar |
| Nama Koas | Untuk identitas |
| Groq API Key | Untuk fitur AI parse & klinis |
| Groq Model | Ketik nama model (default: `llama-3.1-8b-instant`) |
| Konfigurasi Ruangan | Ubah nama, warna, icon · Tambah/hapus ruangan |
| Konfigurasi Bed | Edit nama bed per ruangan |
| Hapus Semua Pasien | Reset data pasien, konfigurasi tetap |
| Reset Total | Hapus semua data + konfigurasi |

---

## Ruangan Default

| Ruangan | Warna | Bed |
|---------|-------|-----|
| Amarilis | 🟡 Amber | 16 bed (4 kamar × 4) |
| Edelweis A | 🔵 Blue | 12 bed (3 kamar × 4) |
| Edelweis B | 🔵 Light Blue | 9 bed (RK, ISO, Kamar 2–3) |
| VIP / Tulip / Vinolia | 🟠 Orange | 8 bed |
| CVCU | 🔴 Red | 6 bed |
| HCU | 🩷 Pink | 10 bed (HCU + RICU) |
| ICU | 🔴 Dark Red | 10 bed (ICU + ISO + IW IGD) |
| Krisan | 🟢 Green | 16 bed (4 kamar × 4) |
| Kemuning | 🔵 Cyan | 16 bed (3 kamar, Kamar 3 = 8 bed) |
| Dahlia | 🟣 Purple | 12 bed (3 kamar × 4) |

Ruangan custom bisa ditambahkan via Pengaturan dan akan otomatis dikenali oleh parser batch.

---

## Tech Stack

- **HTML5** + **CSS3 (Vanilla)** + **JavaScript ES6+ (Vanilla)**
- **Google Fonts** — IBM Plex Sans + IBM Plex Mono
- **Groq API** — LLM inference (opsional, untuk AI parse & klinis)
- **QRCode.js** + **jsQR** — generate & scan QR code (CDN)
- **Canvas API** — kompresi foto lab di browser
- **localStorage** — data persistence (pasien + foto)
- **Web Camera API** — scan QR via kamera
- **GitHub Pages** — hosting gratis

Tidak ada framework. Tidak ada build step. Tidak ada Node.js.

---

## Changelog

### v2.1 (Update ini)
**Bug Fixes:**
- Fix `getTodayStr()` pakai UTC → sekarang local time (tidak lagi salah tanggal di timezone Indonesia)
- Fix duplikasi `todayDateStr()` dengan implementasi berbeda
- Unifikasi logika "Masuk Hari Ini" — konsisten di stat card, filter pill, dan today tag
- Fix "KRS Hari Ini" di stat card menggunakan `tglKRS` (bukan `updatedAt`)
- Fix parser batch — fallback bed ID tidak lagi menangkap singkatan diagnosis (TB, DM, AKI, HF)
- Fix monkey-patching global function pakai `try-finally` — fungsi asli selalu di-restore
- Fix field name salah di batch resolve: `laborat`→`lab`, `terapiUtama`→`terapi`
- Tambah CSS class `form-modal-box` yang hilang
- Fix `getMiniBeClass()` — return `'stabil'` bukan `'occ'` (dead code)

**Code Quality:**
- Hapus circular dependency `input.js` ↔ `modal.js` → callback pattern
- `ROOM_ALIASES` parser sekarang dinamis dari `getData().rooms` (custom room dikenali)
- Standarisasi default Groq model ke `llama-3.1-8b-instant`
- Hapus dead code `.mb.occ` dari CSS

**Fitur Baru:**
- 📅 Length of Stay (LOS) Counter dengan badge warna adaptif
- ✦ AI Rekomendasi Manajemen Harian (Groq)
- ✦ Discharge Summary Generator (Groq)
- 📱 Sinkronisasi via QR Code (export + import + kamera scan)
- 🖼 Upload & Kelola Foto Hasil Lab (kompresi otomatis, lightbox, download)

---

## Lisensi

MIT — Bebas digunakan dan dimodifikasi untuk keperluan pendidikan kedokteran.

---

*WardOS v2 · · Built with ❤️ untuk ko-ass*
