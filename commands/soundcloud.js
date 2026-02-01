const { soundcloud } = require('btch-downloader');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

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

// Fungsi utama untuk mengunduh dan mengirimkan audio ke WhatsApp
async function soundcloudCommand(sock, chatId, message) {
    await executeCommandWithRetry(sock, chatId, message, soundcloudCommandInternal);
}

async function soundcloudCommandInternal(sock, chatId, message) {
    let tempFile = null;

    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        let url = '';

        if (text.includes('.soundcloud ')) {
            url = text.split('.soundcloud ')[1].trim();
        }

        if (!url) {
            await sendMessageWithRetry(sock, chatId, { text: `SoundCloud Downloader\nFormat: .soundcloud <link-soundcloud>` }, { quoted: message });
            return;
        }

        await sendMessageWithRetry(sock, chatId, { text: `Memproses SoundCloud\nURL: ${url}\nMohon tunggu...` }, { quoted: message });

        // Mendapatkan informasi audio menggunakan btch-downloader
        const audioInfo = await soundcloud(url);

        if (!audioInfo.status || !audioInfo.audioUrl) {
            await sendMessageWithRetry(sock, chatId, { text: `Gagal Mendapatkan Audio\nError: ${audioInfo.message || 'Audio URL tidak ditemukan'}` });
            return;
        }

        await sendMessageWithRetry(sock, chatId, {
            text: 'Media ditemukan, mendownload...'
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `soundcloud_${Date.now()}.mp3`);

        await downloadFile(audioInfo.audioUrl, filePath);

        await sendMessageWithRetry(sock, chatId, {
            text: `Download selesai\nMengirim file SoundCloud...`
        });

        const fileBuffer = fs.readFileSync(filePath);
        await sendMessageWithRetry(sock, chatId, {
            audio: fileBuffer,
            mimetype: 'audio/mp3',
            fileName: `soundcloud_${Date.now()}.mp3`
        });

        await sendMessageWithRetry(sock, chatId, {
            text: '✅ Media Berhasil Didownload dan Dikirim!'
        });

    } catch (error) {
        console.error('SoundCloud download error:', error);
        await sendMessageWithRetry(sock, chatId, { text: `Error: ${error.message}` });

    } finally {
        if (tempFile && fs.existsSync(tempFile)) {
            setTimeout(() => {
                try {
                    fs.unlinkSync(tempFile);
                    console.log('Temp file cleaned');
                } catch (e) {
                    console.error('Gagal hapus temp file:', e.message);
                }
            }, 10000);
        }
    }
}

// Fungsi untuk menjalankan command dengan retry
async function executeCommandWithRetry(sock, chatId, message, commandFunction, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await commandFunction(sock, chatId, message);
            return; // Success, exit the loop
        } catch (error) {
            console.error(`Command execution attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) {
                throw error; // Re-throw after max retries
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
    }
}

// Fungsi untuk mendownload file menggunakan axios
async function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 120000, // Meningkatkan timeout menjadi 120 detik (2 menit)
            maxContentLength: 100 * 1024 * 1024, // Batas ukuran 100MB
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://soundcloud.com/'
            }
        })
            .then(response => {
                response.data.pipe(writer);
                writer.on('finish', resolve);
                writer.on('error', reject);
            })
            .catch(reject);
    });
}

module.exports = {
    soundcloud: soundcloudCommand
};
