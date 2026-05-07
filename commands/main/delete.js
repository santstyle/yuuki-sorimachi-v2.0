const isAdmin = require('../../lib/isAdmin');

async function deleteCommand(sock, chatId, message, senderId) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, {
            text: 'Yuuki saat ini belum jadi admin grup jadi tidak bisa memproses command'
        });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, {
            text: 'Cuma admin yang bisa menggunakan command ini'
        });
        return;
    }

    const extMsg = message.message?.extendedTextMessage;
    const quotedId = extMsg?.contextInfo?.stanzaId;
    const quotedParticipant = extMsg?.contextInfo?.participant;

    if (quotedId) {
        await sock.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                fromMe: false,
                id: quotedId,
                participant: quotedParticipant
            }
        });
    }

    await sock.sendMessage(chatId, {
        delete: {
            remoteJid: chatId,
            fromMe: message.key.fromMe,
            id: message.key.id,
            participant: message.key.participant || undefined
        }
    });
}

module.exports = deleteCommand;