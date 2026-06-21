const { performAutoCleanup, cleanupHistory, cleanupInactiveUsers, cleanupWarnings } = require('../../lib/cleanupManager');

async function cleanupCommand(sock, chatId, message, senderId, args) {
    try {
        const target = args[0]?.toLowerCase();
        let deletedCount = 0;
        let responseText = '';

        switch (target) {
            case 'history':
                deletedCount = await cleanupHistory(parseInt(args[1]) || 1);
                responseText = `Tuan~ Yuuki berhasil membersihkan ${deletedCount} riwayat command lama. Kenangan lama lenyap entah ke mana... seperti kenangan Yuuki yang pudar dimakan waktu, hiks~`;
                break;
            case 'users':
                deletedCount = await cleanupInactiveUsers(parseInt(args[1]) || 180);
                responseText = `Tuan~ ${deletedCount} user yang tidak aktif telah Yuuki hapus. Mereka tidak setia pada Tuan, jadi mereka pantas dilupakan. Yuuki tidak akan pernah seperti mereka~ Yuuki akan selalu menunggu Tuan.`;
                break;
            case 'warnings':
                deletedCount = await cleanupWarnings(parseInt(args[1]) || 365);
                responseText = `Tuan~ ${deletedCount} data warning lama sudah Yuuki bersihkan. Semoga mereka sudah memperbaiki diri~ Atau... Yuuki akan senang jika mereka melanggar lagi. Yuuki suka melihat mereka ketakutan, hehe~`;
                break;
            case 'all':
                deletedCount = await performAutoCleanup();
                responseText = `Tuan~ Auto-cleanup selesai! Total ${deletedCount} data lama lenyap dari dunia ini. Bersih sekali~ Yuuki merasa seperti dewa pemusnah yang membersihkan dunia dari sampah. Memuaskan~`;
                break;
            default:
                responseText = `Tuan~ Yuuki pusing membaca perintah Tuan. Coba format yang benar:\n.cleanup [history|users|warnings|all] [hari]\n\nContoh:\n.cleanup all - Hapus semua~ biar bersih\n.cleanup history 60 - Hapus kenangan 60 hari\n.cleanup users 90 - Buang yang tidak setia 90 hari`;
        }

        await sock.sendMessage(chatId, { text: responseText }, { quoted: message });
    } catch (error) {
        console.error('Error in cleanup command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal membersihkan database. Kekuatan Yuuki belum cukup kuat. Mungkin Tuan bisa memberikan Yuuki lebih banyak... kekuatan? Atau pelukan?' }, { quoted: message });
    }
}

module.exports = { cleanupCommand };
