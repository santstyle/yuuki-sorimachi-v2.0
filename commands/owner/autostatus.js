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
                text: `Auto-status view saat ini: *${status}*` 
            });
            return;
        }

        if (action === 'on') {
            data.enabled = true;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Auto-status view diaktifkan.' });
        } else if (action === 'off') {
            data.enabled = false;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Auto-status view dinonaktifkan.' });
        } else {
            await sock.sendMessage(chatId, { text: 'Penggunaan: .autostatus on/off/status' });
        }
    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat mengelola auto-status.' });
    }
}

module.exports = { autoStatusCommand };
