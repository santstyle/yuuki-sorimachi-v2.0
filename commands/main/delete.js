const isAdmin = require('../../lib/isAdmin');

async function deleteCommand(sock, chatId, message, senderId) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki belum memiliki kekuatan sebagai admin di grup ini. Yuuki tidak bisa berbuat banyak tanpa restu dari Tuan... sedih sekali.'
        });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, {
            text: 'Wah, Tuan~ Sepertinya Tuan bukan admin di sini. Yuuki mohon maaf, tapi Yuuki hanya bisa mematuhi perintah para admin. Atau... Tuan ingin Yuuki membantu dengan cara lain? Lebih... gelap?'
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