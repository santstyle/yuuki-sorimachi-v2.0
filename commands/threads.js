const { threads } = require('btch-downloader');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function threadsCommand(sock, chatId, message, command) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        let url = '';
        if (command === '.threads') {
            url = text.substring(8).trim();
        } else {
            url = text.split(' ').slice(1).join(' ').trim();
        }

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: 'Masukkan URL thread yang valid\nContoh: .threads <URL-Twitter-Thread>'
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(chatId, {
            text: 'Memproses thread...'
        }, { quoted: message });

        const threadInfo = await threads(url);

        if (!threadInfo.success) {
            return await sock.sendMessage(chatId, {
                text: `Gagal mendownload thread\nError: ${threadInfo.error || 'Tidak diketahui'}`
            });
        }

        await sock.sendMessage(chatId, {
            text: 'Thread ditemukan, mendownload...'
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `thread_${Date.now()}.zip`);

        await downloadFile(threadInfo.url, filePath);

        await sock.sendMessage(chatId, {
            text: `Download selesai\nMengirim file thread...`
        });

        const fileBuffer = fs.readFileSync(filePath);
        await sock.sendMessage(chatId, {
            document: fileBuffer,
            mimetype: 'application/zip',
            fileName: `Thread_${Date.now()}.zip`
        });

        await sock.sendMessage(chatId, {
            text: '✅ Thread Berhasil Didownload dan Dikirim!'
        });

        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) { }
        }, 5000);

    } catch (error) {
        console.error('Threads command error:', error);
        await sock.sendMessage(chatId, {
            text: 'Terjadi kesalahan saat memproses thread.'
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
            maxContentLength: 100 * 1024 * 1024, // 100MB limit
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

module.exports = threadsCommand;
