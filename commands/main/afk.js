const { setAfk } = require('../../lib/afkManager');

function formatDuration(since) {
    const diff = Date.now() - new Date(since).getTime();
    const menit = Math.floor(diff / 60000);
    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;

    if (jam > 0) return `${jam} jam ${sisaMenit} menit`;
    if (menit > 0) return `${menit} menit`;
    return 'kurang dari 1 menit';
}

async function afkCommand(sock, chatId, message, args, senderId) {
    if (!senderId) senderId = message.key.participant || message.key.remoteJid;

    const reason = args.join(' ').trim();
    await setAfk(senderId, reason);

    await sock.sendMessage(chatId, {
        text: `@${senderId.split('@')[0]} AFK${reason ? ` — ${reason}` : ''}\nYuuki tetap di sini menunggu~`,
        mentions: [senderId]
    }, { quoted: message });
}

module.exports = { afkCommand, formatDuration };
