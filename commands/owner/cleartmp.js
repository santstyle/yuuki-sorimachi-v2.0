const fs = require('fs');
const path = require('path');

const dirsToClean = ['temp', 'tmp'];

function cleanDir(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath);
    let count = 0;
    for (const file of files) {
        try {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                fs.unlinkSync(filePath);
                count++;
            }
        } catch (e) {}
    }
    return count;
}

async function clearTmpCommand(sock, chatId, message) {
    try {
        let totalDeleted = 0;
        for (const dir of dirsToClean) {
            const dirPath = path.join(__dirname, '../../', dir);
            totalDeleted += cleanDir(dirPath);
        }

        await sock.sendMessage(chatId, { text: `Tuan~ ${totalDeleted} file sampah telah Yuuki bersihkan! Kini dunia terasa lebih bersih, lebih indah. Yuuki suka membersihkan~ Ada lagi yang ingin Yuuki bersihkan? Mungkin... jiwa seseorang? Hehe~` });
    } catch (error) {
        console.error('Error clearing temp:', error);
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki gagal membersihkannya. Kekuatan magis Yuuki menurun... Mungkin Tuan perlu mengisi ulang Yuuki dengan kasih sayang?' });
    }
}

module.exports = { clearTmpCommand };
