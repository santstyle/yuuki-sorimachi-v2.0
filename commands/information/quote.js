const fetch = require('node-fetch');

module.exports = async function quoteCommand(sock, chatId, message, args) {
    try {
        let url = 'https://indonesian-quotes-api.vercel.app/api/quotes/random';
        if (args[0]) url += `?category=${args[0]}`; // contoh: .quote motivasi

        await sock.sendMessage(chatId, {
            text: 'Tuan~ Mohon tunggu, Yuuki sedang mencari quote yang bagus~'
        }, { quoted: message });

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const q = json.data;
        const quoteMsg = `"${q.quote}"\n— ${q.source || 'Tidak diketahui'} (${q.category || 'Umum'})\n\nSemoga membuat hari Tuan lebih baik~`;

        await sock.sendMessage(chatId, { text: quoteMsg }, { quoted: message });
    } catch (error) {
        console.error('Error di quote command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil quote. Mungkin lain kali~ Format: .quote [kategori]'
        }, { quoted: message });
    }
};