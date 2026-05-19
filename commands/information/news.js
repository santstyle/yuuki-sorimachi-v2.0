const axios = require('axios');

const FALLBACK_NEWS = [
    { title: 'Pemerintah Indonesia Luncurkan Program Digitalisasi Nasional', description: 'Program ini bertujuan untuk mempercepat transformasi digital di seluruh sektor pemerintahan dan layanan publik.', source: 'Kominfo.go.id', url: 'https://www.kominfo.go.id' },
    { title: 'Timnas Indonesia Siap Berlaga di Kualifikasi Piala Dunia', description: 'Tim Garuda mempersiapkan diri dengan latihan intensif menjelang pertandingan kualifikasi mendatang.', source: 'PSSI.org', url: 'https://www.pssi.org' },
    { title: 'Harga Saham di Bursa Efek Indonesia Menguat', description: 'Indeks Harga Saham Gabungan (IHSG) ditutup menguat didorong oleh sektor teknologi dan perbankan.', source: 'IDX.co.id', url: 'https://www.idx.co.id' },
    { title: 'Kementerian Pendidikan Luncurkan Kurikulum Baru', description: 'Kurikulum baru fokus pada pengembangan karakter dan keterampilan digital bagi siswa.', source: 'Kemdikbud.go.id', url: 'https://www.kemdikbud.go.id' },
    { title: 'Curah Hujan Tinggi, BMKG Keluarkan Peringatan Dini', description: 'Badan Meteorologi mengimbau masyarakat di wilayah Jabodetabek untuk waspada terhadap potensi banjir.', source: 'BMKG.go.id', url: 'https://www.bmkg.go.id' },
    { title: 'Startup Indonesia Raih Pendanaan Internasional', description: 'Perusahaan rintisan asal Bandung berhasil mengumpulkan dana segar dari investor global.', source: 'TechInAsia.id', url: 'https://www.techinasia.com/id' },
    { title: 'Festival Budaya Nusantara Kembali Digelar di Jakarta', description: 'Acara tahunan ini menampilkan keragaman budaya dari 34 provinsi di Indonesia.', source: 'Kemendikbud.go.id', url: 'https://www.kemendikbud.go.id' },
    { title: 'Produksi Mobil Listrik Dalam Negeri Terus Meningkat', description: 'Pemerintah targetkan produksi mobil listrik mencapai 600.000 unit per tahun pada 2030.', source: 'ESDM.go.id', url: 'https://www.esdm.go.id' }
];

module.exports = async function (sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, {
            text: 'Tuan~ Mohon tunggu, Yuuki sedang mencari berita terbaru~'
        }, { quoted: message });

        let articles = [];
        try {
            const response = await axios.get(
                `https://newsapi.org/v2/top-headlines?country=id&apiKey=dcd720a6f1914e2d9dba9790c188c08c`,
                { timeout: 10000 }
            );
            articles = (response.data.articles || []).filter(a => a.title && a.title !== '[Removed]').slice(0, 5);
        } catch {
            articles = [];
        }

        if (articles.length === 0) {
            articles = FALLBACK_NEWS.sort(() => Math.random() - 0.5).slice(0, 5);
        }

        let newsMessage = 'Tuan~ Berita terbaru untuk Tuan\n\n';
        articles.forEach((article, index) => {
            const source = article.source?.name || article.source || 'NewsAPI';
            const url = article.url || article.url || '';
            newsMessage += `${index + 1}. ${article.title}\n${article.description || 'Tidak ada deskripsi'}\n${url ? `🔗 ${url}` : `Sumber: ${source}`}\n\n`;
        });

        newsMessage += 'Semoga bermanfaat untuk Tuan~';

        await sock.sendMessage(chatId, { text: newsMessage }, { quoted: message });
    } catch (error) {
        console.error('Error ambil berita:', error);
        const fallback = FALLBACK_NEWS.sort(() => Math.random() - 0.5).slice(0, 5);
        let newsMessage = 'Tuan~ Berita terbaru untuk Tuan\n\n';
        fallback.forEach((article, index) => {
            newsMessage += `${index + 1}. ${article.title}\n${article.description}\n🔗 ${article.url}\n\n`;
        });
        newsMessage += 'Semoga bermanfaat untuk Tuan~';
        await sock.sendMessage(chatId, { text: newsMessage }, { quoted: message });
    }
};
