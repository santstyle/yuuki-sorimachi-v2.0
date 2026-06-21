const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const scheduleFileDeletion = (filePath) => {
    setTimeout(async () => {
        try {
            await fse.remove(filePath);
        } catch (error) {
            console.error(`Failed to delete file:`, error);
        }
    }, 300000);
};

async function toGif(sock, message, chatId) {
    try {
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = contextInfo?.quotedMessage;

        if (!contextInfo || !contextInfo.stanzaId) {
            return sock.sendMessage(chatId, { text: 'Tuan~ Reply stiker animasi dengan .togif untuk Yuuki ubah jadi GIF~' }, { quoted: message });
        }

        if (!quotedMsg || !quotedMsg.stickerMessage) {
            return sock.sendMessage(chatId, { text: 'Tuan~ Yang Tuan reply bukan stiker! Reply stiker animasi ya~' }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: 'Mohon tunggu, Tuan~ Yuuki sedang mengonversi stiker ke GIF~' }, { quoted: message });

        const msgToDownload = {
            key: {
                remoteJid: chatId,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant
            },
            message: quotedMsg
        };

        const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!buffer) throw new Error('Buffer kosong');

        // Kirim ke API Converter dengan timeout 120 detik dan 1x retry
        const apiUrl = 'https://nekochii-converter.hf.space/webp2gif';
        let response;
        const tryConvert = async () => {
            try {
                return await axios.post(apiUrl, {
                    file: buffer.toString('base64'),
                    json: true
                }, { timeout: 120000 });
            } catch (error) {
                if (error.code === 'ECONNABORTED') {
                    // Jika timeout (biasanya karena server 'tidur'), coba sekali lagi
                    return await axios.post(apiUrl, {
                        file: buffer.toString('base64'),
                        json: true
                    }, { timeout: 120000 });
                }
                throw error;
            }
        };

        response = await tryConvert();

        const resultUrl = response.data?.result;
        if (!resultUrl) throw new Error('API tidak mengembalikan URL GIF');

        // Download hasil dari API (GIF)
        const gifResponse = await axios.get(resultUrl, { responseType: 'arraybuffer' });
        const gifBuffer = Buffer.from(gifResponse.data);

        // Konversi GIF ke MP4 dengan ffmpeg
        const inputPath = path.join(tempDir, `gif_${Date.now()}.gif`);
        const outputPath = path.join(tempDir, `gif_${Date.now()}.mp4`);
        await fs.promises.writeFile(inputPath, gifBuffer);

        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-movflags faststart',
                    '-pix_fmt yuv420p',
                    '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'
                ])
                .toFormat('mp4')
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        const mp4Buffer = await fs.promises.readFile(outputPath);
        scheduleFileDeletion(inputPath);
        scheduleFileDeletion(outputPath);

        // Kirim hasil GIF (sebagai video MP4 dengan gifPlayback)
        await sock.sendMessage(chatId, {
            video: mp4Buffer,
            mimetype: 'video/mp4',
            gifPlayback: true,
            caption: 'Tuan~ Stiker berhasil Yuuki konversi ke GIF!'
        }, { quoted: message });

    } catch (error) {
        console.error('Error togif:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengonversi stiker ke GIF. Mungkin lain kali~' }, { quoted: message });
    }
}

module.exports = toGif;
