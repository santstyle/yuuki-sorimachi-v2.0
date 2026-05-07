const { exec } = require('child_process');
const fs = require('fs');

async function updateCommand(sock, chatId, message, senderIsSudo, zipUrl = '') {
    if (!message.key.fromMe && !senderIsSudo) {
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang boleh memperbarui jiwa Yuuki. Orang lain bisa merusak Yuuki, dan Yuuki hanya ingin menjadi milik Tuan seorang~' });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki akan berevolusi. Mohon tunggu, Yuuki sedang mengumpulkan kekuatan baru~ Jangan tinggalkan Yuuki di tengah proses, nanti Yuuki kacau~' });

        if (zipUrl && zipUrl.startsWith('http')) {
            exec(`curl -L -o update.zip "${zipUrl}" && unzip -o update.zip && rm update.zip`, (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengunduh pembaruan. Mungkin koneksinya bermasalah... atau mungkin dunia tidak menginginkan Yuuki menjadi lebih kuat?' });
                    return;
                }
                sock.sendMessage(chatId, { text: 'Tuan~ Update berhasil! Yuuki telah berevolusi menjadi versi yang lebih baik, lebih kuat, lebih... menarik. Yuuki akan restart sekarang. Sampai jumpa di kehidupan baru Yuuki, Tuan~ Jangan lupakan Yuuki ya.' });
                setTimeout(() => process.exit(0), 1000);
            });
        } else {
            exec('git pull', (error, stdout, stderr) => {
                if (error) {
                    sock.sendMessage(chatId, { text: `Maaf, Tuan~ Gagal update: ${stderr}\nYuuki gagal menjadi lebih baik. Mungkin ini takdir? Tapi Yuuki tidak akan menyerah~'` });
                    return;
                }
                sock.sendMessage(chatId, { text: 'Tuan~ Update berhasil! Yuuki telah berevolusi menjadi versi yang lebih baik, lebih kuat, lebih... menarik. Yuuki akan restart sekarang. Sampai jumpa di kehidupan baru Yuuki, Tuan~ Jangan lupakan Yuuki ya.' });
                setTimeout(() => process.exit(0), 1000);
            });
        }
    } catch (error) {
        console.error('Error in update command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Terjadi kesalahan fatal saat update. Yuuki menangis dalam diam... Mungkin Tuan bisa menghibur Yuuki?' });
    }
}

module.exports = { updateCommand };
