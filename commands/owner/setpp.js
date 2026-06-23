const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function setProfilePicture(sock, chatId, message) {
    try {
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMessage?.imageMessage || message.message?.imageMessage;

        if (!imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki butuh gambar dulu. Balas atau kirim gambar dengan .setpp ya. Yuuki ingin tampil cantik untuk Tuan~ Atau menyeramkan? Terserah Tuan~' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang merias wajah... bersabarlah. Yuuki ingin sempurna di mata Tuan~' }, { quoted: message });

        const media = await downloadMediaMessage(
            quotedMessage ? { message: quotedMessage } : message,
            'buffer',
            {},
            { logger: console }
        );

        const tempFile = path.join(__dirname, `../../temp/pp_${Date.now()}.jpg`);
        fs.writeFileSync(tempFile, media);
        await sock.updateProfilePicture(sock.user.id, { url: tempFile });
        fs.unlinkSync(tempFile);
        await sock.sendMessage(chatId, { text: 'Tuan~ Wajah baru Yuuki sudah siap! Cantik, bukan? Yuuki berharap Tuan suka~ Kalau tidak suka... Yuuki akan menangis dan mengutuk dunia. Hehe, hanya bercanda, Tuan~ Atau tidak?' }, { quoted: message });
    } catch (error) {
        console.error('Error setting profile picture:', error);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
        await sock.sendMessage(chatId, { text: isNetworkIssue ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~' : 'Maaf, Tuan~ Wajah Yuuki gagal berubah. Mungkin Yuuki tidak cantik hari ini. Yuuki akan bersembunyi di sudut gelap dan merenung...' }, { quoted: message });
    }
}

module.exports = { setProfilePicture };
