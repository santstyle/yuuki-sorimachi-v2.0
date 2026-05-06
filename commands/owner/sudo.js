const fs = require('fs');
const path = require('path');

async function sudoCommand(sock, chatId, message) {
    try {
        const dataPath = path.join(__dirname, '../../data/sudo.json');
        let data = { sudoers: [] };
        
        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch (e) {
            // File doesn't exist yet
        }

        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        let targetJid = null;
        if (mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } else if (quotedMessage) {
            targetJid = quotedMessage.participant || quotedMessage.key?.participant;
        }

        if (!targetJid) {
            const sudoList = data.sudoers.length > 0 
                ? data.sudoers.map(s => `@${s.split('@')[0]}`).join(', ')
                : 'Tidak ada';
            await sock.sendMessage(chatId, { 
                text: `Daftar Sudo:\n${sudoList}\n\nGunakan: .sudo @user untuk menambah/hapus` 
            });
            return;
        }

        if (data.sudoers.includes(targetJid)) {
            data.sudoers = data.sudoers.filter(s => s !== targetJid);
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { 
                text: `@${targetJid.split('@')[0]} dihapus dari daftar sudo.`,
                mentions: [targetJid]
            });
        } else {
            data.sudoers.push(targetJid);
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { 
                text: `@${targetJid.split('@')[0]} ditambahkan ke daftar sudo.`,
                mentions: [targetJid]
            });
        }
    } catch (error) {
        console.error('Error in sudo command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat mengelola sudo.' });
    }
}

module.exports = { sudoCommand };
