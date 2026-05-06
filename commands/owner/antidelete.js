const fs = require('fs');

async function antideleteCommand(sock, chatId, message, match) {
    try {
        const antideleteData = JSON.parse(fs.readFileSync('./data/antidelete.json', 'utf8'));

        if (!match || match.toLowerCase() === 'status') {
            const status = antideleteData.enabled ? 'aktif' : 'nonaktif';
            await sock.sendMessage(chatId, { text: `Antidelete saat ini: *${status}*` });
            return;
        }

        if (match.toLowerCase() === 'on') {
            antideleteData.enabled = true;
            fs.writeFileSync('./data/antidelete.json', JSON.stringify(antideleteData, null, 2));
            await sock.sendMessage(chatId, { text: 'Antidelete diaktifkan.' });
        } else if (match.toLowerCase() === 'off') {
            antideleteData.enabled = false;
            fs.writeFileSync('./data/antidelete.json', JSON.stringify(antideleteData, null, 2));
            await sock.sendMessage(chatId, { text: 'Antidelete dinonaktifkan.' });
        } else {
            await sock.sendMessage(chatId, { text: 'Penggunaan: .antidelete on/off/status' });
        }
    } catch (error) {
        console.error('Error in antidelete command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat mengelola antidelete.' });
    }
}

module.exports = { antideleteCommand };
