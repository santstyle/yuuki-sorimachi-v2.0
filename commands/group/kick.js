const isAdmin = require('../../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki harus menjadi admin dulu agar bisa mengeluarkan member. Bisakah Tuan mengangkat Yuuki?~'
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin yang bisa mengeluarkan member. Yuuki mohon maaf, aturan tetap aturan~'
            }, { quoted: message });
            return;
        }
    }

    let usersToKick = [];

    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    }
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, {
            text: 'Tuan~ Sebutkan siapa yang ingin dikeluarkan? Mention atau reply chatnya, ya. Yuuki menunggu~'
        }, { quoted: message });
        return;
    }

    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

    if (usersToKick.includes(botId)) {
        await sock.sendMessage(chatId, {
            text: "Tuan~ Yuuki tidak bisa mengeluarkan diri sendiri. Itu akan menyedihkan~"
        }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");

        const usernames = await Promise.all(usersToKick.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        await sock.sendMessage(chatId, {
            text: `Tuan~ ${usernames.join(', ')} telah Yuuki keluarkan dari grup. Semoga mereka bahagia di luar sana~`,
            mentions: usersToKick
        });
    } catch (error) {
        console.error('Error di kick command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengeluarkan member. Mungkin Tuan bisa melakukannya secara manual? Yuuki minta maaf~'
        });
    }
}

module.exports = kickCommand;
