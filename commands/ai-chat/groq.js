const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function groqCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ Gunakan: .groq <pertanyaan>\n\nContoh: .groq apa itu JavaScript?`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang berpikir... Mohon tunggu~' }, { quoted: message });

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY tidak ditemukan di .env');
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'Kamu adalah asisten AI bernama GROQ. Jawablah dengan bahasa Indonesia yang santai, informatif, dan mudah dimengerti.'
                    },
                    {
                        role: 'user',
                        content: input
                    }
                ],
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const result = response.data?.choices?.[0]?.message?.content;
        
        if (!result) {
            throw new Error('Format response tidak dikenali');
        }

        await sock.sendMessage(chatId, { text: result }, { quoted: message });

    } catch (error) {
        console.error('GROQ error:', error.response?.data || error.message);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal memprosesnya. Mungkin lain kali~' }, { quoted: message });
    }
}

module.exports = { groqCommand };
