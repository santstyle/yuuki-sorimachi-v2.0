<h1 align="center">Yuuki Sorimachi - WhatsApp Bot</h1>

<p align="center">
  <strong>Multi-purpose WhatsApp Bot</strong> built with Node.js + Baileys.<br>
  Group management, media downloader, AI chat, and more.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma&logoColor=white">
  <img src="https://img.shields.io/badge/License-MIT-yellow">
</p>

---

## Daftar Isi

- [Fitur](#fitur)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi di VPS Ubuntu](#instalasi-di-vps-ubuntu)
- [Konfigurasi](#konfigurasi)
- [Setup Session WhatsApp](#setup-session-whatsapp)
- [Update Bot](#update-bot)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

---

## Fitur

| Kategori | Fitur |
|----------|-------|
| Grup | Kick, ban, warn, mute, tagall, hidetag, antilink, antibadword, antitag, welcome/goodbye, absen, groupinfo, resetlink, staff |
| Downloader | YouTube (video/audio), TikTok, Instagram, Facebook, Twitter, dll (via btch-downloader & yt-dlp) |
| Media | Stiker (gambar/video/gif/gabung), toimage, tovideo, toaudio, tomp3, togif, removebg, remini/enhance |
| AI Chat | Yuuki (built-in character), Groq AI, DeepSeek, OpenAI GPT, obrolan natural |
| Informasi | Cuaca, berita, meme, joke, quotes, facts, lirik lagu, pencarian lagu |
| Tools | Translate, screenshot web, setwm (sticker watermark), ssweb |
| Owner | Broadcast, mode public/private, antidelete, autostatus, setpp, sudo, update, cleanup, sewa grup |
| Leveling | XP & level system, level-up announcement, leaderboard |
| Database | SQLite via Prisma ORM - semua data user, grup, XP, warning, history tersimpan rapi |

---

## Persyaratan Sistem

| Komponen | Minimal | Rekomendasi |
|----------|---------|-------------|
| OS | Ubuntu 20.04 | Ubuntu 22.04 / 24.04 |
| Node.js | 18.x | 20.x LTS |
| RAM | 1 GB | 2 GB+ |
| Storage | 1 GB | 2 GB+ |
| Lainnya | FFmpeg, Git, PM2, yt-dlp | Chromium (untuk fitur screenshot & Pinterest) |

---

## Instalasi di VPS Ubuntu

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Git

```bash
sudo apt install git -y
git --version
```

Output harus seperti `git version 2.x.x`.

### 3. Install Puppeteer / Chromium Dependencies

Puppeteer digunakan untuk fitur screenshot web (`.ss`) dan pencarian Pinterest (`.pinterest`). Install library pendukung Chromium:

```bash
sudo apt install -y libnss3 libnspr4 libgbm1 libasound2 libatk1.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libatk-bridge2.0-0
```

> Jika skip langkah ini, fitur `.ss` dan `.pinterest` bisa gagal dengan error `Missing shared libraries`.

### 4. Install Node.js 20.x LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

Output `node` harus `v20.x.x`, output `npm` harus `10.x.x` atau lebih baru.

### 5. Install PM2

PM2 digunakan untuk menjalankan bot di background dan auto-restart jika crash atau VPS reboot.

```bash
npm install -g pm2
pm2 --version
```

Output harus menampilkan versi PM2.

### 6. Clone Repository

```bash
git clone https://github.com/santstyle/yuukibot-v2.0.git
cd yuukibot-v2.0
```

### 7. Install FFmpeg

FFmpeg diperlukan untuk konversi stiker, video, audio, dan pemrosesan media lainnya.

```bash
sudo apt install ffmpeg -y
ffmpeg -version
```

Output harus menampilkan versi FFmpeg.

> **Catatan VPS:** Bot akan otomatis mendeteksi FFmpeg dari system PATH. Jika ada file `ffmpeg/bin/ffmpeg.exe` di folder bot (sisa dari Windows), file itu hanya dipakai di Windows. Di Linux, system `ffmpeg` akan digunakan.

### 8. Install yt-dlp

yt-dlp diperlukan untuk mendownload video/audio dari YouTube dan berbagai platform lain.

**Di Linux VPS**, install via pip atau binary:

```bash
# Opsi 1: via pip
sudo apt install python3 python3-pip -y
pip3 install yt-dlp
yt-dlp --version

# Opsi 2: via binary langsung
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
yt-dlp --version
```

Output harus menampilkan versi yt-dlp.

> **Penting:** Di Windows bot menggunakan `yt-dlp.exe` dari folder project. Di Linux, pastikan `yt-dlp` tersedia di system PATH (via pip atau binary di `/usr/local/bin/yt-dlp`). Bot otomatis fallback ke system `yt-dlp` jika `yt-dlp.exe` tidak ditemukan.

### 9. Install Project Dependencies

```bash
npm install
```

> Jika ada error peer dependency, gunakan:
> ```bash
> npm install --legacy-peer-deps
> ```

### 9a. Download Model Remove Background (Opsional)

Model AI lokal untuk fitur `.removebg` / `.rmbg` / `.nobg` tanpa API key. Ukuran ~80MB, didownload otomatis saat pertama kali menjalankan perintah.

Atau download manual:

```bash
# Buat folder model
mkdir -p node_modules/@imgly/background-removal-node/resources/model

# Download model medium
curl -L https://github.com/imgly/background-removal-js/releases/download/v1.4.0/model-medium.onnx -o node_modules/@imgly/background-removal-node/resources/model/model-medium.onnx
```

### 10. Setup Environment Variables

```bash
nano .env
```

Isi minimal yang wajib:

```env
OWNER_NUMBER=62812xxxxxxx       # Nomor HP owner (pakai kode negara, tanpa +)
BOT_NUMBER=62889xxxxxxx         # Nomor HP bot
OWNER_LID=18684xxxxxxxx         # LID owner (bisa dikosongkan dulu, nanti terisi otomatis)
DATABASE_URL="file:./prisma/database.db"  # Wajib untuk Prisma/SQLite
```

API key opsional (kosongi jika tidak butuh fitur terkait):

```env
GROQ_API_KEY=your_key_here      # Groq AI (Llama-3.3-70b) — untuk Yuuki AI & .groq
DEEPSEEK_API_KEY=your_key_here  # DeepSeek AI — untuk .deepseek
OPENAI_API_KEY=your_key_here    # OpenAI GPT — untuk .gpt
GIPHY_API_KEY=your_key_here     # Giphy (opsional, untuk sticker/GIF)
REMBG_API_KEY=your_key_here     # rembg.com (gratis, untuk .removebg)
REMOVEBG_API_KEY=your_key_here  # remove.bg (fallback, untuk .removebg)
```

Simpan file dengan `Ctrl + X`, tekan `Y`, lalu `Enter`.

### 11. Database

#### Opsi A: Fresh Install (Database Baru Kosong)

```bash
npx prisma generate
npx prisma db push
```

> Perintah ini akan membuat file `prisma/database.db` (SQLite) dan semua tabel yang dibutuhkan.

#### Opsi B: Migrasi Database dari Lokal ke VPS

Jika kamu sudah punya file `database.db` dari instalasi sebelumnya (lokal/server lain) dan ingin memindahkannya:

```bash
# Clone repo & install dependencies dulu (step 1-9)
npx prisma generate
```

Kemudian copy file `database.db` dari lokal ke folder `prisma/` di VPS:
```bash
# Contoh cara copy dari lokal ke VPS via SCP (jalankan dari terminal lokal, bukan VPS):
# scp prisma/database.db user@ip-vps:~/yuukibot-v2.0/prisma/database.db
```

Atau upload manual via SFTP/FileZilla ke `prisma/database.db`.

> **Catatan:** Kalau pakai database existing, cukup `npx prisma generate` aja — **tidak perlu** `npx prisma db push` karena struktur tabel sudah ada di file database.

### 12. Setup Session WhatsApp

Jalankan bot untuk scan QR:

```bash
npm start
```

1. Akan muncul QR code di terminal
2. Buka WhatsApp > 3 titik > **Perangkat Tertaut** > **Tautkan Perangkat**
3. Scan QR code
4. Tunggu hingga muncul pesan `Bot connected successfully!`
5. Tekan `Ctrl + C` untuk stop

> Folder session akan tersimpan di `./session/`. Backup folder ini jika perlu.

### 13. Jalankan Bot dengan PM2

```bash
pm2 start ecosystem.config.js
```

> **Penting:** File `ecosystem.config.js` memiliki `cwd` (working directory) yang default ke `__dirname`. Jika bot di-clone ke path lain (misal `~/yuukibot-v2.0`), **tidak perlu diubah** karena `__dirname` otomatis sesuai. Namun jika pindah folder setelah clone, update `cwd` manual.

Simpan daftar proses PM2 agar aktif terus:

```bash
pm2 save
```

Aktifkan auto-start saat VPS reboot:

```bash
pm2 startup
```

Ikuti perintah yang muncul di terminal (biasanya `sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER`).

### 14. Verifikasi

```bash
pm2 list
```

Pastikan status bot **online**.

Cek log untuk memastikan tidak ada error:

```bash
pm2 logs yuuki-bot --lines 20
```

Kirim pesan `.ping` ke nomor bot — harus reply `Pong!`.

---

## Konfigurasi

### File `.env`

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `OWNER_NUMBER` | Ya | Nomor HP owner (628xxx) |
| `BOT_NUMBER` | Ya | Nomor HP bot |
| `OWNER_LID` | Tidak | LID owner (untuk WhatsApp baru) |
| `DATABASE_URL` | Ya | URL database SQLite (`file:./prisma/database.db`) |
| `GROQ_API_KEY` | Tidak | Untuk fitur `.groq` (LLaMA-3.3-70b) |
| `DEEPSEEK_API_KEY` | Tidak | Untuk fitur `.deepseek` |
| `OPENAI_API_KEY` | Tidak | Untuk fitur `.gpt` |
| `REMBG_API_KEY` | Tidak | API key rembg.com (gratis, untuk `.removebg`). Dapatkan di https://www.rembg.com/api-usage |
| `REMOVEBG_API_KEY` | Tidak | API key remove.bg (fallback jika rembg gagal). Dapatkan di https://www.remove.bg/ |
| `GIPHY_API_KEY` | Tidak | API key Giphy untuk sticker/GIF |
| `FAPIHUB_API_KEY` | Tidak | API key FapiHub |
| `XTEAM_API_KEY` | Tidak | API key xteam.xyz |
| `LOLHUMAN_API_KEY` | Tidak | API key lolhuman.xyz |
| `[NAMA_API]_API_KEY` | Tidak | API key untuk API eksternal lain (lihat `config.js` untuk daftar lengkap) |

### File `settings.js`

```js
{
  packname: 'Yuuki Sorimachi | Bot',  // Nama pack sticker
  wm: '',                             // Watermark sticker (kosongkan jika tidak perlu)
  botName: "Yuuki Sorimachi | Bot",
  botOwner: 'SantStyle',              // Nama kamu
  commandMode: "public",              // "public" atau "private"
  maxStoreMessages: 20,               // Max pesan disimpan di memory
  storeWriteInterval: 10000,          // Interval simpan store (ms)
  description: "-",                   // Deskripsi bot
  version: "2.0.0",                   // Versi bot (sesuai package.json)
  removebgApiKey: '',                 // API key remove.bg (opsional, local AI sbg fallback)
}
```

### File `prisma/schema.prisma`

Database SQLite dengan model:

- **User** - Data pengguna & status banned
- **UserProgress** - XP & level
- **Group** - Data grup & masa sewa
- **GroupSettings** - Antilink, antibadword, welcome, goodbye, dll
- **WarningRecord** - Riwayat peringatan
- **History** - Log command yang dijalankan

---

## Setup Session WhatsApp

### Session Hilang / Expired

```bash
pm2 stop yuuki-bot
rm -rf session
pm2 start yuuki-bot
# Scan QR lagi
```

### Backup Session

```bash
cp -r session session-backup-$(date +%Y%m%d)
```

### Restore Session

```bash
pm2 stop yuuki-bot
rm -rf session
cp -r session-backup-20250101 session
pm2 start yuuki-bot
```

---

## Update Bot

```bash
# Masuk ke directory bot
cd ~/yuukibot-v2.0

# Backup data
cp -r session session-backup
cp .env .env-backup

# Pull update & install
git pull origin main
npm install

# Update database jika ada perubahan schema
npx prisma generate
npx prisma db push

# Restart bot
pm2 restart yuuki-bot
```

> Catatan: Selalu backup `session/` dan `.env` sebelum update!

---

## Troubleshooting

### Bot Tidak Bisa Connect

```bash
# Cek log error
pm2 logs yuuki-bot --lines 50

# Pastikan session masih valid
ls -la session/creds.json

# Hapus session & scan ulang
pm2 stop yuuki-bot
rm -rf session
pm2 start yuuki-bot
```

### QR Code Tidak Muncul

```bash
rm -rf session
npm start   # Harus muncul QR
```

### FFmpeg Error

```bash
which ffmpeg || sudo apt install ffmpeg -y
ffmpeg -version
```

### yt-dlp Error

```bash
pip3 install --upgrade yt-dlp
yt-dlp --version
```

### Prisma / Database Error

```bash
npx prisma generate
npx prisma db push
```

### Permission Denied

```bash
sudo chown -R $(whoami):$(whoami) ~/yuukibot-v2.0
chmod -R 755 ~/yuukibot-v2.0
```

### RAM Usage Tinggi

Cek monitoring:
```bash
pm2 monit
pm2 show yuuki-bot
```

Restart jika perlu:
```bash
pm2 restart yuuki-bot
```

---

## NPM Scripts

| Script | Perintah | Kegunaan |
|--------|----------|----------|
| `start` | `npm start` | Jalankan bot (memory limit 4GB) |
| `start:optimized` | `npm run start:optimized` | Jalankan dengan optimasi memori |
| `start:clean` | `npm run start:clean` | Cleanup tmp + start optimized |
| `start:fresh` | `npm run start:fresh` | Reset session + start ulang |
| `cleanup` | `npm run cleanup` | Bersihkan file temporary |
| `reset-session` | `npm run reset-session` | Hapus folder session |
| `install:panel` | `npm run install:panel` | Install ulang dependencies (--legacy-peer-deps) |
| `install:force` | `npm run install:force` | Install ulang dependencies (--force) |

---

## Lisensi

Proyek ini menggunakan lisensi **MIT**.

```
MIT License

Copyright (c) 2024 SantStyle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

---

<p align="center">
  <a href="https://github.com/santstyle/yuukibot-v2.0">GitHub Repository</a>
</p>
