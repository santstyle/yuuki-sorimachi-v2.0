const puppeteer = require('puppeteer');

let browser = null;

async function getBrowser() {
    if (!browser || !browser.isConnected()) {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled'
            ]
        });
    }
    return browser;
}

async function pinterestCommand(sock, chatId, message, input) {
    try {
        if (!input) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Gunakan: .pinterest <kata kunci>\nAlias: .pin\n\nContoh: .pinterest Rei Ayanami'
            }, { quoted: message });
            return;
        }

        await sock.sendPresenceUpdate('composing', chatId);

        const urls = await scrapePinterest(input);

        if (urls.length === 0) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki tidak menemukan gambar untuk "' + input + '"'
            }, { quoted: message });
            return;
        }

        const imageUrl = urls[Math.floor(Math.random() * urls.length)];

        await sock.sendMessage(chatId, {
            image: { url: imageUrl }
        }, { quoted: message });

    } catch (error) {
        console.error('Pinterest error:', error.message);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mencari gambar. Mungkin lain kali~'
        }, { quoted: message });
    }
}

async function scrapePinterest(query) {
    const urls = [];
    let tries = 0;

    while (tries < 2 && urls.length === 0) {
        tries++;
        let page = null;
        try {
            const b = await getBrowser();
            page = await b.newPage();

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await page.setViewport({ width: 1280, height: 800 });

            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', { get: () => false });
            });

            const searchUrl = 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(query) + '&rs=typed';
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 45000 });

            for (let i = 0; i < 30; i++) {
                try {
                    const results = await page.evaluate(() => {
                        const r = [];
                        document.querySelectorAll('img[src*="i.pinimg.com"]').forEach(img => {
                            if (img.src && !img.src.includes('favicon')) r.push(img.src);
                            if (img.srcset) {
                                img.srcset.split(',').forEach(p => {
                                    const u = p.trim().split(/\s+/)[0];
                                    if (u && !u.includes('favicon')) r.push(u);
                                });
                            }
                        });
                        return r;
                    });
                    if (results.length > 0) {
                        urls.push(...results);
                        break;
                    }
                } catch {}
                await new Promise(r => setTimeout(r, 1000));
            }

            if (urls.length === 0) {
                const content = await page.content().catch(() => '');
                urls.push(...extractFromContent(content));
            }
        } catch (e) {
            console.error('Pinterest scrape error (try ' + tries + '):', e.message);
        } finally {
            if (page) await page.close().catch(() => {});
        }
    }

    return [...new Set(urls.map(toOriginalUrl).filter(Boolean))];
}

function extractFromContent(html) {
    const urls = [];
    const regex = /https:\/\/i\.pinimg\.com\/\d+x\d+\/[^"'\s]+/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.push(match[0]);
    }
    return urls;
}

function toOriginalUrl(url) {
    const match = url.match(/^(https:\/\/i\.pinimg\.com\/)(\d+x(?:\d+)?)(\/.+)$/);
    if (match) {
        return match[1] + 'originals' + match[3];
    }
    return null;
}

module.exports = { pinterestCommand, scrapePinterest };
