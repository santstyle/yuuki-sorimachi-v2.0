const axios = require('axios');

async function gptCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `Gunakan: .gpt <pertanyaan>\n\nContoh: .gpt siapa Yuuki Sorimachi?`
            }, { quoted: message });
            return;
        }

        await sock.sendPresenceUpdate('composing', chatId);

        const apiUrl = `https://www.neoapis.xyz/api/ai/gpt?text=${encodeURIComponent(input)}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Yuuki-Bot'
            },
            timeout: 30000
        });

        const result = response.data?.data;
        
        if (!result) {
            throw new Error('Format response tidak dikenali');
        }

        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('GPT error:', error.response?.data || error.message);
        await sock.sendMessage(chatId, { 
            text: 'Gagal memproses permintaan. Coba lagi nanti.'
        }, { quoted: message });
    }
}

module.exports = { gptCommand };
