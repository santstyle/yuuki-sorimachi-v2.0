const axios = require('axios');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer'); // NEW

/**
 * Pinterest search via Puppeteer
 * - Ambil beberapa URL gambar
 * - Prefer resolusi besar (di URL Pinterest biasanya ada .../236x/ atau .../474x/ dll)
 */
async function pinterestImageSearch(query, { limit = 8, timeoutMs = 25000 } = {}) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });

        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

        for (let i = 0; i < 3; i++) {
            await page.waitForTimeout(1200);
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
        }

        const urls = await page.evaluate(() => {
            const out = new Set();

            document.querySelectorAll('img').forEach((img) => {
                const src = img.getAttribute('src') || img.src;
                if (!src) return;
                if (!src.startsWith('http')) return;

                if (src.includes('pinimg.com')) out.add(src);
            });

            return Array.from(out);
        });

        const upgraded = urls.map((u) => {
            return u
                .replace('/75x75_RS/', '/originals/')
                .replace('/236x/', '/736x/')
                .replace('/474x/', '/736x/');
        });

        const final = Array.from(new Set(upgraded)).slice(0, limit);

        return final;
    } catch (e) {
        console.error('Pinterest puppeteer search error:', e.message);
        return [];
    } finally {
        if (browser) {
            try { await browser.close(); } catch { }
        }
    }
}

async function downloadImage(imageUrl, outputPath) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);

        axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'stream',
            timeout: 30000,
            maxContentLength: 15 * 1024 * 1024,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            }
        })
            .then(res => {
                res.data.pipe(writer);

                writer.on('finish', () => {
                    try {
                        const stats = fs.statSync(outputPath);
                        if (stats.size < 1024) {
                            fs.unlinkSync(outputPath);
                            reject(new Error('File too small'));
                        } else resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                writer.on('error', reject);
                res.data.on('error', reject);
            })
            .catch(reject);
    });
}

async function pinCommand(sock, chatId, message, command) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        let query = '';
        if (command === '.pinterest') query = text.substring(11).trim();
        else if (command === '.pin') query = text.substring(5).trim();
        else query = text.split(' ').slice(1).join(' ').trim();

        if (!query) return await showHelp(sock, chatId, message);

        const processingMsg = await sendMessageWithRetry(sock, chatId, {
            text: `Mencari gambar Pinterest: ${query}...`
        }, { quoted: message });

        await searchAndSendImage(sock, chatId, message, query, processingMsg);

    } catch (error) {
        console.error('Pin command error:', error);
        await sendMessageWithRetry(sock, chatId, { text: 'Error' }, { quoted: message });
    }
}

async function searchAndSendImage(sock, chatId, message, query, processingMsg) {
    try {
        await sendMessageWithRetry(sock, chatId, {
            text: 'Mencari di Pinterest (Puppeteer)...',
            edit: processingMsg.key
        });

        const imageUrls = await pinterestImageSearch(query, { limit: 6 });

        if (!imageUrls || imageUrls.length === 0) {
            await sendMessageWithRetry(sock, chatId, {
                text: 'Tidak ada gambar ditemukan di Pinterest.',
                edit: processingMsg.key
            });
            return;
        }

        await sendMessageWithRetry(sock, chatId, {
            text: `Ditemukan ${imageUrls.length} gambar. Mengirim...`,
            edit: processingMsg.key
        });

        const tempDir = path.join(__dirname, '../temp/images');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const toSend = imageUrls.slice(0, 3);

        for (const url of toSend) {
            const fileName = `pin_${Date.now()}_${Math.random().toString(16).slice(2)}.jpg`;
            const filePath = path.join(tempDir, fileName);

            try {
                await downloadImage(url, filePath);
                await sock.sendMessage(chatId, { image: fs.readFileSync(filePath) }, { quoted: message });

                setTimeout(() => {
                    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { }
                }, 5000);
            } catch (e) {
                try {
                    await sock.sendMessage(chatId, { image: { url } }, { quoted: message });
                } catch {
                    await sock.sendMessage(chatId, { text: 'Gagal mengirim salah satu gambar.' }, { quoted: message });
                }
            }
        }

        await sendMessageWithRetry(sock, chatId, {
            text: 'Selesai ✅',
            edit: processingMsg.key
        });

    } catch (error) {
        console.error('Search error:', error);
        await sendMessageWithRetry(sock, chatId, {
            text: 'Error',
            edit: processingMsg.key
        });
    }
}

async function showHelp(sock, chatId, message) {
    await sendMessageWithRetry(sock, chatId, {
        text:
            'Pinterest Image Search (Puppeteer)\n\n' +
            'Command:\n' +
            '.pinterest <kata kunci>\n' +
            '.pin <kata kunci>\n\n' +
            'Contoh:\n' +
            '.pinterest cat\n' +
            '.pin landscape'
    }, { quoted: message });
}

async function simplePin(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const query = text.replace('.pin ', '').replace('.pinterest ', '').trim();

        if (!query) {
            return await sendMessageWithRetry(sock, chatId, { text: 'Gunakan: .pin <kata kunci>' }, { quoted: message });
        }

        const msg = await sendMessageWithRetry(sock, chatId, { text: 'Mencari ' + query + '...' }, { quoted: message });

        const imageUrls = await pinterestImageSearch(query, { limit: 1 });
        const imageUrl = imageUrls[0];

        if (!imageUrl) {
            await sendMessageWithRetry(sock, chatId, { text: 'Tidak ada gambar', edit: msg.key });
            return;
        }

        await sendMessageWithRetry(sock, chatId, { image: { url: imageUrl } }, { quoted: message });

        await sendMessageWithRetry(sock, chatId, { text: 'Selesai', edit: msg.key });

    } catch (error) {
        console.error('Simple pin error:', error);
        await sendMessageWithRetry(sock, chatId, { text: 'Error' });
    }
}

module.exports = {
    pinterest: pinCommand,
    pin: pinCommand,
    pins: pinCommand,
    simplepin: simplePin
};
