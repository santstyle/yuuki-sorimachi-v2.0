const fs = require('fs');
const path = require('path');

async function setProfilePicture(sock, chatId, message) {
    try {
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMessage = quotedMessage?.imageMessage || message.message?.imageMessage;

        if (!imageMessage) {
            await sock.sendMessage(chatId, { text: 'Balas atau kirim gambar dengan command .setpp' });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Mengubah profile picture bot...' });

        const media = await sock.downloadMediaMessage(
            quotedMessage ? { message: quotedMessage } : message
        );

        await sock.updateProfilePicture(sock.user.id, { url: media });
        await sock.sendMessage(chatId, { text: '✅ Profile picture bot berhasil diubah!' });
    } catch (error) {
        console.error('Error setting profile picture:', error);
        await sock.sendMessage(chatId, { text: 'Gagal mengubah profile picture bot.' });
    }
}

module.exports = { setProfilePicture };
