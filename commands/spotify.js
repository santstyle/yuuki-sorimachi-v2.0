const { spotify } = require('btch-downloader');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Fungsi untuk mengirim pesan dengan retry
async function sendMessageWithRetry(sock, chatId, content, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await sock.sendMessage(chatId, content);
            return; // Success, exit the loop
        } catch (error) {
            console.error(`Send message attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw error; // Re-throw after max retries
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

async function spotifyCommand(sock, chatId, message, command) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        let url = '';
        if (command === '.spotify') {
            url = text.substring(9).trim();
        } else {
            url = text.split(' ').slice(1).join(' ').trim();
        }

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: 'Masukkan URL Spotify yang valid.\nContoh: .spotify <URL-Spotify>'
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(chatId, {
            text: 'Memproses link Spotify...'
        }, { quoted: message });

        const mediaInfo = await spotify(url);

        if (!mediaInfo.status) {
            return await sock.sendMessage(chatId, {
                text: `Gagal mendownload media Spotify\nError: ${mediaInfo.message || 'Tidak diketahui'}`
            });
        }

        await sock.sendMessage(chatId, {
            text: 'Media ditemukan, mendownload...'
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `spotify_${Date.now()}.mp3`);

        // Download file media
        await downloadFile(mediaInfo.audioUrl, filePath);

        await sendMessageWithRetry(sock, chatId, {
            text: `Download selesai\nMengirim file Spotify...`
        });

        // Kirim file audio ke WhatsApp
        const fileBuffer = fs.readFileSync(filePath);
        await sendMessageWithRetry(sock, chatId, {
            audio: fileBuffer,
            mimetype: 'audio/mp3',
            fileName: `Spotify_${Date.now()}.mp3`
        });

        await sendMessageWithRetry(sock, chatId, {
            text: '✅ Media Berhasil Didownload dan Dikirim!'
        });

        // Bersihkan file setelah beberapa detik
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) { }
        }, 5000);

    } catch (error) {
        console.error('Spotify command error:', error);
        await sendMessageWithRetry(sock, chatId, {
            text: 'Terjadi kesalahan saat mendownload Spotify.'
        }, { quoted: message });
    }
}

async function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);

        axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 30000,
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

module.exports = spotifyCommand;
