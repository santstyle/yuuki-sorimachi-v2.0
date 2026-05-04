const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function menuCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const menuText = `*YUUKI BOT MENU*

- *General*
.sewa - Sewa bot ke grup
.ceksewa - Cek sisa durasi sewa
.menu - Menampilkan daftar ini
.ping - Cek kecepatan bot
.alive - Status aktif bot
.owner - Kontak pemilik bot
.groupinfo - Info detail grup
.staff - Daftar admin grup
.startabsen - Mulai sesi absen
.joke - Cerita lucu acak
.meme - Gambar meme lucu
.quote - Kata-kata bijak
.fact - Fakta unik dunia
.news - Berita terkini
.weather - Cek cuaca kota

- *Games*
.tebakkata - Main tebak-tebakan

- *Image & Sticker*
.sticker - Gambar jadi stiker
.crop - Stiker tanpa kotak
.toimage - Stiker jadi gambar
.tovideo - Stiker jadi video
.tgsticker - Stiker Telegram
.setwm - Ganti nama stiker

- *Search & Downloader*
.lyrics - Cari lirik lagu
.song - Download lagu audio
.play - Cari & putar lagu
.download / .dl - Unduh Video/Foto (YT, TT, IG, FB)

- *Admin*
.antitag - Larang tag massal
.welcome - Sambutan member baru
.goodbye - Salam perpisahan
.ban - Blokir user dari bot
.mute - Matikan chat grup
.kick - Keluarkan member
.warnings - Cek poin peringatan
.warn - Beri poin peringatan
.tag - Beri tag ke pesan
.unmute - Aktifkan chat grup
.delete - Hapus pesan bot
.antilink - Larang kirim link
.antibadword - Larang kata kasar
.clear - Bersihkan pesan
.tagall - Tag semua member
.hidetag - Tag tanpa terlihat
.resetlink - Ganti link grup
.chatbot - Aktifkan AI chat

Powered by SantStyle`;

    try {
        const profilesDir = path.join(__dirname, '../assets/profiles');
        let thumbBuffer = Buffer.alloc(0);
        
        if (fs.existsSync(profilesDir)) {
            const files = fs.readdirSync(profilesDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                thumbBuffer = fs.readFileSync(path.join(profilesDir, randomFile));
            }
        }

        await sock.sendMessage(chatId, {
            text: menuText,
            contextInfo: {
                externalAdReply: {
                    title: "Yuuki Sorimachi | Whatsapp Bot",
                    body: `Hai ${pushName}, Senang bertemu denganmu!`,
                    mediaType: 1,
                    thumbnail: thumbBuffer,
                    renderLargerThumbnail: true,
                    showAdAttribution: true,
                    sourceUrl: `https://wa.me/${botNumber}`
                }
            }
        }, { quoted: message });

    } catch (e) {
        console.error('Menu error:', e);
        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }
}

module.exports = menuCommand;
