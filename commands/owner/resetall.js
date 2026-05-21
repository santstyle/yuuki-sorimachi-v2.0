const prisma = require('../../lib/db');

async function resetAllCommand(sock, chatId, message, senderId) {
    try {
        const confirm = message.message?.conversation?.includes('--confirm') ||
                        message.message?.extendedTextMessage?.text?.includes('--confirm');

        if (!confirm) {
            await sock.sendMessage(chatId, {
                text: `⚠️ *PERINGATAN!* ⚠️\n\nTuan~ Perintah ini akan *menghapus SEMUA data*:\n- XP & Level semua user\n- History perintah\n- Progress pengguna\n\nKetik: *${'.resetall --confirm'}* untuk melanjutkan.\n\n*Tindakan ini tidak bisa dibatalkan!*`
            });
            return;
        }

        await prisma.userProgress.deleteMany();
        await prisma.history.deleteMany();
        await prisma.warningRecord.deleteMany();

        const deletedUsers = await prisma.user.deleteMany({
            where: { isBanned: false }
        });

        await sock.sendMessage(chatId, {
            text: `Tuan~ Semua data telah di-reset:\n- XP & Level: ✅\n- History: ✅\n- Warnings: ✅\n- ${deletedUsers.count} user non-banned: ✅\n\nYuuki memulai lembaran baru~ Semua kembali seperti awal mula. Bersih dan suci~`
        });
    } catch (error) {
        console.error('Error in resetall command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mereset data. Ada yang tidak beres dengan database Yuuki~' });
    }
}

module.exports = { resetAllCommand };
