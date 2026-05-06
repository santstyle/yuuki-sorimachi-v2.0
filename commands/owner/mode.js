const fs = require('fs');

async function modeCommand(sock, chatId, message, senderIsSudo) {
    if (!message.key.fromMe && !senderIsSudo) {
        await sock.sendMessage(chatId, { text: 'Hanya owner bot yang bisa menggunakan command ini!' });
        return;
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
    } catch (error) {
        console.error('Error membaca mode akses:', error);
        await sock.sendMessage(chatId, { text: 'Gagal membaca status mode bot' });
        return;
    }

    const userMessage = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').toLowerCase().trim();
    const action = userMessage.split(' ')[1]?.toLowerCase();

    if (!action) {
        const currentMode = data.isPublic ? 'publik' : 'privat';
        await sock.sendMessage(chatId, {
            text: `Mode bot saat ini: *${currentMode}*\n\nPenggunaan: .mode publik/privat\n\nContoh:\n.mode publik - Izinkan semua orang menggunakan bot\n.mode privat - Batasi hanya untuk owner`
        });
        return;
    }

    if (action !== 'public' && action !== 'private') {
        await sock.sendMessage(chatId, {
            text: 'Penggunaan: .mode public/private\n\nContoh:\n.mode public - Izinkan semua orang menggunakan bot\n.mode private - Batasi hanya untuk owner'
        });
        return;
    }

    try {
        data.isPublic = action === 'public';
        fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
        await sock.sendMessage(chatId, { text: `Bot sekarang dalam mode *${action}*` });
    } catch (error) {
        console.error('Error memperbarui mode akses:', error);
        await sock.sendMessage(chatId, { text: 'Gagal memperbarui mode akses bot' });
    }
}

module.exports = { modeCommand };
