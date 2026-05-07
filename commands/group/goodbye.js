const { handleGoodbye } = require('../../lib/welcome');

async function goodbyeCommand(sock, chatId, message, match) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Command ini hanya untuk grup, ya. Yuuki tidak bisa melayaninya di sini~'
        });
        return;
    }

    const text = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');

    await handleGoodbye(sock, chatId, message, matchText);
}

module.exports = goodbyeCommand;
