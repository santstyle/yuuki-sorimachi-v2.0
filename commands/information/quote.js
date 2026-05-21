const axios = require('axios');

const FALLBACK_QUOTES = [
    { quote: 'Hidup itu seperti sepeda. Agar tetap seimbang, kau harus terus bergerak', source: 'Albert Einstein' },
    { quote: 'Jangan menunggu. Waktu tidak akan pernah tepat', source: 'Napoleon Hill' },
    { quote: 'Satu-satunya cara melakukan pekerjaan hebat adalah dengan mencintai apa yang kau lakukan', source: 'Steve Jobs' },
    { quote: 'Kegagalan adalah guru terbaik dalam hidup', source: 'Miyamoto Musashi' },
    { quote: 'Kesempatan itu seperti matahari terbit. Kalau kau menunggu terlalu lama, kau akan melewatkannya', source: 'William Arthur Ward' },
    { quote: 'Keyakinan adalah awal dari segalanya', source: 'Robin Sharma' },
    { quote: 'Dalam hidup, kita tidak harus hebat untuk memulai, tapi kita harus memulai untuk menjadi hebat', source: 'Zig Ziglar' },
    { quote: 'Bermimpilah seolah kau akan hidup selamanya. Hiduplah seolah kau akan mati hari ini', source: 'James Dean' }
];

const API_URLS = [
    { url: 'https://katanime-api.vercel.app/api/random', parser: (r) => ({ quote: r.data.data.quote, source: r.data.data.karakter || 'Anime', category: 'Anime' }) },
    { url: 'https://indonesian-quotes-api.vercel.app/api/quotes/random', parser: (r) => r.data.data },
    { url: 'https://api.quotable.io/random', parser: (r) => ({ quote: r.data.content, source: r.data.author, category: 'Umum' }) }
];

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        let q;
        for (const api of API_URLS) {
            try {
                const res = await axios.get(api.url, { timeout: 15000 });
                q = api.parser(res);
                break;
            } catch {
                continue;
            }
        }

        if (!q) {
            const randomIdx = Math.floor(Math.random() * FALLBACK_QUOTES.length);
            q = FALLBACK_QUOTES[randomIdx];
        }

        const quoteMsg = `"${q.quote}"\n— ${q.source || 'Tidak diketahui'} (${q.category || 'Umum'})\n\nSemoga membuat hari Tuan lebih baik~`;
        await sock.sendMessage(chatId, { text: quoteMsg }, { quoted: message });
    } catch (error) {
        console.error('Error di quote command:', error);
        const randomIdx = Math.floor(Math.random() * FALLBACK_QUOTES.length);
        const q = FALLBACK_QUOTES[randomIdx];
        const quoteMsg = `"${q.quote}"\n— ${q.source || 'Tidak diketahui'}\n\nSemoga membuat hari Tuan lebih baik~`;
        await sock.sendMessage(chatId, { text: quoteMsg }, { quoted: message });
    }
};
