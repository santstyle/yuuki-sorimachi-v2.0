const isAdmin = require('../../lib/isAdmin');

async function resetlinkCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin yang bisa mereset link grup. Yuuki mohon maaf~'
            }, { quoted: message });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki harus menjadi admin dulu agar bisa mereset linknya. Angkat Yuuki jadi admin, yuk~'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: 'Tuan~ Mohon tunggu, Yuuki sedang mereset link grup. Sedikit sabar, ya~'
        }, { quoted: message });

        const newCode = await sock.groupRevokeInvite(chatId);

        await sock.sendMessage(chatId, {
            text: `Tuan~ Link grup telah Yuuki perbarui!\n\nLink baru:\nhttps://chat.whatsapp.com/${newCode}\n\nGunakan link yang ini, ya. Yang lama sudah tidak berlaku lagi~`
        }, { quoted: message });

    } catch (error) {
        console.error('Error di resetlink command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mereset link grup. Coba lagi, ya. Yuuki tidak menyerah~'
        }, { quoted: message });
    }
}

module.exports = resetlinkCommand;
