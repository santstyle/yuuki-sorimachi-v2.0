const axios = require('axios');

async function gptCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ Gunakan: .gpt <pertanyaan>\n\nContoh: .gpt siapa Yuuki Sorimachi?`
            }, { quoted: message });
            return;
        }

        await sock.sendPresenceUpdate('composing', chatId);

        const apiKey = process.env.CUKI_API_KEY || 'cuki-x';
        const apiUrl = `https://api.cuki.biz.id/api/ai/gpt?question=${encodeURIComponent(input)}&apikey=${apiKey}`;

        const response = await axios.get(apiUrl, { timeout: 30000 });
        const result = response.data?.results;

        if (!result) {
            throw new Error('Format response tidak dikenali');
        }

        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('GPT error:', error.response?.data || error.message);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal memprosesnya. Mungkin lain kali~'
        }, { quoted: message });
    }
}

module.exports = { gptCommand };
