
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function broadcastCommand(sock, chatId, message, args) {
    try {
        const sender = message.key?.participant || message.key?.remoteJid;
        const ownerNumber = process.env.OWNER_NUMBER;
        const ownerLid = process.env.OWNER_LID;
        console.log('Broadcast - sender:', sender, 'ownerNumber:', ownerNumber, 'ownerLid:', ownerLid);

        let isOwner = false;
        if (ownerNumber) {
            const ownerJid = ownerNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            if (sender === ownerJid) isOwner = true;
        }
        if (ownerLid) {
            const ownerLidJid = ownerLid.replace(/[^0-9]/g, '') + '@lid';
            if (sender === ownerLidJid) isOwner = true;
        }
        if (!isOwner) {
            return sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menggunakan kekuatan broadcast ini. Yuuki tidak ingin dimarahi Tuan, jadi Yuuki patuh~' }, { quoted: message });
        }
        if (!ownerNumber && !ownerLid) {
            return sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Nomor owner belum dikonfigurasi di file .env.' }, { quoted: message });
        }

        let bcText = args.join(' ') || '';
        if (bcText.trim().startsWith('.bc')) bcText = bcText.replace(/^\.bc\s*/i, '');

        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!bcText && !quotedMsg) {
            return sock.sendMessage(chatId, { text: 'Tuan~ Yuuki perlu tahu pesan apa yang ingin di-broadcast, atau reply media yang ingin di-broadcast. Contoh: .bc Halo semua~' }, { quoted: message });
        }

        console.log('Broadcast - Fetching groups...');
        const allGroups = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(allGroups);
        console.log('Broadcast - Groups found:', groupIds.length);

        let success = 0;
        let failed = 0;

        for (const groupId of groupIds) {
            try {
                let msgOptions = {};

                if (quotedMsg) {
                    const type = Object.keys(quotedMsg)[0];
                    let buffer;

                    if (!['conversation', 'extendedTextMessage'].includes(type)) {
                        buffer = await downloadMediaMessage({ message: quotedMsg }, 'buffer', {}, { logger: console });
                    }

                    switch (type) {
                        case 'imageMessage':
                            msgOptions = {
                                image: buffer,
                                caption: `*Broadcast dari SantStyle*\n\n${bcText || quotedMsg.imageMessage?.caption || ''}`
                            };
                            break;
                        case 'videoMessage':
                            msgOptions = {
                                video: buffer,
                                caption: `*Broadcast dari SantStyle*\n\n${bcText || quotedMsg.videoMessage?.caption || ''}`
                            };
                            break;
                        case 'audioMessage':
                            msgOptions = {
                                audio: buffer,
                                mimetype: quotedMsg.audioMessage?.mimetype || 'audio/mp4',
                                ptt: quotedMsg.audioMessage?.ptt || false
                            };
                            break;
                        case 'stickerMessage':
                            msgOptions = { sticker: buffer };
                            break;
                        case 'documentMessage':
                            msgOptions = {
                                document: buffer,
                                mimetype: quotedMsg.documentMessage?.mimetype,
                                fileName: quotedMsg.documentMessage?.fileName || 'file'
                            };
                            break;
                        default:
                            msgOptions = { text: `*Broadcast dari SantStyle*\n\n${bcText}` };
                    }
                } else {
                    msgOptions = { text: `*Broadcast dari SantStyle*\n\n${bcText}` };
                }

                await sock.sendMessage(groupId, msgOptions);
                success++;
            } catch (err) {
                console.error(`Gagal broadcast ke ${groupId}:`, err);
                failed++;
            }
        }

        await sock.sendMessage(chatId, {
            text: `Tuan~ Broadcast telah Yuuki selesaikan!\nSukses: ${success}, Gagal: ${failed}\n\nYuuki berharap semua pesan Tuan sampai dengan indah~ Tapi Yuuki penasaran, apa isi pesannya? Ah, Yuuki terlalu kepo~`
        }, { quoted: message });
    } catch (error) {
        console.error('[BROADCAST ERROR]:', error);
        await sock.sendMessage(chatId, {
            text: `Maaf, Tuan~ Broadcast gagal: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = broadcastCommand;
