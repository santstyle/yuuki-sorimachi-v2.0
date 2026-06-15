const isAdmin = require('../../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);

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
        const groupMetadata = await sock.groupMetadata(chatId);
        const groupName = groupMetadata.subject || 'Grup';

        for (const target of usersToKick) {
            await sock.sendMessage(target, {
                text: `Maaf, Tuan~ Yuuki mendapat perintah dari admin grup *${groupName}* untuk mengeluarkan Tuan dari grup tersebut. Terima kasih atas kebersamaannya selama ini. Sampai jumpa~`
            }).catch(() => {});
        }

        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");

        const usernames = usersToKick.map(jid => `@${jid.split('@')[0]}`);
        const isPlural = usersToKick.length > 1;
        await sock.sendMessage(chatId, {
            text: `Tuan~ ${usernames.join(', ')} telah Yuuki keluarkan dari grup. Semoga ${isPlural ? 'mereka' : 'dia'} bahagia di luar sana~`,
            mentions: usersToKick
        });
    } catch (error) {
        console.error('Error di kick command:', error);
        if (error.message?.includes('not-authorized')) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki mohon dengan sangat, berilah Yuuki jabatan *admin* di grup ini agar Yuuki bisa bertindak. Saat ini tangan Yuuki terikat~'
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki gagal mengeluarkan member. Mungkin Tuan bisa melakukannya secara manual? Yuuki minta maaf~'
            }, { quoted: message });
        }
    }
}

module.exports = kickCommand;
