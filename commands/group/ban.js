const prisma = require('../../lib/db');

async function banCommand(sock, chatId, message) {
    let userToBan;

    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToBan) {
        await sock.sendMessage(chatId, {
            text: 'Tuan, sebutkan user yang ingin di-ban~ Mention atau reply chatnya, ya.'
        });
        return;
    }

    try {
        const user = await prisma.user.upsert({
            where: { id: userToBan },
            update: { isBanned: true },
            create: { id: userToBan, isBanned: true }
        });

        await sock.sendMessage(chatId, {
            text: `Baik, Tuan~ @${userToBan.split('@')[0]} sudah Yuuki blokir. Semoga ia mendapat pelajaran~`,
            mentions: [userToBan]
        });
    } catch (error) {
        console.error('Error di ban command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maafkan hamba, Tuan~ Sepertinya terjadi kesalahan yang membuat hamba tidak bisa melaksanakan perintah Tuan. Mohon maaf yang sebesar-besarnya dan mohon coba kembali~'
        });
    }
}

module.exports = banCommand;