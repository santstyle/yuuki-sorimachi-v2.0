const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';

        await sock.sendMessage(chatId, {
            text: 'Tuan~ Mohon tunggu, Yuuki sedang mencari berita terbaru~'
        });

        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 5);

        if (articles.length === 0) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Beritanya kosong. Mungkin lain kali~'
            });
            return;
        }

        let newsMessage = 'Tuan~ Berita terbaru untuk Tuan\n\n';
        articles.forEach((article, index) => {
            newsMessage += `${index + 1}. ${article.title}\n${article.description || 'Deskripsi ga ada'}\n\n`;
        });

        newsMessage += 'Semoga bermanfaat untuk Tuan~';

        await sock.sendMessage(chatId, { text: newsMessage });
    } catch (error) {
        console.error('Error ambil berita:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil berita. Mungkin lain kali~'
        });
    }
};