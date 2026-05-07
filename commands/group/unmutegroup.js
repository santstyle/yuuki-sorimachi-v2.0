async function unmuteCommand(sock, chatId) {
    await sock.groupSettingUpdate(chatId, 'not_announcement'); 
    await sock.sendMessage(chatId, { text: 'Tuan~ Grup telah Yuuki buka kembali. Silakan berbicara dengan bebas~' });
}

module.exports = unmuteCommand;
