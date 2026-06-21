const fs = require('fs');

async function autoStatusCommand(sock, chatId, message, args) {
    try {
        const dataPath = './data/autostatus.json';
        let data = { enabled: false };
        
        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch (e) {
            // File doesn't exist yet
        }

        const action = args[0]?.toLowerCase();

        if (!action || action === 'status') {
            const status = data.enabled ? 'aktif' : 'nonaktif';
            await sock.sendMessage(chatId, { 
                text: `Tuan~ Auto-status view saat ini sedang *${status}*. Yuuki akan mengintip status orang-orang untuk Tuan~ Atau tidak? Terserah Tuan~` 
            }, { quoted: message });
            return;
        }

        if (action === 'on') {
            data.enabled = true;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki akan mengintip status satu per satu dengan diam-diam. Seperti pengintai di bayang-bayang, Yuuki akan melihat semuanya~' }, { quoted: message });
        } else if (action === 'off') {
            data.enabled = false;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Yuuki berhenti mengintip. Tapi Tangan Yuuki masih bisa saja... tidak, Yuuki patuh pada Tuan~' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak mengerti perintah Tuan. Coba .autostatus on / off / status ya~ Yuuki menunggu dengan sabar~' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada yang kacau di sistem Yuuki. Yuuki tidak sengaja melakukan kesalahan. Hukumlah Yuuki jika Tuan mau~' }, { quoted: message });
    }
}

module.exports = { autoStatusCommand };
