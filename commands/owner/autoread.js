const fs = require('fs');
const path = require('path');

async function autoreadCommand(sock, chatId, message, args) {
    try {
        const dataPath = path.join(__dirname, '../../data/autoread.json');
        let data = { enabled: false };

        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch (e) {}

        const action = args[0]?.toLowerCase();

        if (!action || action === 'status') {
            const status = data.enabled ? 'aktif' : 'nonaktif';
            await sock.sendMessage(chatId, {
                text: `Tuan~ Auto-read saat ini sedang *${status}*. Yuuki akan membaca semua pesan pribadi dan grup yang masuk untuk Tuan~`
            });
            return;
        }

        if (action === 'on') {
            data.enabled = true;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki akan membaca semua pesan pribadi dan grup yang masuk secara otomatis. Tidak ada yang terlewat!~' });
        } else if (action === 'off') {
            data.enabled = false;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki berhenti membaca otomatis. Tapi Yuuki tetap akan membaca pesan Tuan, janji~' });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak mengerti. Coba .autoread on / off / status ya~' });
        }
    } catch (error) {
        console.error('Error in autoread command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada yang error di sistem autoread Yuuki~' });
    }
}

module.exports = { autoreadCommand };
