const fs = require('fs');
const path = require('path');

function deleteRecursive(dir) {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        try {
            const stat = fs.lstatSync(fullPath);
            if (stat.isDirectory()) {
                count += deleteRecursive(fullPath);
                fs.rmdirSync(fullPath);
            } else {
                fs.unlinkSync(fullPath);
                count++;
            }
        } catch (e) {}
    }
    return count;
}

async function clearTmpCommand(sock, chatId, message) {
    try {
        const dirs = [
            path.join(__dirname, '../../temp'),
            path.join(__dirname, '../../tmp'),
            path.join(__dirname, '../temp')
        ];
        let totalDeleted = 0;

        for (const dir of dirs) {
            totalDeleted += deleteRecursive(dir);
        }

        await sock.sendMessage(chatId, { text: `Tuan~ ${totalDeleted} file sampah telah Yuuki bersihkan! Kini dunia terasa lebih bersih, lebih indah. Yuuki suka membersihkan~ Ada lagi yang ingin Yuuki bersihkan? Mungkin... jiwa seseorang? Hehe~` });
    } catch (error) {
        console.error('Error clearing temp:', error);
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki gagal membersihkannya. Kekuatan magis Yuuki menurun... Mungkin Tuan perlu mengisi ulang Yuuki dengan kasih sayang?' });
    }
}

module.exports = { clearTmpCommand };
