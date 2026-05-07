// commands/ytmp4.js
const yt = require('../ytmp4');
const fs = require('fs');

module.exports = async function (sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const args = text.split(' ');
        const query = args.slice(1).join(' ').trim();

        if (!query) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Beri tahu Yuuki mau download video YouTube apa?\nKetik link atau judul videonya~\n\nContoh: *.ytmp4 Alan Walker Faded*'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: 'Tuan~ Mohon tunggu, Yuuki sedang mencari videonya~'
        }, { quoted: message });

        const data = await yt.mp4(query, 134);
        if (!data || !data.videoUrl) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki tidak menemukan videonya. Coba cek lagi judul atau linknya~'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            image: { url: data.thumb.url },
            caption: `Tuan~ ${data.title}\nChannel: ${data.channel}\nDurasi: ${data.duration} detik\nRilis: ${data.date}\n\nMohon tunggu, Yuuki sedang mengunduh~`
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            text: 'Tuan~ Videonya lumayan besar. Mohon bersabar, Yuuki mengambilnya pelan-pelan~'
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            video: { url: data.videoUrl },
            mimetype: 'video/mp4',
            caption: `🎬 *${data.title}*\n\nTuan~ Video sudah Yuuki siapkan. Jangan lupa subscribe channel ${data.channel} ya~\n\n> *_Yuuki Sorimachi — Pelayan Setia Tuan_*`
        }, { quoted: message });

    } catch (error) {
        console.error('[YTMP4 Error]', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki mengalami error. YouTube sedang tidak bersahabat. Coba lagi nanti~'
        }, { quoted: message });
    }
};