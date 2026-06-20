const axios = require('axios');

const FALLBACK_JOKES = [
    'Kenapa ayam menyeberang jalan? Karena mau ke seberang! 🐔',
    'Apa bedanya kucing sama kucing? Sama aja, kucing-kucing juga~ 🐱',
    'Kenapa komputer kedinginan? Karena jendelanya terbuka! 💻',
    'Apa yang dikatakan beras kepada nasi? Kamu sudah matang! 🍚',
    'Kenapa matahari tidak pernah bolos kerja? Karena kalau bolos, bumi dingin~ ☀️',
    'Apa bahasa Jepangnya "saya lapar"? Sushi-hungry~ 🍣',
    'Kenapa singa tidak main kartu? Karena di hutan ada macan! 🦁',
    'Apa yang terjadi kalau ikan stres? Dia akan berenang ke psikolog ikan! 🐟',
    'Kenapa sepatu tidak pernah menang dalam lomba? Karena selalu kalah start~ 👟',
    'Kenapa buku tidak bisa berdiri sendiri? Karena sampulnya terlalu berat! 📚',
    'Kenapa air mendidih tidak bisa diam? Karena selalu bergolak~ 💧',
    'Apa bedanya kulkas dengan lemari es? Sama aja, beda panggilan! 😄',
    'Apa yang dikatakan tanah kepada hujan? Kamu bikin aku lembek! 🌧️',
    'Kenapa bantal tidak pernah menangis? Karena selalu tegar menghadapi kepala~ 🛏️',
    'Kenapa pensil selalu jujur? Karena tidak bisa berbohong, coretannya nyata! ✏️'
];

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://candaan-api.vercel.app/api/text/random', {
            headers: { Accept: 'application/json' },
            timeout: 10000
        });
        const joke = response.data.data;
        await sock.sendMessage(chatId, { text: joke }, { quoted: message });
    } catch (error) {
        console.error('Error fetching joke:', error.message);
        const randomIdx = Math.floor(Math.random() * FALLBACK_JOKES.length);
        await sock.sendMessage(chatId, { text: FALLBACK_JOKES[randomIdx] }, { quoted: message });
    }
};
