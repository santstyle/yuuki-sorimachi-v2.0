const puppeteer = require('puppeteer');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: `Tuan~ Yuuki bisa screenshot website untuk Tuan~\n\nCara pakai:\n.ss <url>\n.ssweb <url>\n.screenshot <url>\n\nContoh:\n.ss https://google.com`,
            quoted: message
        });
        return;
    }

    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        const url = match.trim();

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return sock.sendMessage(chatId, {
                text: 'Tuan~ URL harus dimulai dari http:// atau https://~',
                quoted: message
            });
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const imageBuffer = await page.screenshot({ type: 'png' });
        await browser.close();

        await sock.sendMessage(chatId, {
            image: imageBuffer
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Error di ss command:', error);
        await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki gagal mengambil screenshot. Mungkin lain kali~',
            quoted: message
        });
    }
}

module.exports = {
    handleSsCommand
};