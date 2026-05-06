const fs = require('fs');
const crypto = require('crypto');
const webp = require('node-webpmux');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const prisma = require('../../lib/db');

async function setWmCommand(sock, chatId, message, args, senderId) {
    try {
        const packname = args.join(' ');

        if (!packname) {
            await sock.sendMessage(chatId, { text: 'Format: .setwm [Nama Pack]\nAtau reply stiker untuk mengubah WM.' }, { quoted: message });
            return;
        }

        await prisma.user.upsert({
            where: { id: senderId },
            update: { 
                packname: packname || null,
                author: null
            },
            create: { 
                id: senderId, 
                packname: packname || null,
                author: null 
            }
        });

        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (quotedMessage?.stickerMessage) {
            try {
                const stickerBuffer = await downloadMediaMessage(
                    {
                        key: message.message.extendedTextMessage.contextInfo.stanzaId,
                        message: quotedMessage,
                        messageType: 'stickerMessage'
                    },
                    'buffer',
                    {},
                    { logger: console, reuploadRequest: sock.updateMediaMessage }
                );

                if (!stickerBuffer) return;

                const img = new webp.Image();
                await img.load(stickerBuffer);

                const json = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': packname,
                    'emojis': ['']
                };

                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);

                img.exif = exif;
                const finalBuffer = await img.save(null);

                await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: message });
            } catch (error) {
                console.error('Sticker modification error:', error);
                await sock.sendMessage(chatId, { text: 'Gagal mengubah watermark stiker.' });
            }
        } else {
            await sock.sendMessage(chatId, { text: `✅ Watermark stiker default berhasil disimpan!\n\n*Packname:* ${packname}` }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in setwm command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat memproses watermark.' });
    }
}

module.exports = setWmCommand;
