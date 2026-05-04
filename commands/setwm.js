const fs = require('fs');
const crypto = require('crypto');
const webp = require('node-webpmux');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const prisma = require('../lib/db');

async function setWmCommand(sock, chatId, message, args, senderId) {
    try {
        const input = args.join(' ');
        let packname = input;
        let author = '';

        if (input) {
            const splitIndex = input.indexOf('|');
            if (splitIndex !== -1) {
                packname = input.substring(0, splitIndex).trim();
                author = input.substring(splitIndex + 1).trim();
            } else {
                author = '';
            }

            await prisma.user.upsert({
                where: { id: senderId },
                update: { 
                    packname: packname || null,
                    author: author || null
                },
                create: { 
                    id: senderId, 
                    packname: packname || null,
                    author: author || null 
                }
            });
        } else {
            // Jika tidak ada input, ambil dari DB untuk fitur steal (take)
            const user = await prisma.user.findUnique({ where: { id: senderId } });
            if (user && (user.packname || user.author)) {
                packname = `${user.packname || ''} | ${user.author || ''}`.trim();
                if (packname === '|') packname = 'Yuuki Bot';
            } else {
                packname = 'Yuuki Bot';
            }
        }

        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // Jika me-reply stiker, proses stikernya (fitur Take lama)
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
        } else if (input) {
            // Jika hanya menyimpan ke DB tanpa reply stiker
            await sock.sendMessage(chatId, { text: `✅ Watermark stiker default kamu berhasil disimpan!\n\n*Packname:* ${packname || '-'}\n*Author:* ${author || '-'}` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Format salah. Gunakan: .setwm [Nama Pack] | [Nama Author]\nAtau reply ke sebuah stiker dengan .setwm untuk mengambil stiker tersebut.' });
        }
    } catch (error) {
        console.error('Error in setwm command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat memproses watermark.' });
    }
}

module.exports = setWmCommand;
