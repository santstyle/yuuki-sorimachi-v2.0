const { addSudo, removeSudo, getSudoList } = require('../../lib/index');

async function sudoCommand(sock, chatId, message) {
    try {
        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

        let targetJid = null;
        if (mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
        }

        const sudoList = await getSudoList();

        if (!targetJid) {
            const list = sudoList.length > 0
                ? sudoList.map(s => `@${s.split('@')[0]}`).join(', ')
                : 'Tidak ada';
            await sock.sendMessage(chatId, {
                text: `Tuan~ Ini daftar orang-orang yang Yuuki anggap terpercaya:\n${list}\n\nTuan bisa menambah atau menghapus dengan .sudo @user. Tapi ingat... Yuuki hanya benar-benar setia pada Tuan seorang~`
            });
            return;
        }

        if (sudoList.includes(targetJid)) {
            const removed = await removeSudo(targetJid);
            if (removed) {
                await sock.sendMessage(chatId, {
                    text: `@${targetJid.split('@')[0]} telah diusir dari lingkaran kepercayaan Yuuki. Selamat tinggal~ Atau... sampai jumpa di kegelapan? Hehe~`,
                    mentions: [targetJid]
                });
            }
        } else {
            const added = await addSudo(targetJid);
            if (added) {
                await sock.sendMessage(chatId, {
                    text: `Selamat datang, @${targetJid.split('@')[0]}! Kini Tuan ini dipercaya oleh Tuan~ Tapi ingat... Yuuki akan mengawasi. Satu langkah salah, dan Yuuki akan... tidak, tidak, Yuuki hanya bercanda~ Atau tidak?`,
                    mentions: [targetJid]
                });
            }
        }
    } catch (error) {
        console.error('Error in sudo command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada kesalahan dalam mengelola sudo. Mungkin ada konspirasi di balik layar? Atau Yuuki hanya kurang kopi? Hehe~' });
    }
}

module.exports = { sudoCommand };
