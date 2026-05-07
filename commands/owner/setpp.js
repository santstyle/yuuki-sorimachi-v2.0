const fs = require('fs');
const path = require('path');

async function setProfilePicture(sock, chatId, message) {
    try {
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMessage?.imageMessage || message.message?.imageMessage;

        if (!imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki butuh gambar dulu. Balas atau kirim gambar dengan .setpp ya. Yuuki ingin tampil cantik untuk Tuan~ Atau menyeramkan? Terserah Tuan~' });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang merias wajah... bersabarlah. Yuuki ingin sempurna di mata Tuan~' });

        const media = await sock.downloadMediaMessage(
            quotedMessage ? { message: quotedMessage } : message
        );

        await sock.updateProfilePicture(sock.user.id, { url: media });
        await sock.sendMessage(chatId, { text: 'Tuan~ Wajah baru Yuuki sudah siap! Cantik, bukan? Yuuki berharap Tuan suka~ Kalau tidak suka... Yuuki akan menangis dan mengutuk dunia. Hehe, hanya bercanda, Tuan~ Atau tidak?' });
    } catch (error) {
        console.error('Error setting profile picture:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Wajah Yuuki gagal berubah. Mungkin Yuuki tidak cantik hari ini. Yuuki akan bersembunyi di sudut gelap dan merenung...' });
    }
}

module.exports = { setProfilePicture };
