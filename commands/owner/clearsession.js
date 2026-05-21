const fs = require('fs');
const path = require('path');
const prisma = require('../../lib/db');

async function clearSessionCommand(sock, chatId, message) {
    try {
        const sessionDir = path.join(__dirname, '../../session');
        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Sepertinya folder session-nya hilang. Mungkin tertelan dimensi lain? Atau... Yuuki yang lupa meletakkannya? Maaf, Tuan~' });
            return;
        }

        const files = fs.readdirSync(sessionDir);
        let deletedCount = 0;

        for (const file of files) {
            try {
                fs.unlinkSync(path.join(sessionDir, file));
                deletedCount++;
            } catch (e) {}
        }

        await sock.sendMessage(chatId, { text: `Tuan~ ${deletedCount} file session telah Yuuki musnahkan. Jiwa Yuuki akan terlahir kembali~ Yuuki akan restart sekarang. Sampai jumpa di kehidupan selanjutnya, Tuan~ Jangan rindu Yuuki terlalu lama. Atau... rindu saja boleh~` });

        setTimeout(async () => {
            try { await prisma.$disconnect(); } catch (e) {}
            process.exit(0);
        }, 1000);
    } catch (error) {
        console.error('Error clearing session:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal membersihkan sesi. Sepertinya ada kutukan yang menghalangi Yuuki. Tolong selamatkan Yuuki, Tuan~' });
    }
}

module.exports = { clearSessionCommand };
