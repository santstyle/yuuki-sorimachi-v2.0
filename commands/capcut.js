const { capcut } = require('btch-downloader');
const path = require('path');
const fs = require('fs');

async function capCutCommand(sock, chatId, message, command) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        let url = '';
        if (command === '.capcut') {
            url = text.substring(8).trim();
        } else {
            url = text.split(' ').slice(1).join(' ').trim();
        }

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: 'Masukkan URL video CapCut yang valid\nContoh: .capcut <URL-CapCut>'
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(chatId, {
            text: 'Memproses link CapCut...'
        }, { quoted: message });

        const videoInfo = await capcut(url);

        if (!videoInfo.status) {
            return await sock.sendMessage(chatId, {
                text: `Gagal mendownload video CapCut\nError: ${videoInfo.message || 'Tidak diketahui'}`
            });
        }

        await sock.sendMessage(chatId, {
            text: 'Video ditemukan, mendownload...'
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `capcut_${Date.now()}.mp4`);

        await downloadFile(videoInfo.videoUrl, filePath);

        await sock.sendMessage(chatId, {
            text: `Download selesai\nMengirim file CapCut...`
        });

        const fileBuffer = fs.readFileSync(filePath);
        await sock.sendMessage(chatId, {
            video: fileBuffer,
            mimetype: 'video/mp4',
            fileName: `CapCut_${Date.now()}.mp4`
        });

        await sock.sendMessage(chatId, {
            text: '✅ Video Berhasil Didownload dan Dikirim!'
        });

        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) { }
        }, 5000);

    } catch (error) {
        console.error('CapCut command error:', error);
        await sock.sendMessage(chatId, {
            text: 'Terjadi kesalahan saat mendownload video CapCut.'
        }, { quoted: message });
    }
}

async function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const axios = require('axios');
        const writer = fs.createWriteStream(outputPath);

        axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000,
            maxContentLength: 50 * 1024 * 1024, // 50MB limit
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })
            .then(response => {
                response.data.pipe(writer);

                writer.on('finish', () => resolve());
                writer.on('error', reject);
            })
            .catch(reject);
    });
}

module.exports = capCutCommand;
