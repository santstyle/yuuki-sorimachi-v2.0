const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const helpText = `List Information Yuuki


┌──「 ADMIN GROUP 」
│ > .ceksewa         → Cek status sewa grup
│ > .antitag         → Blokir tag massal/hidetag
│ > .welcome         → Toggle pesan welcome member baru
│ > .goodbye         → Toggle pesan perpisahan member
│ > .ban @user       → Blokir user dari bot
│ > .mute / .unmute  → Matikan/aktifkan chat di grup
│ > .kick @user      → Keluarkan member dari grup
│ > .warn @user      → Beri peringatan ke member
│ > .warnings @user  → Cek total warn member
│ > .tag teks        → Tambah tag khusus pada pesan
│ > .antilink        → Blokir link grup lain
│ > .antibadword     → Sensor kata kasar otomatis
│ > .clear           → Bersihkan log chat
│ > .tagall          → Tag semua member sekaligus
│ > .hidetag teks    → Tag semua tanpa notifikasi
│ > .resetlink       → Reset link undangan grup
│ > .chatbot         → Toggle AI chat otomatis
└───────────────────────────

┌──「 GENERAL 」
│ > .menu            → Tampilkan daftar command
│ > .ping            → Cek kecepatan respon bot
│ > .alive           → Cek status bot aktif/maintenance
│ > .owner           → Kontak pemilik bot
│ > .groupinfo       → Info lengkap grup ini
│ > .staff           → Daftar admin & staff grup
│ > .startabsen      → Mulai sesi absensi
│ > .mylevel         → Cek level & XP kamu
│ > .joke            → Cerita lucu random
│ > .meme            → Meme random dari internet
│ > .quote           → Kata-kata bijak / motivasi
│ > .fact            → Fakta unik dunia
│ > .news            → Berita terbaru hari ini
│ > .weather <kota>  → Cek cuaca, contoh: .weather Jakarta
└───────────────────────────

┌──「 IMAGE & STICKER 」
│ > .sticker         → Gambar/video ke stiker (reply/kirim gambar)
│ > .setwm <author>  → Set author & paket stiker
│ > .toimage         → Stiker ke gambar (reply stiker)
│ > .tovideo         → Stiker bergerak ke video (reply stiker)
└───────────────────────────

┌──「 SEARCH & DOWNLOADER 」
│ > .lyrics <judul>  → Cari lirik lagu
│                      Contoh: .lyrics Perfect Ed Sheeran
│ > .song <judul>    → Download lagu (audio/mp3)
│                      Contoh: .song Bohemian Rhapsody
│ > .play <judul>    → Cari & putar lagu dari YouTube/Spotify
│                      Contoh: .play Shape of You
│ > .download <url>  → Download dari link media
│   atau: .dl <url>
│                      Support: YouTube, Instagram, TikTok,
│                      Facebook, Spotify, Pinterest, dll.
│                      Contoh: .dl https://youtube.com/watch?v=xxxx
└───────────────────────────

╭───「 TIPS 」───
│ • Untuk sticker/reply, kirim gambar dulu lalu reply dengan command
│ • .dl otomatis deteksi platform dari link
╰───────────────────────────
> *Powered by SantStyle*`;

    try {
        const helpDir = path.join(__dirname, '../assets/help');
        const helpImagePath = path.join(helpDir, 'helpyuuki.png');
        let thumbBuffer = null;

        if (fs.existsSync(helpImagePath)) {
            let buffer = fs.readFileSync(helpImagePath);
            buffer = Buffer.concat([buffer, Buffer.from(`\n#help_${Date.now()}`)]);
            if (buffer.length < 1000000) { // Limit to 1MB
                thumbBuffer = buffer;
            } else {
                console.warn(`Help thumbnail is too large. Skipping.`);
            }
        } else {
            console.warn(`Help thumbnail file 'helpyuuki.png' not found in ${helpDir}`);
        }

        const messageOptions = { text: helpText };

        if (thumbBuffer) {
            messageOptions.contextInfo = {
                externalAdReply: {
                    title: "Yuuki Sorimachi | Whatsapp Bot\u200B",
                    body: `Hai ${pushName}, Kamu butuh bantuan?`,
                    mediaType: 1,
                    thumbnail: thumbBuffer,
                    renderLargerThumbnail: true,
                    showAdAttribution: true,
                    sourceUrl: `https://wa.me/${botNumber}?text=help`
                }
            };
        }

        await sock.sendMessage(chatId, messageOptions, { quoted: message });

    } catch (e) {
        console.error('Help command failure:', e);
        await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
    }
}

module.exports = helpCommand;