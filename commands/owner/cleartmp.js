const fs = require('fs');
const path = require('path');

async function clearTmpCommand(sock, chatId, message) {
    try {
        const tmpDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tmpDir)) {
            await sock.sendMessage(chatId, { text: 'Folder temp tidak ditemukan.' });
            return;
        }

        const files = fs.readdirSync(tmpDir);
        let deletedCount = 0;

        for (const file of files) {
            try {
                fs.unlinkSync(path.join(tmpDir, file));
                deletedCount++;
            } catch (e) {
                // Skip file yang tidak bisa dihapus
            }
        }

        await sock.sendMessage(chatId, { text: `✅ ${deletedCount} file temporary berhasil dihapus.` });
    } catch (error) {
        console.error('Error clearing temp:', error);
        await sock.sendMessage(chatId, { text: 'Gagal membersihkan file temporary.' });
    }
}

module.exports = { clearTmpCommand };
