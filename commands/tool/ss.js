const fetch = require('node-fetch');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: `Tuan~ Fitur Screenshot\n\n.ss <url>\n.ssweb <url>\n.screenshot <url>\n\nBuat screenshot website apapun\n\nContoh:\n.ss https://google.com\n.ssweb https://google.com\n.screenshot https://google.com`,
            quoted: message
        });
        return;
    }

    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        await sock.sendMessage(chatId, {
            text: 'Tuan~ Mohon tunggu, Yuuki sedang mengambil screenshot~',
            quoted: message
        });

        const url = match.trim();

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return sock.sendMessage(chatId, {
                text: 'Tuan~ URL harus dimulai dari http:// atau https://~',
                quoted: message
            });
        }

        const apiUrl = `https://api.siputzx.my.id/api/tools/ssweb?url=${encodeURIComponent(url)}&theme=light&device=desktop`;
        const response = await fetch(apiUrl, { headers: { 'accept': '*/*' } });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const imageBuffer = await response.buffer();

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: 'Tuan~ Ini screenshotnya~'
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Error di ss command:', error);
        await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki gagal mengambil screenshot. Mungkin lain kali~\n\nKemungkinan:\n• URL tidak valid\n• Website tidak bisa di-screenshot\n• Sedang down\n• API sedang istirahat~',
            quoted: message
        });
    }
}

module.exports = {
    handleSsCommand
};