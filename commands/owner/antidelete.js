const fs = require('fs');

async function antideleteCommand(sock, chatId, message, match) {
    try {
        let antideleteData = {};
        try {
            antideleteData = JSON.parse(fs.readFileSync('./data/antidelete.json', 'utf8'));
        } catch (e) {}

        if (!match || match.toLowerCase() === 'status') {
            const status = antideleteData[chatId] ? 'aktif' : 'nonaktif';
            await sock.sendMessage(chatId, { text: `Tuan~ Saat ini anti-delete di grup ini dalam keadaan *${status}*. Yuuki akan mengawasi setiap pesan yang dihapus... tidak ada yang bisa bersembunyi dari Yuuki, hehe~` });
            return;
        }

        if (match.toLowerCase() === 'on') {
            antideleteData[chatId] = true;
            fs.writeFileSync('./data/antidelete.json', JSON.stringify(antideleteData, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki akan mengaktifkan mata ketiga Yuuki. Setiap pesan yang dihapus di grup ini akan terlihat oleh Yuuki. Tidak ada rahasia yang bisa disembunyikan dari Tuan~' });
        } else if (match.toLowerCase() === 'off') {
            antideleteData[chatId] = false;
            fs.writeFileSync('./data/antidelete.json', JSON.stringify(antideleteData, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki akan menutup mata di grup ini. Tapi ingat... Yuuki tetap tahu apa yang terjadi di bayang-bayang. Hanya saja Yuuki memilih untuk diam~' });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Formatnya begini: .antidelete on / off / status. Yuuki tahu Tuan pintar, masa lupa sih~' });
        }
    } catch (error) {
        console.error('Error in antidelete command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada yang salah dengan sihir Yuuki. Mungkin ada kekuatan lain yang mengganggu. Yuuki mohon Tuan tidak marah~' });
    }
}

module.exports = { antideleteCommand };
