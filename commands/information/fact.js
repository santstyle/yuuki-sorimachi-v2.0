const axios = require('axios');

const FALLBACK_FAKTA = [
    'Tangan kidal ternyata bisa hidup lebih lama 9 tahun dibanding tangan kanan',
    'Madu adalah satu-satunya makanan yang tidak pernah basi',
    'Semut tidak pernah tidur',
    'Kuku jari tangan tumbuh 4 kali lebih cepat dari kuku jari kaki',
    'Lidah manusia memiliki sekitar 10.000 indera perasa',
    'Rata-rata orang berkedip 15-20 kali per menit',
    'Kupu-kupu bisa melihat warna yang tidak bisa dilihat manusia',
    'Gajah adalah satu-satunya mamalia yang tidak bisa melompat',
    'Bintang laut tidak punya otak',
    'Siput bisa tidur sampai 3 tahun',
    'Api ungu adalah api terpanas di dunia',
    'Jantung manusia berdetak sekitar 100.000 kali per hari',
    'Es krim ditemukan oleh orang China sekitar 4000 tahun lalu',
    'Pelangi sebenarnya berbentuk lingkaran penuh, bukan setengah lingkaran',
    'Seekor kecoa bisa hidup seminggu tanpa kepala'
];

const API_URLS = [
    { url: 'https://indonesian-facts.vercel.app/api/facts/random', parser: (r) => r.data.data.fact },
    { url: 'https://api-fakta.vercel.app/api/fakta', parser: (r) => r.data.fakta },
    { url: 'https://uselessfacts.jsph.pl/random.json?language=en', parser: (r) => r.data.text }
];

async function fetchFact() {
    for (const api of API_URLS) {
        try {
            const response = await axios.get(api.url, { timeout: 15000 });
            return api.parser(response);
        } catch {
            continue;
        }
    }
    const randomIdx = Math.floor(Math.random() * FALLBACK_FAKTA.length);
    return FALLBACK_FAKTA[randomIdx];
}

module.exports = async function (sock, chatId, message) {
    try {
        const fact = await fetchFact();
        await sock.sendMessage(chatId, { text: `Tuan~ Yuuki punya fakta: ${fact}` }, { quoted: message });
    } catch (error) {
        console.error('Error fetching fact:', error.message);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil fakta. Mungkin lain kali~'
        }, { quoted: message });
    }
};
