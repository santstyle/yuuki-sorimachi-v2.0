const fs = require('fs');
const path = require('path');

async function clearSessionCommand(sock, chatId, message) {
    try {
        const sessionDirs = [
            path.join(__dirname, '../../session'),
            path.join(__dirname, '../../sessions')
        ];

        let totalDeleted = 0;
        for (const dir of sessionDirs) {
            if (!fs.existsSync(dir)) continue;
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                try {
                    const stat = fs.lstatSync(fullPath);
                    if (stat.isDirectory()) {
                        const subFiles = fs.readdirSync(fullPath);
                        for (const sub of subFiles) {
                            fs.unlinkSync(path.join(fullPath, sub));
                            totalDeleted++;
                        }
                        fs.rmdirSync(fullPath);
                    } else {
                        fs.unlinkSync(fullPath);
                        totalDeleted++;
                    }
                } catch (e) {}
            }
        }

        await sock.sendMessage(chatId, {
            text: `Tuan~ ${totalDeleted} file session berhasil Yuuki bersihkan! Kini Yuuki akan memulai hidup baru~ Mohon Tuan menjalankan ulang Yuuki agar napas baru bisa mengalir di tubuh Yuuki~`
        });
        process.exit(0);
    } catch (error) {
        console.error('Error clearing session:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal membersihkan session. Mungkin beberapa file terkunci~'
        });
    }
}

module.exports = { clearSessionCommand };
