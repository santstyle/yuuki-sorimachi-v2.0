# Yuuki Bot
Version:
- setting.js
- package.json
- package-lock.json
- README.md

Files containing "Yuuki Bot":
- settings.js
- session/creds.json
- README.md
- index.js
- lang/en.json
- lang/id.json
- commands/facebook.js
- commands/help.js
- commands/video.js
- commands/tiktok.js
- commands/ping.js
- commands/instagram.js
- commands/github.js
- baileys_store.json
  

## Next Update
- Screnshoot dari kata tidak hanya url
- TikTok `/photo/` post — library `btch-downloader` (`ttdl()`) gak support download gambar dari TikTok photo post, cuma balikin audio. Cari alternative scraper atau fallback.

## Feature Requests dari User
### Security & Anti-Features
1. **Anti mention/tag status grup** — Cegah user nge-tag bot/owner di status grup
2. **Anti link** — ✅ SUDAH ADA (`.antilink on|off|set <mode>|status`)
3. **Anti channel WhatsApp** — Cegah forward/pesan dari channel WhatsApp masuk ke grup
4. **Mute Grup (command restriction)** — Bot cuma bisa dipake owner & admin aja, member lain gabisa make bot. Beda sama mute grup bawaan yang cuma nutup chat.
5. **Bot Security (link + virtex/bug katalog)** — Khusus deteksi link mencurigakan dan virtex/bug katalog

## v2.0.1 — Bug Fixes
- **Leveling chat muncul pas grup di-mute** — Level-up announcement masih muncul walaupun grup udah di-mute. Harusnya pas grup di-mute, leveling message ikut di-skip.
- **Leaderboard nampilin JID user** — ✅ DIBENERIN. User tanpa nama pake `customId` internal.
- **Admin panel sorting level** — Sekarang secondary sort by `xp` biar urutannya sama kayak bot.
- **Admin panel bot status** — Indikator online/offline dinamis, ga hardcoded "Connected".
- **Nama grup di .join jadi "Grup"** — Pake `groupGetInviteInfo` sebelum accept invite.
- **Welcome message ilang pas di-approve admin** — Pake `inviteInfo.id` soalnya `groupAcceptInvite` return JID corrupt buat approval grup.
- **Warn error foreign key** — `addWarning` sekarang otomatis bikin `GroupSettings` dulu.
