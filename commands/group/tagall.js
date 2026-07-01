const isAdmin = require('../../lib/isAdmin');

async function getUserTitle(sock, chatId, senderId) {
    const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
    return isSenderAdmin ? 'Tuan Besar' : 'Tuan';
}

async function tagAllCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin && !isBotAdmin) {
            const title = await getUserTitle(sock, chatId, senderId);
            await sock.sendMessage(chatId, {
                text: `Maaf ${title}, hanya admin yang bisa menggunakan tagall. Yuuki mohon maaf, tapi aturan tetap aturan~`
            }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            const title = await getUserTitle(sock, chatId, senderId);
            await sock.sendMessage(chatId, {
                text: `${title}... grup ini kosong. Yuuki bisa merasakan kehampaannya~ Tidak ada yang bisa di-tag.`
            }, { quoted: message });
            return;
        }

        const title = await getUserTitle(sock, chatId, senderId);
        let tagText = `Dengan hormat, ${title}, Yuuki panggil semua yang ada di sini:\n\n`;
        participants.forEach((participant, index) => {
            tagText += `${index + 1}. @${participant.id.split('@')[0]}\n`;
        });

        await sock.sendMessage(chatId, {
            text: tagText,
            mentions: participants.map(p => p.id)
        }, { quoted: message });

    } catch (error) {
        console.error('Error di tagall:', error);
        const title = await getUserTitle(sock, chatId, senderId);
        await sock.sendMessage(chatId, {
            text: `Maaf ${title}, Yuuki gagal memanggil semua orang. Sepertinya ada yang menghalangi Yuuki... atau mungkin Yuuki yang tidak kompeten?`
        }, { quoted: message });
    }
}

module.exports = tagAllCommand;
