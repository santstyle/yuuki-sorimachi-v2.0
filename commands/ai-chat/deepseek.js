const axios = require('axios');

async function deepseekCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `Gunakan: .deepseek <pertanyaan>\n\nContoh: .deepseek apa itu Artificial Intelligence?`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Sedang berpikir...' }, { quoted: message });

        const currentYear = new Date().getFullYear();
        const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        const apiUrl = `https://api.cuki.biz.id/api/ai/deepseek?question=${encodeURIComponent(input)}&apikey=cuki-x&context=Sekarang tanggal ${currentDate} (${currentYear}). Jawab dengan bahasa Indonesia yang santai dan informatif. ${input}`;

        const response = await axios.get(apiUrl, { timeout: 60000 });
        let result = response.data.data.response;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('Deepseek error:', error.response?.data || error.message);
        await sock.sendMessage(chatId, { text: 'Gagal memproses permintaan. Coba lagi nanti.' }, { quoted: message });
    }
}

module.exports = { deepseekCommand };
