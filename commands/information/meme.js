const axios = require('axios');

const API_URLS = [
    'https://meme-api.com/gimme',
    'https://candaan-api.vercel.app/api/image/random',
    'https://www.reddit.com/r/memes/random.json'
];

async function fetchMeme() {
    for (const url of API_URLS) {
        try {
            const response = await axios.get(url, {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'Yuuki-Bot/2.0'
                },
                timeout: 10000
            });
            if (url.includes('meme-api.com')) {
                const d = response.data;
                return { url: d.url, source: `r/${d.subreddit}` };
            } else if (url.includes('candaan-api')) {
                const d = response.data.data;
                return { url: d.url, source: d.source || 'Candaan API' };
            } else if (url.includes('reddit.com')) {
                const post = response.data[0]?.data?.children?.[0]?.data;
                if (post?.url && post?.subreddit) {
                    return { url: post.url, source: `r/${post.subreddit}` };
                }
            }
        } catch {
            continue;
        }
    }
    throw new Error('Semua API gagal');
}

async function memeCommand(sock, chatId, message) {
    try {
        const meme = await fetchMeme();

        await sock.sendMessage(chatId, {
            image: { url: meme.url },
            caption: `Source: ${meme.source}`,
            buttons: [
                { buttonId: '.meme', buttonText: { displayText: 'Another Meme' }, type: 1 },
                { buttonId: '.joke', buttonText: { displayText: 'Joke' }, type: 1 }
            ],
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('Error in meme command:', error.message);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
        await sock.sendMessage(chatId, {
            text: isNetworkIssue
                ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
                : 'Maaf, Tuan~ Yuuki gagal mengambil meme. Mungkin lain kali~'
        }, { quoted: message });
    }
}

module.exports = memeCommand;
