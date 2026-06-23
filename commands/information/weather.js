const axios = require('axios');

module.exports = async function (sock, chatId, city, message) {
    try {
        const apiKey = '4902c0f2550f58298ad4146a92b65e10';  
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const weather = response.data;

        const weatherText = `Tuan~ Cuaca di ${weather.name}:\n\n${weather.weather[0].description}\nSuhu: ${weather.main.temp}°C\nKelembaban: ${weather.main.humidity}%\nAngin: ${weather.wind.speed} m/s`;

        await sock.sendMessage(chatId, { text: weatherText }, { quoted: message });
    } catch (error) {
        console.error('Wah, ada error waktu ambil data cuaca nih:', error);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
        await sock.sendMessage(chatId, {
            text: isNetworkIssue
                ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
                : 'Maaf, Tuan~ Yuuki gagal mendapatkan data cuaca. Mungkin Tuan bisa cek nama kotanya lagi~'
        }, { quoted: message });
    }
};