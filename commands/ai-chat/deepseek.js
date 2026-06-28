const axios = require('axios');

async function deepseekCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ Gunakan: .deepseek <pertanyaan>\n\nContoh: .deepseek apa itu Artificial Intelligence?`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang berpikir... Mohon tunggu~' }, { quoted: message });

        const currentYear = new Date().getFullYear();
        const currentDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        const apiUrl = `https://api.cuki.biz.id/api/ai/deepseek?question=${encodeURIComponent(input)}&apikey=${process.env.CUKI_API_KEY || 'cuki-x'}&context=Sekarang tanggal ${currentDate} (${currentYear}). Jawab dengan bahasa Indonesia yang santai dan informatif. ${input}`;

        const response = await axios.get(apiUrl, { timeout: 60000 });
        let result = response.data.data.response;
        
        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('Deepseek error:', error.response?.data || error.message);
        const errMsg = error?.message || error?.toString() || '';
        const statusCode = error?.response?.status;
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
        const isRateLimit = statusCode === 429 || errMsg.includes('rate_limit') || errMsg.includes('Rate limit');
        await sock.sendMessage(chatId, {
            text: isRateLimit
                ? 'Maaf, Tuan~ Layanan DeepSeek sedang mencapai batas limit. Silakan coba lagi beberapa saat lagi~'
                : isNetworkIssue
                    ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
                    : 'Maaf, Tuan~ Yuuki gagal memprosesnya. Mungkin lain kali~'
        }, { quoted: message });
    }
}

module.exports = { deepseekCommand };
