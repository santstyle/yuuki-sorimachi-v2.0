const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function convertToVideo(sock, message, chatId, sender) {
    try {
        // 1. Cek apakah ini pesan balasan (Reply)
        // Jika user cuma ketik .tovideo tanpa reply, ini akan undefined
        const extendedTextMsg = message.message?.extendedTextMessage;
        
        if (!extendedTextMsg) {
            return sock.sendMessage(chatId, { text: 'Tuan~ Reply stiker yang mau Yuuki ubah ke video dengan .tovideo~' }, { quoted: message });
        }

        const contextInfo = extendedTextMsg.contextInfo;
        const quotedMessage = contextInfo?.quotedMessage;

        // 2. Cek apakah data reply valid
        if (!contextInfo || !contextInfo.stanzaId) {
            return sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal membaca data reply. Pastikan Tuan membalas stiker dengan benar~' }, { quoted: message });
        }

        // 3. Cek apakah yang di-reply adalah STIKER
        if (!quotedMessage || !quotedMessage.stickerMessage) {
            return sock.sendMessage(chatId, { text: 'Tuan~ Yang Tuan reply bukan stiker! Reply stiker animasi ya~' }, { quoted: message });
        }

        await sock.sendMessage(chatId, { text: 'Mohon tunggu, Tuan~ Yuuki sedang mengonversi stiker ke video~' }, { quoted: message });

        // Siapkan object untuk didownload
        const msgToDownload = {
            key: {
                remoteJid: chatId,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant || sender
            },
            message: quotedMessage
        };

        // Download stiker
        const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!buffer) throw new Error('Gagal download stiker');

        // Kirim ke API Converter dengan timeout 120 detik dan 1x retry
        const apiUrl = 'https://nekochii-converter.hf.space/webp2mp4';
        let response;
        const tryConvert = async () => {
            try {
                return await axios.post(apiUrl, {
                    file: buffer.toString('base64'),
                    json: true
                }, { timeout: 120000 });
            } catch (error) {
                if (error.code === 'ECONNABORTED') {
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
        if (!resultUrl) throw new Error('API tidak mengembalikan URL video');

        // Kirim hasil video
        await sock.sendMessage(chatId, {
            video: { url: resultUrl },
            caption: 'Tuan~ Stiker berhasil Yuuki konversi ke video!'
        }, { quoted: message });

    } catch (error) {
        console.error('Error tovideo:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengonversi stiker. Mungkin lain kali~' }, { quoted: message });
    }
}

module.exports = convertToVideo;
