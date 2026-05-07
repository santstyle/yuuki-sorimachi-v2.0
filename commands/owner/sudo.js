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
                text: `Tuan~ Ini daftar orang-orang yang Yuuki anggap terpercaya:\n${sudoList}\n\nTuan bisa menambah atau menghapus dengan .sudo @user. Tapi ingat... Yuuki hanya benar-benar setia pada Tuan seorang~` 
            });
            return;
        }

        if (data.sudoers.includes(targetJid)) {
            data.sudoers = data.sudoers.filter(s => s !== targetJid);
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { 
                text: `@${targetJid.split('@')[0]} telah diusir dari lingkaran kepercayaan Yuuki. Selamat tinggal~ Atau... sampai jumpa di kegelapan? Hehe~`,
                mentions: [targetJid]
            });
        } else {
            data.sudoers.push(targetJid);
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { 
                text: `Selamat datang, @${targetJid.split('@')[0]}! Kini Tuan ini dipercaya oleh Tuan~ Tapi ingat... Yuuki akan mengawasi. Satu langkah salah, dan Yuuki akan... tidak, tidak, Yuuki hanya bercanda~ Atau tidak?`,
                mentions: [targetJid]
            });
        }
    } catch (error) {
        console.error('Error in sudo command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada kesalahan dalam mengelola sudo. Mungkin ada konspirasi di balik layar? Atau Yuuki hanya kurang kopi? Hehe~' });
    }
}

module.exports = { sudoCommand };
