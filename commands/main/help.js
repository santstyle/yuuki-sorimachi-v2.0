const settings = require('../../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const helpText = `List Information Yuuki


┌──「 MAIN 」
│ > .menu            → Tampilkan daftar command
│ > .ping            → Cek kecepatan respon bot
│ > .alive           → Cek status bot aktif/maintenance
│ > .owner           → Kontak pemilik bot
│ > .help            → Tampilkan bantuan ini
│ > .del             → Hapus pesan bot
│   alias: .delete
│ > .clear           → Bersihkan log chat
│ > .tag             → Tambah tag khusus pada pesan
│ > .mylevel         → Cek level & XP kamu
└───────────────────────────

┌──「 GROUP 」
│ > .antilink        → Blokir link grup lain
│ > .antitag         → Blokir tag massal/hidetag
│ > .antibadword     → Sensor kata kasar otomatis
│ > .welcome         → Toggle pesan welcome member baru
│ > .goodbye         → Toggle pesan perpisahan member
│ > .ban @user       → Blokir user dari bot
│ > .mute / .unmute  → Matikan/aktifkan chat di grup
│ > .kick @user      → Keluarkan member dari grup
│ > .warn @user      → Beri peringatan ke member
│ > .warnings @user  → Cek total warn member
│ > .tagall          → Tag semua member sekaligus
│ > .hidetag teks    → Tag semua tanpa notifikasi
│ > .resetlink       → Reset link undangan grup
│ > .groupinfo       → Info lengkap grup ini
│ > .groupset        → Pengaturan grup
│ > .ceksewa         → Cek status sewa grup
│ > .staff           → Daftar admin & staff grup
│ > .absen           → Mulai sesi absensi
└───────────────────────────

┌──「 CHATBOT 」
│ > .chatbot         → Ngobrol langsung sama Yuuki (mention/sebut nama)
└───────────────────────────

┌──「 AI CHAT 」
│ > .groq <teks>    → Chat dengan Groq AI
│                      Contoh: .groq apa itu AI?
│                      Ketik .groq reset untuk reset riwayat
│ > .deepseek <teks>→ Chat dengan DeepSeek AI
│                      Contoh: .deepseek jelaskan Machine Learning
│ > .gpt <teks>     → Chat dengan GPT (OpenAI)
│                      Contoh: .gpt apa itu AI?
└───────────────────────────

┌──「 CONVERTER 」
│ > .sticker         → Gambar/video ke stiker (reply/kirim gambar)
│   alias: .s
│ > .setwm <author>  → Set author & paket stiker
│ > .toimage         → Stiker ke gambar (reply stiker)
│   alias: .toimg
│ > .tovideo         → Stiker bergerak ke video (reply stiker)
│   alias: .tovid
│ > .togif           → Stiker bergerak ke GIF (reply stiker)
│   alias: .tgif
│ > .tomp3           → Video/audio ke MP3 (reply video)
│   alias: .toaud
│ > .stickercrop     → Crop stiker ke bentuk lain
│   alias: .scrop
└───────────────────────────

┌──「 DOWNLOADER 」
│ > .song <judul>    → Download lagu (audio/mp3)
│                      Contoh: .song Bohemian Rhapsody
│ > .play <judul>    → Cari & putar lagu dari YouTube/Spotify
│                      Contoh: .play Shape of You
│ > .lyrics <judul>  → Cari lirik lagu
│                      Contoh: .lyrics Perfect Ed Sheeran
│ > .dl / .download  → Download dari link media
│   alias: .btch
│                      Support: YouTube, Instagram, TikTok,
│                      Facebook, Spotify, Pinterest, dll.
│                      Contoh: .dl https://youtube.com/watch?v=xxxx
└───────────────────────────

┌──「 INFORMATION 」
│ > .joke            → Cerita lucu random
│ > .meme            → Meme random dari internet
│ > .quote           → Kata-kata bijak / motivasi
│ > .fact            → Fakta unik dunia
│ > .news            → Berita terbaru hari ini
│ > .weather <kota>  → Cek cuaca, contoh: .weather Jakarta
│ > .groupinfo       → Info lengkap grup ini
└───────────────────────────

┌──「 SEARCH 」
│ > .pinterest       → Cari gambar dari Pinterest
│   alias: .pin
└───────────────────────────

┌──「 TOOL 」
│ > .translate       → Terjemahkan teks ke bahasa lain
│   alias: .trt
│ > .ss              → Screenshot website
│   alias: .ssweb, .screenshot
│ > .setwm <author>  → Set author & paket stiker
└───────────────────────────

╭───「 TIPS 」───
│ • Untuk sticker/reply, kirim gambar dulu lalu reply dengan command
│ • .dl / .btch otomatis deteksi platform dari link
╰───────────────────────────
> *Powered by SantStyle*`;

    try {
        const helpDir = path.join(__dirname, '../../assets/help');
        const helpImagePath = path.join(helpDir, 'helpyuuki.png');
        let thumbBuffer = null;

        if (fs.existsSync(helpImagePath)) {
            let buffer = fs.readFileSync(helpImagePath);
            buffer = Buffer.concat([buffer, Buffer.from(`\n#help_${Date.now()}`)]);
            if (buffer.length < 1000000) {
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
                    title: "Yuuki Sorimachi | WhatsApp Bot\u200B",
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
