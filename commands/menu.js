const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');

async function menuCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const menuText = `*Daftar List Commands*

- *Admin*
.ceksewa
.antitag
.welcome
.goodbye
.ban
.mute
.kick
.warnings
.warn
.tag
.unmute
.delete
.antilink
.antibadword
.clear
.tagall
.hidetag
.resetlink
.chatbot

- *General*
.menu
.ping
.alive
.owner
.groupinfo
.staff
.startabsen
.joke
.meme
.quote
.fact
.news
.weather

- *Image & Sticker*
.sticker
.setwm
.toimage
.tovideo

- *Search & Downloader*
.lyrics
.song
.play
.download / .dl

Powered by SantStyle`;

    try {
        const profilesDir = path.join(__dirname, '../assets/profiles');
        let thumbBuffer = null;

        if (fs.existsSync(profilesDir)) {
            const files = fs.readdirSync(profilesDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgMagenta(' ASSET ')} Picking random thumbnail: ${chalk.yellow(randomFile)}`);
                let buffer = fs.readFileSync(path.join(profilesDir, randomFile));
                // Trik: Tambahkan data unik agar cache WA pecah total (Pake kombinasi waktu + angka acak besar)
                buffer = Buffer.concat([buffer, Buffer.from(`\n#yuuki_${Date.now()}_${Math.floor(Math.random() * 999999)}`)]);

                if (buffer.length < 400000) {
                    thumbBuffer = buffer;
                } else {
                    console.warn(`Menu thumbnail '${randomFile}' is too large. Skipping.`);
                }
            }
        }

        const messageOptions = { text: menuText };

        if (thumbBuffer) {
            // Gunakan rentang spasi tak terlihat yang lebih luas agar keacakan judul lebih tinggi
            const invisibleSuffix = '\u200B'.repeat(Math.floor(Math.random() * 100) + 1);

            messageOptions.contextInfo = {
                externalAdReply: {
                    title: "Yuuki Sorimachi | Whatsapp Bot" + invisibleSuffix,
                    body: `Hai ${pushName}, Senang bertemu denganmu`,
                    mediaType: 1,
                    thumbnail: thumbBuffer,
                    renderLargerThumbnail: true,
                    showAdAttribution: true,
                    sourceUrl: `https://wa.me/${botNumber}?v=${Date.now()}_${Math.floor(Math.random() * 1000)}`
                }
            };
        }

        await sock.sendMessage(chatId, messageOptions, { quoted: message });

    } catch (e) {
        console.error('Menu command failure:', e);
        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }
}

module.exports = menuCommand;


