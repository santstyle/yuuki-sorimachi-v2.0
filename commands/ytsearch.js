const { ytSearch } = require('btch-downloader');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function ytSearchCommand(sock, chatId, message, command) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        let query = '';

        if (command === '.ytsearch') {
            query = text.substring(9).trim();
        } else {
            query = text.split(' ').slice(1).join(' ').trim();
        }

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: 'Masukkan kata kunci pencarian\nContoh: .ytsearch <kata kunci>'
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(chatId, {
            text: 'Mencari video YouTube...'
        }, { quoted: message });

        const results = await ytSearch(query);

        if (!results || results.length === 0) {
            return await sock.sendMessage(chatId, {
                text: 'Tidak ada hasil ditemukan'
            });
        }

        const firstResult = results[0];
        const videoUrl = firstResult.url;

        await sock.sendMessage(chatId, {
            text: `Video ditemukan: ${firstResult.title}\nURL: ${videoUrl}`
        });

        const videoBuffer = await downloadFile(videoUrl);
        await sock.sendMessage(chatId, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            fileName: `ytsearch_${Date.now()}.mp4`
        });

    } catch (error) {
        console.error('Error in ytsearch command:', error);
        await sock.sendMessage(chatId, {
            text: 'Terjadi kesalahan'
        }, { quoted: message });
    }
}

async function downloadFile(url) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `video_${Date.now()}.mp4`);
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000
        })
            .then(response => {
                response.data.pipe(writer);
                writer.on('finish', () => resolve(fs.readFileSync(filePath)));
                writer.on('error', reject);
            })
            .catch(reject);
    });
}

module.exports = ytSearchCommand;
