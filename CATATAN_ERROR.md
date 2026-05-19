## BUG: Thumbnail Hanya Terlihat Owner (18 Mei 2026)
**Gejala:** Semua pesan dengan `externalAdReply.thumbnail` (.menu, .help, levelup, .song) hanya terlihat oleh owner. User lain tidak melihat pesan sama sekali — bahkan di chat pribadi.

**Penyebab:** WhatsApp **server-side change** sekitar 9-18 Mei 2026. Meta/WhatsApp nge-patch celah `externalAdReply.showAdAttribution: false` yang selama ini dipake bot. Sekarang SEMUA bentuk `contextInfo.externalAdReply` difilter server-side untuk non-owner.

**Yang udah di-test & gagal:**
- `showAdAttribution: false/true/omit` — ❌
- Random signature di thumbnail bytes — ❌
- `thumbnailUrl` (gambar publik) — ❌
- `renderLargerThumbnail` — ❌
- `forwardingScore`/`isForwarded` — ❌
- Minimal externalAdReply (title doang) — ❌
- Baileys downgrade 7.x → 6.7.21 — ❌
- Link preview → ✅ delivery, ❌ thumbnail kecil di mobile, ❌ ga muncul di desktop

**Solusi FINAL:** Ganti ke **Image Message** (`imageMessage` + `caption`).
- ✅ Thumbnail BESAR (full-width di chat)
- ✅ Caption teks (menu, help, dll)
- ✅ Visible semua user (owner & non-owner)
- ✅ WhatsApp auto-tampil di chat (gak perlu tap)
- ✅ Gambar cuma di cache chat, bukan di galeri (kecuali user tap download)

**Khusus menu:** Rasio 19:6 (1140x360) pakai sharp resize.
**Help & levelup:** Resize width 1140, aspect ratio original.

**File final:**
- `commands/main/menu.js` — image, rasio 19:6
- `commands/main/help.js` — image, resize 1140 width
- `main.js` (levelup) — image, resize 1140 width
- `commands/debug/debuglevelup.js` — image, resize 1140 width
- `commands/search/song.js` — text + link preview + audio (link preview masih dipake karena audio)

**Catatan:** externalAdReply sekarang **tidak bisa dipake** untuk bot WhatsApp biasa. Meta nutup celah ini permanen server-side.
