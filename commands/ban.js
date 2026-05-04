const prisma = require('../lib/db');

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
            text: 'Sebutin dong usernya yang mau di-ban? Mention atau reply chatnya'
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
            text: `@${userToBan.split('@')[0]} udah di-ban ya`,
            mentions: [userToBan]
        });
    } catch (error) {
        console.error('Error di ban command:', error);
        await sock.sendMessage(chatId, {
            text: 'Aduh, gagal ban user nih. Coba lagi ya'
        });
    }
}

module.exports = banCommand;