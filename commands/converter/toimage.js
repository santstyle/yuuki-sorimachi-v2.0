const sharp = require('sharp');
const fs = require('fs');
const fsPromises = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const scheduleFileDeletion = (filePath) => {
    setTimeout(async () => {
        try {
            await fse.remove(filePath);
            console.log(`File deleted: ${filePath}`);
        } catch (error) {
            console.error(`Failed to delete file:`, error);
        }
    }, 300000); // 5 menit
};

const convertSticker = async (sock, message, chatId, sender, args) => {
    try {
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const stickerMessage = quotedMessage?.stickerMessage || quotedMessage?.message?.stickerMessage;
        if (!stickerMessage) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Balas stiker dengan *.toimage* atau *.tovideo* untuk Yuuki konversi~'
            }, { quoted: message });
            return;
        }

        const isAnimated = stickerMessage.isAnimated || false;
        const command = args[0]?.toLowerCase() || 'toimage';

        const stickerFilePath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await fsPromises.writeFile(stickerFilePath, buffer);

        if (command === 'toimage' || command === '.toimage') {
            await convertToImage(sock, message, chatId, stickerFilePath, isAnimated);
        } else if (command === 'tovideo' || command === '.tovideo') {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Fitur konversi ke video sedang tidak tersedia. Gunakan *.toimage* untuk Yuuki konversi ke gambar~'
            }, { quoted: message });
            scheduleFileDeletion(stickerFilePath);
            return;
        } else {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Perintah tidak valid. Gunakan:\n*.toimage* - Konversi ke gambar\n*.tovideo* - Konversi ke video'
            }, { quoted: message });
            scheduleFileDeletion(stickerFilePath);
        }

    } catch (error) {
        console.error('Error converting sticker:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengonversi stiker. Pastikan stikernya valid~'
        }, { quoted: message });
    }
};

const convertToImage = async (sock, message, chatId, stickerFilePath, isAnimated) => {
    try {
        const outputImagePath = path.join(tempDir, `image_${Date.now()}.png`);

        if (isAnimated) {
            await sharp(stickerFilePath, { animated: true, pages: 1 })
                .toFormat('png')
                .toFile(outputImagePath);

            const imageBuffer = await fsPromises.readFile(outputImagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer
            }, { quoted: message });
        } else {
            await sharp(stickerFilePath)
                .toFormat('png')
                .toFile(outputImagePath);

            const imageBuffer = await fsPromises.readFile(outputImagePath);
            await sock.sendMessage(chatId, {
                image: imageBuffer
            }, { quoted: message });
        }

        scheduleFileDeletion(outputImagePath);
        scheduleFileDeletion(stickerFilePath);
    } catch (error) {
        console.error('Error converting to image:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengonversi ke gambar. Pastikan stikernya tidak rusak~'
        }, { quoted: message });
        scheduleFileDeletion(stickerFilePath);
    }
};



module.exports = convertSticker;
