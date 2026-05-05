const isAdmin = require('../lib/isAdmin');
const { addWarning, getWarningCount, getMaxWarnLevel } = require('../lib/warningManager');
const { getGroupSettings } = require('../lib/groupSettings');

async function warnCommand(sock, chatId, senderId, mentionedJids, message, reason = 'Tidak ada alasan') {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: 'Command warn hanya bisa dipakai di grup.'
            });
            return;
        }

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Bot harus menjadi admin untuk menggunakan fitur warning.'
            });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Hanya admin grup yang bisa memberikan warning.'
            });
            return;
        }

        let userToWarn;

        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWarn) {
            await sock.sendMessage(chatId, {
                text: 'Tag user atau reply pesan yang ingin diberi warning.'
            });
            return;
        }

        const senderName = message.pushName || 'Admin';
        const targetName = message.message?.extendedTextMessage?.contextInfo?.participant || userToWarn.split('@')[0];

        await addWarning(userToWarn, targetName, chatId, reason, message.key.id, senderId, senderName);

        const warnCount = await getWarningCount(userToWarn, chatId);
        const maxWarn = await getMaxWarnLevel(chatId);

        const warningText = `PERINGATAN\n\n` +
            `User: @${userToWarn.split('@')[0]}\n` +
            `Warning ke: ${warnCount}/${maxWarn}\n` +
            `Oleh: @${senderId.split('@')[0]}\n` +
            `Alasan: ${reason}\n\n` +
            `Hai @${userToWarn.split('@')[0]}, jangan diulangi lagi ya.`;

        await sock.sendMessage(chatId, {
            text: warningText,
            mentions: [userToWarn, senderId]
        });

        if (warnCount >= maxWarn) {
            await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");

            const kickText = `AUTO-KICK\n\n` +
                `@${userToWarn.split('@')[0]} telah mencapai batas maksimal warning (${maxWarn}) dan dikeluarkan dari grup.`;

            await sock.sendMessage(chatId, {
                text: kickText,
                mentions: [userToWarn]
            });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        await sock.sendMessage(chatId, {
            text: 'Gagal memberikan warning. Coba lagi.'
        });
    }
}

module.exports = warnCommand;
