const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://candaan-api.vercel.app/api/text/random', {
            headers: { Accept: 'application/json' },
            timeout: 15000
        });
        const joke = response.data.data;
        await sock.sendMessage(chatId, { text: joke }, { quoted: message });
    } catch (error) {
        console.error('Error fetching joke:', error.message);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengambil candaan. Mungkin lain kali~' }, { quoted: message });
    }
};
