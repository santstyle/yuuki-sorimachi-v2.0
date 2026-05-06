const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function toGif(sock, message, chatId) {
    try {
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = contextInfo?.quotedMessage;

        if (!contextInfo || !contextInfo.stanzaId) {
            return sock.sendMessage(chatId, { text: 'Reply stiker animasi dengan .togif untuk mengubahnya jadi GIF.' });
        }

        if (!quotedMsg || !quotedMsg.stickerMessage) {
            return sock.sendMessage(chatId, { text: 'Yang kamu reply bukan stiker! Reply stiker animasi ya.' });
        }

        await sock.sendMessage(chatId, { text: 'Sedang mengonversi stiker ke GIF...' }, { quoted: message });

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

        // Kirim hasil GIF
        // Tambahkan mimetype agar lebih kompatibel di WhatsApp
        await sock.sendMessage(chatId, {
            video: { url: resultUrl },
            mimetype: 'video/mp4',
            gifPlayback: true,
            caption: 'Stiker berhasil dikonversi ke GIF!'
        }, { quoted: message });

    } catch (error) {
        console.error('Error togif:', error);
        await sock.sendMessage(chatId, { text: 'Gagal mengonversi stiker ke GIF.' });
    }
}

module.exports = toGif;
