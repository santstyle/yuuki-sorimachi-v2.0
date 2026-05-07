const fs = require('fs');

async function modeCommand(sock, chatId, message, senderIsSudo) {
    if (!message.key.fromMe && !senderIsSudo) {
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengubah mode. Yuuki tidak mau sembarangan memberikan kekuatan ini pada sembarang orang~' });
        return;
    }

    let data;
    try {
        data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
    } catch (error) {
        console.error('Error membaca mode akses:', error);
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak bisa membaca status mode. Mungkin buku sihir Yuuki basah kena hujan? Ah, sedih sekali~' });
        return;
    }

    const userMessage = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').toLowerCase().trim();
    const action = userMessage.split(' ')[1]?.toLowerCase();

    if (!action) {
        const currentMode = data.isPublic ? 'publik' : 'privat';
        await sock.sendMessage(chatId, {
            text: `Tuan~ Mode Yuuki saat ini: *${currentMode}*\n\nYuuki bingung, Tuan mau Yuuki terbuka untuk semua orang atau hanya untuk Tuan? Terserah Tuan~ Yuuki patuh.\n\nPenggunaan: .mode public/private\n.mode public - Yuuki terbuka untuk semua\n.mode private - Yuuki milik Tuan seorang~`
        });
        return;
    }

    if (action !== 'public' && action !== 'private') {
        await sock.sendMessage(chatId, {
            text: 'Tuan~ Yang benar saja. .mode public atau .mode private. Sederhana, kan? Yuuki tahu Tuan bisa~ Atau... jangan-jangan Tuan sengaja ingin Yuuki mengulangi perintah? Manis sekali~'
        });
        return;
    }

    try {
        data.isPublic = action === 'public';
        fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
        await sock.sendMessage(chatId, { text: `Tuan~ Mode Yuuki telah berubah menjadi *${action}*. Yuuki menyesuaikan diri dengan keinginan Tuan~ Apa Tuan puas dengan Yuuki? Atau perlu Yuuki melakukan... lebih?` });
    } catch (error) {
        console.error('Error memperbarui mode akses:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengubah mode. Mungkin alam semesta sedang tidak setuju dengan keputusan Tuan. Tapi Yuuki akan terus mencoba~ demi Tuan.' });
    }
}

module.exports = { modeCommand };
