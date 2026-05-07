const axios = require('axios');
const { createUrl } = require('../../config');

async function pinterestCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ Gunakan: .pinterest <kata kunci>\nAlias: .pin\n\nContoh: .pinterest Rei Ayanami`
            }, { quoted: message });
            return;
        }

        await sock.sendPresenceUpdate('composing', chatId);

        const apiUrl = createUrl('vreden', '/api/v2/search/pinterest', {
            query: input,
            limit: 100,
            type: 'pins'
        });

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Yuuki-Bot'
            },
            timeout: 30000
        });

        const results = response.data?.result?.result;

        if (!results || results.length === 0) {
            await sock.sendMessage(chatId, {
                text: `Maaf, Tuan~ Yuuki tidak menemukan gambar untuk "${input}"`
            }, { quoted: message });
            return;
        }

        const randomPin = results[Math.floor(Math.random() * results.length)];
        const imageUrl = randomPin.media_urls?.[0]?.url;

        if (!imageUrl) {
            await sock.sendMessage(chatId, {
                text: `Maaf, Tuan~ Yuuki gagal mendapatkan gambar dari Pinterest untuk "${input}"`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            image: { url: imageUrl }
        }, { quoted: message });

    } catch (error) {
        console.error('Pinterest error:', error.message);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mencari gambar. Mungkin lain kali~'
        }, { quoted: message });
    }
}

module.exports = { pinterestCommand };
