const isAdmin = require('../../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, durationInMinutes) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki harus menjadi admin dulu agar bisa me-mute grup. Angkat Yuuki, yuk~'
        });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Hanya admin yang bisa me-mute grup. Yuuki mohon pengertian Tuan~'
        });
        return;
    }

    const durationInMilliseconds = durationInMinutes * 60 * 1000;
    try {
        await sock.groupSettingUpdate(chatId, 'announcement'); 
        await sock.sendMessage(chatId, {
            text: `Tuan~ Grup telah Yuuki mute selama ${durationInMinutes} menit. Sunyi sejenak, tenang sesaat~`
        });

        setTimeout(async () => {
            await sock.groupSettingUpdate(chatId, 'not_announcement'); 
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Waktu mute telah usai. Grup telah Yuuki buka kembali. Silakan berbicara~'
            });
        }, durationInMilliseconds);
    } catch (error) {
        console.error('Error mute/unmute grup:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal me-mute grup. Mungkin Tuan bisa melakukannya secara manual? Yuuki minta maaf~'
        });
    }
}

module.exports = muteCommand;
