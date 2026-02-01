const { drive } = require('btch-downloader');
const path = require('path');
const fs = require('fs');

async function googleDriveCommand(sock, chatId, message, command) {
    try {
        const text = message.message?.conversation ||
            message.message?.extendedTextMessage?.text ||
            message.message?.imageMessage?.caption ||
            '';

        let url = '';
        if (command === '.googledrive') {
            url = text.substring(13).trim();
        } else {
            url = text.split(' ').slice(1).join(' ').trim();
        }

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: 'Masukkan URL Google Drive yang valid\nContoh: .googledrive <URL-Google-Drive>'
            }, { quoted: message });
        }

        const processingMsg = await sock.sendMessage(chatId, {
            text: 'Memproses link Google Drive...'
        }, { quoted: message });

        const fileInfo = await drive(url);

        if (!fileInfo.success) {
            return await sock.sendMessage(chatId, {
                text: `Gagal mendownload file Google Drive\nError: ${fileInfo.error || 'Tidak diketahui'}`
            });
        }

        if (fileInfo.fileSize > 100 * 1024 * 1024) {
            return await sock.sendMessage(chatId, {
                text: 'Maaf, file di Google Drive terlalu besar. Maksimal file 100MB.'
            });
        }

        await sock.sendMessage(chatId, {
            text: 'File ditemukan, mendownload...'
        });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filePath = path.join(tempDir, `drive_${Date.now()}.mp4`);

        await downloadFile(fileInfo.fileUrl, filePath);

        await sock.sendMessage(chatId, {
            text: `Download selesai\nMengirim file Google Drive...`
        });

        const fileBuffer = fs.readFileSync(filePath);
        await sock.sendMessage(chatId, {
            document: fileBuffer,
            mimetype: fileInfo.mimeType,
            fileName: `GoogleDrive_${Date.now()}.mp4`
        });

        await sock.sendMessage(chatId, {
            text: '✅ File Berhasil Didownload dan Dikirim!'
        });

        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) { }
        }, 5000);

    } catch (error) {
        console.error('Google Drive command error:', error);
        await sock.sendMessage(chatId, {
            text: 'Terjadi kesalahan saat mendownload file Google Drive.'
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

module.exports = googleDriveCommand;
