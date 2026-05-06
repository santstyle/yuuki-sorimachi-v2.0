const { exec } = require('child_process');
const fs = require('fs');

async function updateCommand(sock, chatId, message, senderIsSudo, zipUrl = '') {
    if (!message.key.fromMe && !senderIsSudo) {
        await sock.sendMessage(chatId, { text: 'Hanya owner yang bisa menggunakan command ini!' });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: 'Memulai proses update...' });

        if (zipUrl && zipUrl.startsWith('http')) {
            exec(`curl -L -o update.zip "${zipUrl}" && unzip -o update.zip && rm update.zip`, (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(chatId, { text: 'Gagal mendownload update.' });
                    return;
                }
                sock.sendMessage(chatId, { text: 'Update berhasil! Bot akan restart...' });
                setTimeout(() => process.exit(0), 1000);
            });
        } else {
            exec('git pull', (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(chatId, { text: `Gagal update: ${stderr}` });
                    return;
                }
                sock.sendMessage(chatId, { text: 'Update berhasil! Bot akan restart...' });
                setTimeout(() => process.exit(0), 1000);
            });
        }
    } catch (error) {
        console.error('Error in update command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat update.' });
    }
}

module.exports = { updateCommand };
