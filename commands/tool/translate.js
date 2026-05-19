const axios = require('axios');

async function tryGoogle(text, lang) {
    try {
        const { data } = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
            params: { client: 'gtx', sl: 'auto', tl: lang, dt: 't', q: text },
            timeout: 8000
        });
        return data?.[0]?.[0]?.[0] || null;
    } catch { return null; }
}

async function tryMyMemory(text, lang) {
    try {
        const { data } = await axios.get(`https://api.mymemory.translated.net/get`, {
            params: { q: text, langpair: `auto|${lang}` },
            timeout: 8000
        });
        return data?.responseData?.translatedText || null;
    } catch { return null; }
}

async function tryLingva(text, lang) {
    const instances = [
        `https://lingva.ml/api/v1/auto/${lang}/${encodeURIComponent(text)}`,
        `https://lingva.gouden.me/api/v1/auto/${lang}/${encodeURIComponent(text)}`
    ];
    for (const url of instances) {
        try {
            const { data } = await axios.get(url, { timeout: 5000 });
            if (data?.translation) return data.translation;
        } catch {}
    }
    return null;
}

async function tryLibre(text, lang) {
    const instances = [
        'https://libretranslate.com',
        'https://translate.terraprint.co',
        'https://libretranslate.pussthecat.org'
    ];
    for (const base of instances) {
        try {
            const { data } = await axios.post(`${base}/translate`, {
                q: text, source: 'auto', target: lang, format: 'text'
            }, { headers: { 'Content-Type': 'application/json' }, timeout: 5000 });
            if (data?.translatedText) return data.translatedText;
        } catch {}
    }
    return null;
}

async function handleTranslateCommand(sock, chatId, message, match) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);

        let textToTranslate = '';
        let lang = '';

        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            textToTranslate = quotedMessage.conversation ||
                quotedMessage.extendedTextMessage?.text ||
                quotedMessage.imageMessage?.caption ||
                quotedMessage.videoMessage?.caption ||
                '';

            lang = match.trim();
        } else {
            const args = match.trim().split(' ');
            if (args.length < 2) {
                return sock.sendMessage(chatId, {
                    text: `Tuan~ Yuuki bisa bantu terjemahkan teks untuk Tuan~\n\nCara pakai:\n• Reply pesan dengan: .translate <kode bahasa>\n• Atau ketik: .translate <teks> <kode bahasa>\n\nContoh:\n.translate halo dunia fr\n.trt halo dunia fr\n\nKode bahasa:\nfr — Perancis   es — Spanyol   de — Jerman\nit — Italia     pt — Portugis  ru — Rusia\nja — Jepang     ko — Korea     zh — China\nar — Arab       hi — Hindi     id — Indonesia\nen — Inggris`,
                    quoted: message
                });
            }

            lang = args.pop(); 
            textToTranslate = args.join(' '); 
        }

        if (!textToTranslate) {
            return sock.sendMessage(chatId, {
                text: 'Tuan~ Teksnya mana? Beri Yuuki teks yang mau diterjemahkan atau reply pesannya~',
                quoted: message
            });
        }

        let translatedText = await tryGoogle(textToTranslate, lang);
        if (!translatedText) translatedText = await tryMyMemory(textToTranslate, lang);
        if (!translatedText) translatedText = await tryLingva(textToTranslate, lang);
        if (!translatedText) translatedText = await tryLibre(textToTranslate, lang);

        if (!translatedText) {
            throw new Error('Semua API penerjemah gagal');
        }

        await sock.sendMessage(chatId, {
            text: translatedText,
        }, {
            quoted: message
        });

    } catch (error) {
        console.error('Aduh, error di translate command nih:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal menerjemahkan. Mungkin lain kali~',
            quoted: message
        });
    }
}

module.exports = {
    handleTranslateCommand
};