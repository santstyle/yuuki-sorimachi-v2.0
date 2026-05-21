const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

async function backupCommand(sock, chatId, message) {
    try {
        const backupDir = path.join(__dirname, '../../backup');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipName = `yuuki-backup-${timestamp}.zip`;
        const zipPath = path.join(backupDir, zipName);

        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang mengemas barang-barang untuk backup. Mohon tunggu sebentar~' });

        const filesToBackup = [
            'prisma/database.db',
            'data/',
            'settings.js',
            'config.js'
        ].map(f => path.join(__dirname, '../../', f));

        const excludePatterns = [
            'node_modules',
            'session',
            'temp',
            'tmp',
            'backup',
            '.git'
        ];

        const zipCmd = `cd /d "${path.join(__dirname, '../..')}" && tar -czf "${zipPath}" --exclude="node_modules" --exclude="session" --exclude="temp" --exclude="tmp" --exclude="backup" --exclude=".git" . 2>nul`;

        exec(zipCmd, { timeout: 30000 }, async (error) => {
            if (error) {
                console.error('Backup tar error:', error);
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal membuat backup. Mungkin ada yang error~' });
                return;
            }

            const stats = fs.statSync(zipPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            if (stats.size > 50 * 1024 * 1024) {
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Backup berhasil dibuat (${sizeMB}MB), tapi terlalu besar untuk dikirim. File backup ada di folder *backup/* dengan nama *${zipName}*~`
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Backup berhasil! (${sizeMB}MB) Yuuki akan mengirimkannya~`
                });

                await sock.sendMessage(chatId, {
                    document: fs.readFileSync(zipPath),
                    mimetype: 'application/zip',
                    fileName: zipName,
                    caption: `📦 *Backup Yuuki Sorimachi*\n🗓️ ${new Date().toLocaleString('id-ID')}\n📏 ${sizeMB} MB`
                });
            }
        });
    } catch (error) {
        console.error('Error in backup command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal melakukan backup. Ada yang salah~' });
    }
}

module.exports = { backupCommand };
