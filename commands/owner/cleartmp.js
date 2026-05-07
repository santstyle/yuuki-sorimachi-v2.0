const fs = require('fs');
const path = require('path');

async function clearTmpCommand(sock, chatId, message) {
    try {
        const tmpDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tmpDir)) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Folder temp-nya raib! Mungkin Yuuki terlalu bersemangat membersihkan sebelumnya? Atau ada peri nakal yang mengambilnya? Hehe~' });
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

        await sock.sendMessage(chatId, { text: `Tuan~ ${deletedCount} file sampah telah Yuuki bersihkan! Kini dunia terasa lebih bersih, lebih indah. Yuuki suka membersihkan~ Ada lagi yang ingin Yuuki bersihkan? Mungkin... jiwa seseorang? Hehe~` });
    } catch (error) {
        console.error('Error clearing temp:', error);
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki gagal membersihkannya. Kekuatan magis Yuuki menurun... Mungkin Tuan perlu mengisi ulang Yuuki dengan kasih sayang?' });
    }
}

module.exports = { clearTmpCommand };
