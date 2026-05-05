const { performAutoCleanup, cleanupHistory, cleanupInactiveUsers, cleanupWarnings } = require('../lib/cleanupManager');

async function cleanupCommand(sock, chatId, message, senderId, args) {
    try {
        if (!message.key.fromMe && !senderId.includes(process.env.OWNER_NUMBER || '')) {
            await sock.sendMessage(chatId, { text: 'Command ini hanya untuk owner.' });
            return;
        }

        const target = args[0]?.toLowerCase();
        let deletedCount = 0;
        let responseText = '';

        switch (target) {
            case 'history':
                deletedCount = await cleanupHistory(parseInt(args[1]) || 30);
                responseText = `Berhasil menghapus ${deletedCount} riwayat command lama.`;
                break;
            case 'users':
                deletedCount = await cleanupInactiveUsers(parseInt(args[1]) || 180);
                responseText = `Berhasil menghapus ${deletedCount} user yang tidak aktif.`;
                break;
            case 'warnings':
                deletedCount = await cleanupWarnings(parseInt(args[1]) || 365);
                responseText = `Berhasil menghapus ${deletedCount} data warning lama.`;
                break;
            case 'all':
                deletedCount = await performAutoCleanup();
                responseText = `Auto-cleanup selesai. Total ${deletedCount} data lama berhasil dihapus.`;
                break;
            default:
                responseText = `Penggunaan: .cleanup [history|users|warnings|all] [hari]\n` +
                    `Contoh:\n` +
                    `.cleanup all - Hapus semua data lama (default)\n` +
                    `.cleanup history 60 - Hapus history lebih dari 60 hari\n` +
                    `.cleanup users 90 - Hapus user tidak aktif 90 hari`;
        }

        await sock.sendMessage(chatId, { text: responseText });
    } catch (error) {
        console.error('Error in cleanup command:', error);
        await sock.sendMessage(chatId, { text: 'Gagal melakukan cleanup database.' });
    }
}

module.exports = { cleanupCommand };
