const fs = require('fs');
const path = require('path');

async function clearSessionCommand(sock, chatId, message) {
    try {
        const sessionDir = path.join(__dirname, '../../sessions');
        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { text: 'Folder sessions tidak ditemukan.' });
            return;
        }

        const files = fs.readdirSync(sessionDir);
        let deletedCount = 0;

        for (const file of files) {
            try {
                fs.unlinkSync(path.join(sessionDir, file));
                deletedCount++;
            } catch (e) {
                // Skip file yang tidak bisa dihapus
            }
        }

        await sock.sendMessage(chatId, { text: `✅ ${deletedCount} file session berhasil dihapus. Bot akan restart...` });
        
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error clearing session:', error);
        await sock.sendMessage(chatId, { text: 'Gagal membersihkan session.' });
    }
}

module.exports = { clearSessionCommand };
