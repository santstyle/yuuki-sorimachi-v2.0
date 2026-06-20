const { clearMuteTimer } = require('./mutegroup');

async function unmuteCommand(sock, chatId, senderId, message) {
    clearMuteTimer(chatId);
    await sock.groupSettingUpdate(chatId, 'not_announcement'); 
    await sock.sendMessage(chatId, { text: 'Tuan~ Grup telah Yuuki buka kembali. Silakan berbicara dengan bebas~' }, { quoted: message });
}

module.exports = unmuteCommand;
