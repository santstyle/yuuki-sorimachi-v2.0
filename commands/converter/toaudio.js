const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function toAudio(sock, message, chatId, sender) {
    try {
        let quotedMessage = message.message?.videoMessage;
        let contextInfo = message.message?.extendedTextMessage?.contextInfo;

        if (contextInfo?.quotedMessage) {
            quotedMessage = contextInfo.quotedMessage.videoMessage || contextInfo.quotedMessage.documentMessage;
        }

        if (!quotedMessage) {
            return sock.sendMessage(chatId, { text: 'Reply video yang mau diubah ke audio dengan .toaudio atau .tomp3' });
        }

        await sock.sendMessage(chatId, { text: 'Sedang mengonversi video ke audio...' }, { quoted: message });

        let msgToDownload;

        if (contextInfo?.stanzaId) {
            msgToDownload = {
                key: {
                    remoteJid: chatId,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant || sender
                },
                message: contextInfo.quotedMessage
            };
        } else {
            msgToDownload = message;
        }

        const buffer = await downloadMediaMessage(msgToDownload, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!buffer) throw new Error('Gagal download video');

        const apiUrl = 'https://nekochii-converter.hf.space/mp4tomp3';

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
        if (!resultUrl) throw new Error('API tidak mengembalikan URL audio');

        await sock.sendMessage(chatId, {
            audio: { url: resultUrl },
            mimetype: 'audio/mpeg'
        }, { quoted: message });

    } catch (error) {
        console.error('Error toaudio:', error);
        await sock.sendMessage(chatId, { text: 'Gagal mengonversi video ke audio.' });
    }
}

module.exports = toAudio;
