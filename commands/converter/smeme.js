const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const webp = require('node-webpmux');
const crypto = require('crypto');

const fontPath = path.join(__dirname, '../../assets/fonts/ObelixProB-cyr.ttf');
GlobalFonts.registerFromPath(fontPath, 'ObelixProB');

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function drawMemeText(ctx, text, canvasWidth, canvasHeight, isTop) {
    if (!text) return;

    const maxWidth = canvasWidth * 0.85;
    let fontSize = Math.floor(canvasWidth * 0.11);
    ctx.font = `900 ${fontSize}px ObelixProB`;

    let lines = wrapText(ctx, text, maxWidth);
    while (lines.length > 3 && fontSize > 16) {
        fontSize -= 2;
        ctx.font = `900 ${fontSize}px ObelixProB`;
        lines = wrapText(ctx, text, maxWidth);
    }

    const lineHeight = fontSize * 1.15;
    const totalTextHeight = lines.length * lineHeight;
    const strokeSize = Math.max(3, Math.floor(fontSize * 0.08));

    const startY = isTop ? canvasHeight * 0.08 : canvasHeight - totalTextHeight - canvasHeight * 0.1;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.letterSpacing = `${Math.floor(fontSize * 0.05)}px`;

    for (let i = 0; i < lines.length; i++) {
        const y = startY + i * lineHeight;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = strokeSize;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(lines[i], canvasWidth / 2, y);
        ctx.fillStyle = 'white';
        ctx.fillText(lines[i], canvasWidth / 2, y);
    }

    ctx.letterSpacing = '0px';
}

async function smemeCommand(sock, chatId, message, senderId) {
    const messageToQuote = message;

    let targetMessage = message;

    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        const quotedInfo = message.message.extendedTextMessage.contextInfo;
        targetMessage = {
            key: {
                remoteJid: chatId,
                id: quotedInfo.stanzaId,
                participant: quotedInfo.participant
            },
            message: quotedInfo.quotedMessage
        };
    }

    const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.stickerMessage;

    if (!mediaMessage) {
        await sock.sendMessage(chatId, {
            text: 'Mau bikin meme stiker? Reply gambar atau kirim gambar dengan caption:\n.smeme teks atas | teks bawah\n\nContoh:\n.smeme halo dunia\n.smeme atas | bawah'
        }, { quoted: messageToQuote });
        return;
    }

    const rawText = message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        message.message?.imageMessage?.caption || '';

    const textContent = rawText.replace(/^\.smeme\s*/i, '').trim();

    if (!textContent) {
        await sock.sendMessage(chatId, {
            text: 'Tulis teksnya dong, Tuan~\nContoh: .smeme halo dunia atau .smeme atas | bawah'
        }, { quoted: messageToQuote });
        return;
    }

    let topText = '';
    let bottomText = '';

    if (textContent.includes('|')) {
        const parts = textContent.split('|');
        topText = parts[0].trim().toUpperCase();
        bottomText = parts[1].trim().toUpperCase();
    } else {
        bottomText = textContent.toUpperCase();
    }

    try {
        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, {
            logger: undefined,
            reuploadRequest: sock.updateMediaMessage
        });

        if (!mediaBuffer) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Gambarnya tidak bisa diunduh. Coba kirim ulang ya~'
            }, { quoted: messageToQuote });
            return;
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        const tempInput = path.join(tmpDir, `smeme_input_${Date.now()}`);
        const tempPng = path.join(tmpDir, `smeme_png_${Date.now()}.png`);
        const tempOutput = path.join(tmpDir, `smeme_${Date.now()}.webp`);

        fs.writeFileSync(tempInput, mediaBuffer);

        const isWebP = mediaMessage.mimetype?.includes('webp');

        let imageBuffer = mediaBuffer;

        if (isWebP) {
            const localFfmpeg = path.join(__dirname, '../../ffmpeg', 'bin', 'ffmpeg.exe');
            const ffmpegPath = fs.existsSync(localFfmpeg) ? `"${localFfmpeg}"` : 'ffmpeg';

            await new Promise((resolve, reject) => {
                exec(`${ffmpegPath} -i "${tempInput}" "${tempPng}"`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
            imageBuffer = fs.readFileSync(tempPng);
        }

        const img = await loadImage(imageBuffer);

        const canvasSize = 512;
        const canvas = createCanvas(canvasSize, canvasSize);
        const ctx = canvas.getContext('2d');

        const scale = Math.min(canvasSize / img.width, canvasSize / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = (canvasSize - drawW) / 2;
        const offsetY = (canvasSize - drawH) / 2;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasSize, canvasSize);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        drawMemeText(ctx, topText, canvasSize, canvasSize, true);
        drawMemeText(ctx, bottomText, canvasSize, canvasSize, false);

        const pngBuffer = canvas.toBuffer('image/png');

        fs.writeFileSync(tempPng, pngBuffer);

        const localFfmpeg = path.join(__dirname, '../../ffmpeg', 'bin', 'ffmpeg.exe');
        const ffmpegPath = fs.existsSync(localFfmpeg) ? `"${localFfmpeg}"` : 'ffmpeg';

        const ffmpegCommand = `${ffmpegPath} -i "${tempPng}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    reject(error);
                } else resolve();
            });
        });

        const webpBuffer = fs.readFileSync(tempOutput);

        const webpImg = new webp.Image();
        await webpImg.load(webpBuffer);

        const prisma = require('../../lib/db');
        let wmName = '';

        try {
            const user = await prisma.user.findUnique({ where: { id: senderId } });
            if (user && user.packname) {
                wmName = user.packname;
            }
        } catch (e) {
            console.error('Error fetching user watermark:', e);
        }

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': wmName,
            'emojis': ['']
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        webpImg.exif = exif;

        const finalBuffer = await webpImg.save(null);

        await sock.sendMessage(chatId, {
            sticker: finalBuffer
        }, { quoted: messageToQuote });

        try {
            fs.unlinkSync(tempInput);
            if (fs.existsSync(tempPng)) fs.unlinkSync(tempPng);
            fs.unlinkSync(tempOutput);
        } catch (err) {
            console.error('Cleanup error:', err);
        }

    } catch (error) {
        console.error('Smeme command error:', error);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg);
        await sock.sendMessage(chatId, {
            text: isNetworkIssue
                ? 'Jaringan sedang lambat, coba lagi nanti ya Tuan~'
                : 'Maaf, Tuan~ Yuuki gagal membuat meme stikernya. Pastikan gambarnya valid ya~'
        }, { quoted: messageToQuote });
    }
}

module.exports = smemeCommand;
