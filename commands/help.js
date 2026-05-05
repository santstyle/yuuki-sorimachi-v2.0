const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const helpText = `*Commands Information*

- *Admin*
.ceksewa - Check group rental status (Admin only).
.antitag - Mencegah user melakukan tag massal/hidetag.
.welcome - Mengaktifkan/menonaktifkan pesan sambutan member baru.
.goodbye - Mengaktifkan/menonaktifkan pesan perpisahan member.
.ban - Memblokir user agar tidak bisa menggunakan fitur bot.
.mute - Mematikan fitur chat di dalam grup (khusus admin).
.kick - Mengeluarkan member dari grup secara otomatis.
.warnings - Melihat total poin peringatan (warn) yang dimiliki user.
.warn - Memberikan poin peringatan kepada member yang melanggar.
.tag - Menambahkan tag khusus pada pesan tertentu.
.unmute - Mengaktifkan kembali fitur chat di dalam grup.
.delete - Menghapus pesan yang dikirim oleh bot atau member lain.
.antilink - Mencegah user mengirim link grup/undangan lain.
.antibadword - Sensor otomatis untuk kata-kata kasar/toxic.
.clear - Menghapus log chat atau membersihkan pesan lama.
.tagall - Melakukan tag ke seluruh member grup sekaligus.
.hidetag - Mengirim pesan tag ke semua member tanpa terlihat.
.resetlink - Mereset atau memperbarui link undangan grup.
.chatbot - Mengaktifkan mode AI chat otomatis di grup.

- *General*
.menu - Menampilkan daftar menu simple tanpa keterangan.
.ping - Menampilkan kecepatan respon bot (latency).
.alive - Memeriksa apakah bot sedang aktif atau sedang maintenance.
.owner - Menampilkan kontak resmi pemilik bot (developer).
.groupinfo - Menampilkan informasi lengkap mengenai grup ini.
.staff - Menampilkan daftar admin dan staff grup saat ini.
.startabsen - Memulai sesi absensi otomatis untuk member.
.joke - Menampilkan cerita lucu atau humor acak.
.meme - Mengambil gambar meme lucu dari internet secara acak.
.quote - Menampilkan kata-kata bijak atau motivasi pilihan.
.fact - Memberikan fakta-fakta unik dan menarik di dunia.
.news - Menampilkan berita terbaru dan terhangat hari ini.
.weather - Mengecek kondisi cuaca di kota yang ditentukan.

- *Image & Sticker*
.sticker - Mengubah gambar atau video menjadi stiker WhatsApp.
.setwm - Mengatur nama paket stiker and author (Watermark).
.toimage - Mengubah stiker kembali menjadi format gambar biasa.
.tovideo - Mengubah stiker bergerak menjadi format video.

- *Search & Downloader*
.lyrics - Mencari lirik lagu berdasarkan judul atau penyanyi.
.song - Mendownload lagu dalam format audio (mp3).
.play - Mencari dan memutar lagu langsung dari YouTube/Spotify.
.download / .dl - Fitur all-in-one downloader (YouTube, TikTok, IG, FB).

Powered by SantStyle`;

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