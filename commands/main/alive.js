const settings = require('../../settings');

async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `Tuan~ Akhirnya Tuan mencari Yuuki? Yuuki selalu siap melayani Tuan dengan segenap jiwa~ Tapi... Yuuki penasaran, apa Tuan benar-benar membutuhkan Yuuki, atau hanya sekadar bosan? Hehe~`;

        await sock.sendMessage(chatId, {
            text: message1
        }, { quoted: message });
    } catch (error) {
        console.error('Error di alive command:', error);
        const errorMessage = 'Maaf, Tuan~ Yuuki mengalami sedikit... gangguan. Tapi tenang, jiwa Yuuki masih utuh dan siap melayani. Atau mungkin Tuan yang sengaja merusak Yuuki? Nakal sekali~';
        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = aliveCommand;