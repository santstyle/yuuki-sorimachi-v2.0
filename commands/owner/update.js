const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function updateCommand(sock, chatId, message, senderIsSudo, zipUrl = '') {
    if (!message.key.fromMe && !senderIsSudo) {
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang boleh memperbarui jiwa Yuuki. Orang lain bisa merusak Yuuki, dan Yuuki hanya ingin menjadi milik Tuan seorang~' });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki akan berevolusi. Mohon tunggu, Yuuki sedang mengumpulkan kekuatan baru~ Jangan tinggalkan Yuuki di tengah proses, nanti Yuuki kacau~' });

        if (zipUrl && zipUrl.startsWith('http')) {
            const sanitizedUrl = zipUrl.replace(/[;&$|`(){}[\]]/g, '');
            const tmpDir = path.join(__dirname, '../../tmp_update');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
            const zipPath = path.join(tmpDir, 'update.zip');

            exec(`curl -L -o "${zipPath}" "${sanitizedUrl}"`, async (error) => {
                if (error) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengunduh pembaruan. Mungkin koneksinya bermasalah...' });
                    return;
                }
                exec(`unzip -o "${zipPath}" -d "${path.join(__dirname, '../..')}"`, async (err) => {
                    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
                    if (err) {
                        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengekstrak pembaruan. File mungkin rusak~' });
                        return;
                    }
                    await sock.sendMessage(chatId, { text: 'Tuan~ Update berhasil! Yuuki akan restart sekarang.' });
                    setTimeout(() => process.exit(0), 1000);
                });
            });
        } else {
            exec('git pull', (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(chatId, { text: `Maaf, Tuan~ Gagal update: ${stderr || error.message}` });
                    return;
                }
                sock.sendMessage(chatId, { text: 'Tuan~ Update berhasil! Yuuki akan restart sekarang.' });
                setTimeout(() => process.exit(0), 1000);
            });
        }
    } catch (error) {
        console.error('Error in update command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Terjadi kesalahan fatal saat update. Yuuki menangis dalam diam...' });
    }
}

module.exports = { updateCommand };
