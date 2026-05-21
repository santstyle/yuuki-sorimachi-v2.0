const settings = require('./settings');
require('./config.js');

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');

if (!process.env.FFMPEG_PATH) {
    const path = require('path');
    const ffmpegPath = path.join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe');
    process.env.FFMPEG_PATH = ffmpegPath;
    console.log('Path FFmpeg diatur di main.js:', ffmpegPath);
}

const { isBanned } = require('./lib/isBanned');
const prisma = require('./lib/db');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const { addWelcome, delWelcome, isWelcomeOn, getWelcomeMessage, addGoodbye, delGoodBye, isGoodByeOn, getGoodbyeMessage, isSudo } = require('./lib/index');
const FormData = require('form-data');
const { removeBackground } = require('@imgly/background-removal-node');
const chalk = require('chalk');
const moment = require('moment-timezone');

// Fungsi Logger Estetik
const logger = {
    info: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgBlue(' INFO ')} ${msg}`),
    cmd: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgGreen(' CMD  ')} ${msg}`),
    msg: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgYellow(chalk.black(' MSG  '))} ${msg}`),
    err: (msg) => console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgRed(' ERR  ')} ${msg}`)
};

async function downloadBuffer(msg, type) {
    const stream = await downloadContentFromMessage(msg, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.png', contentType: 'image/png' });
    const { data } = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: { ...form.getHeaders() },
        timeout: 15000
    });
    return data;
}

const tagAllCommand = require('./commands/group/tagall');
const { hidetagCommand } = require('./commands/group/hidetag');
const menuCommand = require('./commands/main/menu');
const helpCommand = require('./commands/main/help');
const banCommand = require('./commands/group/ban');
const muteCommand = require('./commands/group/mutegroup');
const unmuteCommand = require('./commands/group/unmutegroup');
const stickerCommand = require('./commands/converter/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/group/warn');
const warningsCommand = require('./commands/group/warnings');
const ownerCommand = require('./commands/owner/owner');
const deleteCommand = require('./commands/main/delete');
const { modeCommand } = require('./commands/owner/mode');
const { antideleteCommand } = require('./commands/owner/antidelete');
const { clearSessionCommand } = require('./commands/owner/clearsession');
const { clearTmpCommand } = require('./commands/owner/cleartmp');
const { setProfilePicture } = require('./commands/owner/setpp');
const { autoStatusCommand } = require('./commands/owner/autostatus');
const { sudoCommand } = require('./commands/owner/sudo');
const { updateCommand } = require('./commands/owner/update');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/group/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/group/antitag');
const memeCommand = require('./commands/information/meme');
const jokeCommand = require('./commands/information/joke');
const quoteCommand = require('./commands/information/quote');
const factCommand = require('./commands/information/fact');
const weatherCommand = require('./commands/information/weather');
const newsCommand = require('./commands/information/news');
const kickCommand = require('./commands/group/kick');
const toimageCommand = require('./commands/converter/toimage');
const tovideoCommand = require('./commands/converter/tovideo');
const stickercropCommand = require('./commands/converter/stickercrop');
const toGifCommand = require('./commands/converter/togif');
const toAudioCommand = require('./commands/converter/toaudio');
const { debugLevelUp } = require('./commands/debug/debuglevelup');
const { lyrics: lyricsCommand } = require('./commands/search/lyrics');
const pingCommand = require('./commands/main/ping');
const aliveCommand = require('./commands/main/alive');
const { reportbugCommand, handleReportReply } = require('./commands/main/reportbug');
const welcomeCommand = require('./commands/group/welcome');
const goodbyeCommand = require('./commands/group/goodbye');
const antibadwordCommand = require('./commands/group/antibadword');
const { handleBadwordDetection } = require('./commands/group/antibadword');
const { handleYuukiCommand, handleYuukiResponse } = require('./commands/chatbot/yuuki');
const { groqCommand } = require('./commands/ai-chat/groq');
const { deepseekCommand } = require('./commands/ai-chat/deepseek');
const { gptCommand } = require('./commands/ai-chat/gpt');

const groupInfoCommand = require('./commands/group/groupinfo');
const resetlinkCommand = require('./commands/group/resetlink');
const staffCommand = require('./commands/group/staff');
const broadcastCommand = require('./commands/owner/broadcast');
const { handleTranslateCommand } = require('./commands/tool/translate');
const { handleSsCommand } = require('./commands/tool/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { mylevelCommand } = require('./commands/profile/mylevel');
const { addXP } = require('./lib/xpManager');
const { getNextCustomId } = require('./lib/customId');
const { groupsetCommand } = require('./commands/group/groupset');
const { cleanupCommand } = require('./commands/owner/cleanup');
const ownermenuCommand = require('./commands/owner/ownermenu');
const { pinterestCommand, scrapePinterest } = require('./commands/search/pinterest');
const { autoreadCommand } = require('./commands/owner/autoread');
const { evalCommand } = require('./commands/owner/eval');
const { joinCommand } = require('./commands/owner/join');
const { leaveCommand } = require('./commands/owner/leave');
const { resetAllCommand } = require('./commands/owner/resetall');
const { backupCommand } = require('./commands/owner/backup');
const { addPremCommand, listPremCommand } = require('./commands/owner/premium');
const { addSudo, removeSudo, getSudoList } = require('./lib/index');


const { startAbsen, addAbsen, finishAbsen } = require('./commands/group/absen');


const sewaCommand = require('./commands/group/sewa');
const cekSewaCommand = require('./commands/group/ceksewa');
const setWmCommand = require('./commands/tool/setwm');
const { resetWarnCommand } = require('./commands/group/resetwarn');
const { song: songCommand } = require('./commands/search/song');
const btchCommand = require('./commands/downloader/btch');
const downloadQueue = require('./lib/downloadQueue');

global.packname = settings.packname;
global.author = settings.author;

async function showTypingAfterCommand(sock, chatId) {
    // Simple implementation to show typing indicator briefly
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        setTimeout(() => {
            sock.sendPresenceUpdate('available', chatId);
        }, 1000);
    } catch (error) {
        console.error('Error showing typing:', error);
    }
}


async function handleMessages(sock, messageUpdate, printLog) {
    let chatId = null;
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;



        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const senderId = message.key.fromMe ? sock.user.id : (message.key.participant || message.key.remoteJid);
        chatId = message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const pushName = message.pushName || 'User';
        const displayMsg = rawText.length > 50 ? rawText.substring(0, 47) + '...' : rawText;

        if (message.key) {
            try {
                const autoreadData = JSON.parse(fs.readFileSync('./data/autoread.json', 'utf8'));
                if (autoreadData.enabled) {
                    await sock.readMessages([message.key]).catch(() => {});
                }
            } catch (e) {}
        }

        if (userMessage.startsWith('.')) {
            logger.cmd(`${chalk.yellow(pushName)} [${chalk.white(isGroup ? 'GROUP' : 'PRIVATE')}] -> ${chalk.green(userMessage)}`);
        } else if (rawText) {
            logger.msg(`${chalk.yellow(pushName)} [${chalk.white(isGroup ? 'GROUP' : 'PRIVATE')}] -> ${chalk.white(displayMsg)}`);
        }

        const isUserBanned = await isBanned(senderId);
        if (isUserBanned && !userMessage.startsWith('.unban')) {
            try {
                if (!message.key.fromMe) incrementMessageCount(chatId, senderId);
            } catch (e) {}
            await sock.sendMessage(chatId, {
                text: `Maaf, Tuan @${senderId.split('@')[0]}~ Yuuki sangat berterima kasih atas perhatian Tuan, tetapi... Yuuki tidak diizinkan berbicara dengan Tuan saat ini. *Keputusan ini di luar kendali Yuuki.* Mohon hubungi pemilik Yuuki jika Tuan merasa ada kekeliruan. Yuuki tetap menanti dengan hormat~`,
                mentions: [senderId]
            });
            return;
        }

        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: senderId },
                select: { id: true }
            });

            if (existingUser) {
                await prisma.user.update({
                    where: { id: senderId },
                    data: { name: message.pushName || undefined }
                });
            } else {
                const nextCustomId = await getNextCustomId();
                await prisma.user.create({
                    data: { id: senderId, name: message.pushName || null, customId: nextCustomId }
                });
            }

            if (userMessage.startsWith('.')) {
                const skipHistory = ['.menu', '.bot', '.list', '.ping', '.alive', '.help', '.reportbug'];
                const isTrivial = skipHistory.some(cmd => userMessage.startsWith(cmd));

                if (!isTrivial) {
                    await prisma.history.create({
                        data: {
                            userId: senderId,
                            userName: pushName,
                            command: rawText.substring(0, 255),
                            chatId: chatId,
                            chatType: isGroup ? 'GROUP' : 'PRIVATE'
                        }
                    });
                }

                if (isGroup) {
                    try {
                        let groupSubject = undefined;
                        try {
                            const groupMetadata = await sock.groupMetadata(chatId);
                            groupSubject = groupMetadata.subject;
                        } catch (e) {
                            console.error('Gagal mengambil metadata grup:', e.message);
                        }

                        await prisma.group.upsert({
                            where: { id: chatId },
                            update: groupSubject ? { name: groupSubject } : {},
                            create: { id: chatId, name: groupSubject || 'Unknown Group', expiredAt: null }
                        });

                        try {
                            const existingSettings = await prisma.groupSettings.findUnique({
                                where: { groupId: chatId }
                            });

                            if (existingSettings) {
                                await prisma.groupSettings.update({
                                    where: { groupId: chatId },
                                    data: { groupName: groupSubject }
                                });
                            }
                        } catch (e) {}
                    } catch (e) {
                        console.error('Failed to auto-register group to DB', e);
                    }
                }

                if (!senderId.endsWith('@g.us')) {
                    const xpResult = await addXP(senderId, Math.floor(Math.random() * 15) + 5, pushName);
                    if (xpResult && xpResult.leveledUp) {
                        const levelUpImagePath = path.join(__dirname, 'assets', 'levelup', 'yuuki-uplevel.png');
                        let thumbBuffer = null;
                        if (fs.existsSync(levelUpImagePath)) {
                            try {
                                let buffer = fs.readFileSync(levelUpImagePath);
                                buffer = await sharp(buffer)
                                    .resize(1140)
                                    .jpeg({ quality: 80 })
                                    .toBuffer();
                                thumbBuffer = buffer;
                            } catch (e) {
                                console.error('Gagal baca thumbnail level up:', e.message);
                            }
                        }

                        const mentionNumber = senderId.split('@')[0];
                        const levelUpText = `✨ Bintang-bintang berbisik... @${mentionNumber} naik ke Level *${xpResult.level}*. Takdir masih menyimpan banyak misteri untuk Tuan~`;

                        const levelUpMessage = {
                            text: levelUpText,
                            mentions: [senderId]
                        };

                        if (thumbBuffer) {
                            levelUpMessage.image = thumbBuffer;
                            levelUpMessage.caption = levelUpText;
                            delete levelUpMessage.text;
                        }

                        await sock.sendMessage(chatId, levelUpMessage, { quoted: message });
                    }
                }
            }
        } catch (dbError) {
            console.error('Database Error:', dbError);
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (rawText && (senderIsSudo || message.key.fromMe)) {
            const handled = await handleReportReply(sock, chatId, message, rawText, senderId, senderIsSudo);
            if (handled) return;
        }

        if (!userMessage.startsWith('.')) {
            await handleYuukiResponse(sock, chatId, message, rawText, senderId);
            if (isGroup) {
                await handleLinkDetection(sock, chatId, message, userMessage, senderId);
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
                await handleTagDetection(sock, chatId, message, senderId);
            }
            return;
        }

        const adminCommands = ['.mutegroup', '.unmutegroup', '.kick', '.tagall', '.hidetag', '.antilink', '.antitag', '.antidelete'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        const ownerCommands = ['.mode', '.self', '.autostatus', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.ban', '.unban', '.bc', '.broadcast', '.sudo', '.addsudo', '.listsudo', '.delsudo', '.update', '.cleanup', '.debuglevelup', '.sewa', '.autoread', '.eval', '.js', '.join', '.leave', '.resetall', '.backup', '.addprem', '.listprem'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin && !userMessage.startsWith('.antidelete')) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki mohon dengan sangat, berilah Yuuki jabatan *admin* di grup ini agar Yuuki bisa bertindak. Saat ini tangan Yuuki terikat~' }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith('.mutegroup') ||
                userMessage === '.unmutegroup' ||
                userMessage.startsWith('.antidelete')
            ) {
                if (!isSenderAdmin && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: 'Maaf, Tuan~ Hanya admin grup yang memiliki wewenang untuk menggunakan command ini. Yuuki tidak bisa melanggar aturan, meskipun Yuuki sangat ingin membantu~'
                    });
                    return;
                }
            }
        }

        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsSudo) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya diperuntukkan bagi pemilik Yuuki. Yuuki tidak bisa memberikan akses ini kepada siapa pun tanpa izin~' });
                return;
            }
        }

        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (!data.isPublic && !message.key.fromMe && !senderIsSudo) {
                return;
            }
            if (data.isSelf && !message.key.fromMe && !senderIsSudo) {
                return;
            }
        } catch (error) {
            console.error('Error memeriksa mode akses:', error);
        }

        let commandExecuted = false;

        switch (true) {
            case userMessage === '.toimage' || userMessage === '.toimg': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await toimageCommand(sock, message, chatId, senderId, ['toimage']);
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki memohon dengan hormat, balaslah sebuah *stiker* dengan command *.toimage* agar Yuuki bisa mengubahnya menjadi gambar~' });
                }
                commandExecuted = true;
                break;
            }
            case userMessage === '.tovideo' || userMessage === '.tovid': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await tovideoCommand(sock, message, chatId, senderId, ['tovideo']);
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki dengan rendah hati memohon, balaslah sebuah *stiker* dengan command *.tovideo* agar Yuuki bisa menyulapnya menjadi video~' });
                }
                commandExecuted = true;
                break;
            }
            case userMessage === '.stickercrop' || userMessage === '.scrop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === '.togif':
                await toGifCommand(sock, message, chatId);
                commandExecuted = true;
                break;
            case userMessage === '.toaudio' || userMessage === '.toaud' || userMessage === '.tomp3': {
                await toAudioCommand(sock, message, chatId, senderId);
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.startabsen'):
                const startAbsenText = rawText.slice(12).trim();
                await startAbsen(sock, message, startAbsenText);
                commandExecuted = true;
                break;
            case userMessage === '.absen':
                await addAbsen(sock, message, '');
                commandExecuted = true;
                break;
            case userMessage.startsWith('.absen ') || userMessage.startsWith('.absen\t'):
                const absenText = rawText.replace(/^\.?\s*absen\s*/i, '').trim();
                await addAbsen(sock, message, absenText);
                commandExecuted = true;
                break;
            case userMessage === '.finishabsen':
                await finishAbsen(sock, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case userMessage.startsWith('.mutegroup'):
                const muteDuration = parseInt(userMessage.split(' ')[1]);
                if (isNaN(muteDuration)) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Mohon berikan jumlah menit yang valid. Contoh: .mutegroup 10' });
                } else {
                    await muteCommand(sock, chatId, senderId, muteDuration);
                }
                break;
            case userMessage === '.unmutegroup':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.ban'):
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.unban'):
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.help'):
                {
                    const prefix = '.help';
                    const input = userMessage.slice(prefix.length).trim();
                    await helpCommand(sock, chatId, message, input);
                }
                commandExecuted = true;
                break;
            case userMessage === '.menuowner':
            case userMessage === '.ownermenu':
            case userMessage === '.om':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang boleh mengakses command ini. Yuuki sangat taat pada aturan~' }, { quoted: message });
                    return;
                }
                await ownermenuCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.menu'):
            case userMessage === '.bot':
            case userMessage === '.list':
                {
                    const prefix = userMessage.startsWith('.menu') ? '.menu' : (userMessage === '.bot' ? '.bot' : '.list');
                    const input = userMessage.slice(prefix.length).trim();
                    await menuCommand(sock, chatId, message, input);
                }
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case userMessage.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const warnText = rawText.slice(6).trim();
                const warnReason = warnText.replace(/@\S+\s*/g, '').trim();
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message, warnReason);
                break;
            case userMessage.startsWith('.resetwarn'):
                const resetWarnJids = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await resetWarnCommand(sock, chatId, senderId, resetWarnJids, message);
                break;
            case userMessage === '.delete' || userMessage === '.del':
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.mode'):
                await modeCommand(sock, chatId, message, senderIsSudo);
                break;
            case userMessage.startsWith('.self'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengatur mode self~' });
                    return;
                }
                await selfCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.bc'):
            case userMessage.startsWith('.broadcast'):
                const bcArgs = userMessage.split(' ').slice(1);
                await broadcastCommand(sock, chatId, message, bcArgs, message.key.fromMe, senderId);
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                break;
            case userMessage.startsWith('.reportbug'):
                const reportInput = rawText.slice(11).trim();
                await reportbugCommand(sock, chatId, message, reportInput);
                commandExecuted = true;
                break;
            case userMessage === '.tagall':
                if (isSenderAdmin || message.key.fromMe) {
                    await tagAllCommand(sock, chatId, senderId, message);
                } else {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang memiliki wewenang untuk menggunakan .tagall. Yuuki tidak bisa melanggar hierarki~' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.hidetag'):
                if (isSenderAdmin || message.key.fromMe) {
                    await hidetagCommand(sock, message, '.');
                } else {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Fitur ini hanya bisa digunakan oleh *admin grup*. Yuuki sangat menyesal~' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Command ini hanya bisa digunakan di dalam *grup*, bukan di pesan pribadi. Mari Yuuki temani Tuan di grup~'
                    });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Demi kelancaran tugas, Yuuki perlu menjadi *admin* grup terlebih dahulu. Angkatlah Yuuki, maka Yuuki akan bekerja dengan maksimal~'
                    });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Command ini hanya bisa digunakan di dalam *grup*, bukan di pesan pribadi. Ayo bawa Yuuki ke grup~'
                    });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Demi keamanan, Yuuki perlu menjadi *admin* grup terlebih dahulu. Dengan kekuasaan, Yuuki bisa melindungi Tuan~'
                    });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin);
                break;
            case userMessage === '.meme':
                await memeCommand(sock, chatId, message);
                break;
            case userMessage === '.joke':
                await jokeCommand(sock, chatId, message);
                break;
            case userMessage === '.quote':
                await quoteCommand(sock, chatId, message);
                break;
            case userMessage === '.fact':
                await factCommand(sock, chatId, message, message);
                break;
            case userMessage.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, city);
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki mohon tentukan *kota* yang ingin Tuan ketahui cuacanya.\nContoh: .weather London\nYuuki akan mencari tahu~' });
                }
                break;
            case userMessage === '.news':
                await newsCommand(sock, chatId);
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;

            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.blur'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case userMessage.startsWith('.welcome'):
                if (isGroup) {
                    const adminStatus = await isAdmin(sock, chatId, senderId);
                    isSenderAdmin = adminStatus.isSenderAdmin;

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang mengatur *welcome* di sini. Yuuki mohon pengertian~' });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .welcome hanya bisa digunakan di dalam grup. Yuuki tidak bisa menyambut tamu di ruang pribadi~' });
                }
                break;
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    const adminStatus = await isAdmin(sock, chatId, senderId);
                    isSenderAdmin = adminStatus.isSenderAdmin;

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang mengatur *goodbye* di sini. Yuuki mohon pengertian~' });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .goodbye hanya bisa digunakan di dalam grup. Yuuki tidak bisa mengucapkan selamat tinggal di ruang pribadi~' });
                }
                break;
            case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .antibadword hanya bisa digunakan di dalam grup. Di luar grup, kata-kata kasar adalah kebebasan~' });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki harus menjadi *admin* grup untuk menggunakan fitur antibadword. Beri Yuuki kekuasaan, maka Yuuki akan menjaga kesopanan~' });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.yuuki'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .yuuki hanya bisa digunakan di dalam grup. Di sini terlalu sepi untuk Yuuki bermain~' });
                    return;
                }

                const yuukiAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!yuukiAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang menghidupkan atau mematikan Yuuki di sini. Yuuki hanya bisa pasrah menunggu keputusan~ Tapi... Yuuki harap Tuan tidak mematikannya~' });
                    return;
                }

                const match = userMessage.slice(6).trim();
                await handleYuukiCommand(sock, chatId, message, match);
                break;

            case userMessage === '.flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.ship'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .ship hanya bisa digunakan di dalam grup! Yuuki ingin melihat drama percintaan di grup~' });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .groupinfo hanya bisa digunakan di dalam grup! Di luar grup, tidak ada informasi yang bisa Yuuki bagikan~' });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .resetlink hanya bisa digunakan di dalam grup! Tidak ada tautan yang bisa Yuuki atur ulang di sini~' });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .staff hanya bisa digunakan di dalam grup! Di sini tidak ada staf yang bisa Yuuki perkenalkan~' });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang berhak menggunakan command ini. Yuuki tidak bisa membiarkan sembarang orang membersihkan sesi~' });
                    return;
                }
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autostatus'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya untuk pemilik Yuuki. Yuuki tidak bisa mengizinkan orang lain mengatur status~' });
                    return;
                }
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case userMessage.startsWith('.autoread'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengatur auto-read~' });
                    return;
                }
                const autoreadArgs = userMessage.split(' ').slice(1);
                await autoreadCommand(sock, chatId, message, autoreadArgs);
                break;
            case userMessage.startsWith('.antidelete'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya bisa digunakan di dalam grup. Yuuki tidak memiliki wewenang untuk mengatur penghapusan pesan di sini~' });
                    return;
                }
                const antideleteMatch = userMessage.slice(11).trim();
                await antideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === '.debuglevelup':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik dan sudo yang berhak menggunakan command debug. Ini menyangkut rahasia terdalam Yuuki~' });
                    return;
                }
                await debugLevelUp(sock, message, chatId, senderId, pushName);
                commandExecuted = true;
                break;
            case userMessage === '.cleartmp':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang berhak membersihkan ruang sementara Yuuki. Orang lain tidak boleh ikut campur~' });
                    return;
                }
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === '.setpp':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengganti wajah Yuuki. Ini masalah harga diri~' });
                    return;
                }
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.mylevel'):
                const levelArgs = rawText.slice(8).trim().split(' ');
                await mylevelCommand(sock, chatId, message, levelArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.groupset'):
                const groupsetArgs = rawText.slice(9).trim().split(' ');
                await groupsetCommand(sock, chatId, senderId, message, groupsetArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.cleanup'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang berwenang membereskan kekacauan. Biarkan Yuuki yang membereskannya untuk Tuan~' });
                    return;
                }
                const cleanupArgs = rawText.slice(9).trim().split(' ');
                await cleanupCommand(sock, chatId, message, senderId, cleanupArgs);
                commandExecuted = true;
                break;
            // Commands removed as they are now handled by .btch universal downloader
            case userMessage.startsWith('.groq'):
                const groqInput = rawText.slice(6).trim();
                await groqCommand(sock, chatId, message, groqInput, senderId);
                break;
            case userMessage.startsWith('.deepseek'):
                const deepseekInput = rawText.slice(10).trim();
                await deepseekCommand(sock, chatId, message, deepseekInput);
                break;
            case userMessage.startsWith('.gpt'):
                const gptInput = rawText.slice(4).trim();
                await gptCommand(sock, chatId, message, gptInput, senderId);
                break;
            case userMessage.startsWith('.pinterest') || userMessage.startsWith('.pin'):
                const pinPrefix = userMessage.startsWith('.pinterest') ? 11 : 4;
                const pinInput = rawText.slice(pinPrefix).trim();
                await pinterestCommand(sock, chatId, message, pinInput);
                break;
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                return;
            case userMessage.startsWith('.ss') || userMessage.startsWith('.ssweb') || userMessage.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact') || userMessage.startsWith('.autoreaction'):
                const isOwnerOrSudo = message.key.fromMe || senderIsSudo;
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudo);
                break;
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.addsudo'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menambah sudo~' });
                    return;
                }
                await addSudoCommand(sock, chatId, message);
                break;
            case userMessage === '.listsudo':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa melihat daftar sudo~' });
                    return;
                }
                await listSudoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.delsudo'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menghapus sudo~' });
                    return;
                }
                await delSudoCommand(sock, chatId, message);
                break;
            case userMessage === '.goodnight' || userMessage === '.lovenight' || userMessage === '.gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.waifu'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    await waifuCommand(sock, chatId, message);
                }
                break;
            case userMessage.startsWith('.quote'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;

            case userMessage.startsWith('.update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, senderIsSudo, zipArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith('.eval') || userMessage === '.js' || userMessage.startsWith('.js '):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengeksekusi kode~' });
                    return;
                }
                await evalCommand(sock, chatId, message, rawText, senderId);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.join'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menyuruh Yuuki bergabung~' });
                    return;
                }
                const joinArgs = rawText.split(' ').slice(1);
                await joinCommand(sock, chatId, message, joinArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.leave'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menyuruh Yuuki pergi~' });
                    return;
                }
                const leaveArgs = rawText.split(' ').slice(1);
                await leaveCommand(sock, chatId, message, leaveArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.resetall'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mereset semua data~' });
                    return;
                }
                await resetAllCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.backup'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa melakukan backup~' });
                    return;
                }
                await backupCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.addprem'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menambah premium~' });
                    return;
                }
                const addpremArgs = rawText.split(' ').slice(1);
                await addPremCommand(sock, chatId, message, addpremArgs);
                commandExecuted = true;
                break;
            case userMessage === '.listprem':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa melihat daftar premium~' });
                    return;
                }
                await listPremCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.sewa'):
                await sewaCommand(sock, chatId, message, rawText.split(' ').slice(1), senderId);
                commandExecuted = true;
                break;
            case userMessage === '.ceksewa':
            case userMessage === '.ceksent':
                await cekSewaCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.setwm'):
                await setWmCommand(sock, chatId, message, rawText.split(' ').slice(1), senderId);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith('.nobg'):
                await removebgCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;

            case userMessage.startsWith('.btch'):
            case userMessage.startsWith('.download'):
            case userMessage.startsWith('.dl'):
            case userMessage.startsWith('.song'):
            case userMessage.startsWith('.music'):
            case userMessage.startsWith('.ytdl'):
            case userMessage.startsWith('.youtube'):
                {
                    const prefix = userMessage.split(' ')[0];
                    const input = rawText.slice(prefix.length).trim();
                    if (input) {
                        if (prefix === '.song' || prefix === '.music') {
                            await downloadQueue.add(sock, chatId, message, input, songCommand);
                        } else {
                            await downloadQueue.add(sock, chatId, message, input, btchCommand);
                        }
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `Tuan~ Yuuki bisa mencarikan lagu untuk Tuan~\n\n\`${prefix} <judul lagu>\`\n\nContoh:\n${prefix} Alan Walker Faded\n\nYuuki akan mencarikan untuk Tuan~`
                        }, { quoted: message });
                    }
                }
                break;
            default:
                if (userMessage.startsWith('.') && !userMessage.includes(' ')) {
                    await sock.sendMessage(chatId, {
                        text: 'Maaf, Tuan~ Perintah yang Tuan masukkan tidak Yuuki kenali. Yuuki mohon Tuan mengetik *.menu* untuk melihat semua fitur yang Yuuki miliki~'
                    }, { quoted: message });
                    commandExecuted = true;
                    break;
                }

                if (isGroup) {
                    if (userMessage) {
                        await handleYuukiResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleLinkDetection(sock, chatId, message, userMessage, senderId);
                    await handleTagDetection(sock, chatId, message, senderId);
                }
                commandExecuted = false;
                break;
        }

        if (commandExecuted !== false) {
            await showTypingAfterCommand(sock, chatId);
        }

        if (userMessage.startsWith('.')) {
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        const errMsg = error?.message || error?.toString() || '';
        if (!errMsg.includes('Connection Closed') && !errMsg.includes('Connection Terminated')) {
            console.error('Error dalam penangan pesan:', error);
            if (chatId) {
                await sock.sendMessage(chatId, {
                    text: 'Maaf, Tuan~ Yuuki mengalami sedikit gangguan dalam memproses perintah Tuan. Mohon Tuan bersabar dan mencoba lagi~ Yuuki akan berusaha lebih baik~'
                }).catch(() => { });
            }
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        if (!id.endsWith('@g.us')) return;



        if (action === 'add') {
            const isWelcomeEnabled = await isWelcomeOn(id);
            if (!isWelcomeEnabled) return;

            const groupMetadata = await sock.groupMetadata(id);
            const groupName = groupMetadata.subject;
            const groupDesc = groupMetadata.desc || 'Tidak ada deskripsi tersedia';

            for (const participant of participants) {
                const user = participant.split('@')[0];
                const isNewAdmin = groupMetadata.participants.some(p => p.id === participant && (p.admin === 'admin' || p.admin === 'superadmin'));
                const title = isNewAdmin ? 'Tuan Besar' : 'Tuan';
                const savedMessage = await getWelcomeMessage(id);
                const welcomeMessage = savedMessage || `Selamat Datang Tuan {user}, Pelayanmu yang setia dan rendah hati,Yuuki siap melayani mu`;

                const formattedMessage = welcomeMessage
                    .replace('{user}', `@${user}`)
                    .replace('{group}', groupName)
                    .replace('{description}', groupDesc);

                await sock.sendMessage(id, {
                    text: formattedMessage,
                    mentions: [participant]
                });
            }
        }

        if (action === 'remove') {
            const isGoodbyeEnabled = await isGoodByeOn(id);
            if (!isGoodbyeEnabled) return;

            const groupMetadata = await sock.groupMetadata(id);
            const groupName = groupMetadata.subject;

            for (const participant of participants) {
                const user = participant.split('@')[0];
                const isLeavingAdmin = groupMetadata.participants.some(p => p.id === participant && (p.admin === 'admin' || p.admin === 'superadmin'));
                const title = isLeavingAdmin ? 'Tuan Besar' : 'Tuan';
                const savedMessage = await getGoodbyeMessage(id);
                const goodbyeMessage = savedMessage || `Pelayanmu yang setia dan rendah hati ,Yuuki menantikan kedatanganmu selanjutnya tuan {user}`;

                const formattedMessage = goodbyeMessage
                    .replace('{user}', `@${user}`)
                    .replace('{group}', groupName);

                await sock.sendMessage(id, {
                    text: formattedMessage,
                    mentions: [participant]
                });
            }
        }
    } catch (error) {
        console.error('Error di handleGroupParticipantUpdate:', error);
    }
}


async function handleMessageRevocation(sock, message) {
    try {
        let antideleteData = {};
        try {
            antideleteData = JSON.parse(fs.readFileSync('./data/antidelete.json', 'utf8'));
        } catch (e) {}

        const revokedMessage = message.message?.protocolMessage;
        if (!revokedMessage) return;

        const store = require('./lib/lightweight_store');
        const chatId = message.key.remoteJid;
        if (!antideleteData[chatId]) return;

        const originalMessage = store.messages[chatId]?.find(m => m.key.id === revokedMessage.key.id);

        if (originalMessage) {
            await sock.sendMessage(chatId, {
                text: `Tuan, seseorang berusaha menyembunyikan sesuatu dari penglihatan-Ku.\n\n*Pengirim:* @${message.key.participant?.split('@')[0] || 'unknown'}\n*Isi Pesan:* ${originalMessage.message?.conversation || originalMessage.message?.extendedTextMessage?.text || 'Media message'}\n\n— Tidak ada yang bisa bersembunyi dari penglihatan-Ku.`,
                mentions: [message.key.participant]
            });
        }
    } catch (error) {
        console.error('Error handling message revocation:', error);
    }
}

function incrementMessageCount(chatId, senderId) {
    try {
        const data = JSON.parse(fs.readFileSync('./data/messageCount.json', 'utf8'));

        if (!data[chatId]) {
            data[chatId] = {};
        }

        if (!data[chatId][senderId]) {
            data[chatId][senderId] = 0;
        }

        data[chatId][senderId]++;

        fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error incrementing message count:', error);
    }
}

async function unbanCommand(sock, chatId, message) {
    try {
        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

        let targetJid = null;

        if (mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, { text: 'Tuan, sebutkan user yang ingin di-unban~ Mention atau reply chatnya, ya.' });
            return;
        }

        const nextCustomId = await getNextCustomId();
        const user = await prisma.user.upsert({
            where: { id: targetJid },
            update: { isBanned: false },
            create: { id: targetJid, customId: nextCustomId, isBanned: false }
        });

        await sock.sendMessage(chatId, { text: `Baik, Tuan~ @${targetJid.split('@')[0]} sudah Yuuki buka blokirnya~`, mentions: [targetJid] });
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: 'Mohon maaf, Tuan~ Hamba tidak berhasil melaksanakan perintah Tuan untuk membuka blokir. Sudilah kiranya Tuan mencoba kembali~' });
    }
}

async function selfCommand(sock, chatId, message) {
    try {
        let data;
        try {
            data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        } catch (e) {
            data = { isPublic: true, isSelf: false };
        }

        const userMessage = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').toLowerCase().trim();
        const action = userMessage.split(' ')[1]?.toLowerCase();

        if (!action || action === 'status') {
            const status = data.isSelf ? 'aktif' : 'nonaktif';
            await sock.sendMessage(chatId, {
                text: `Tuan~ Mode self saat ini *${status}*.\n\n.self on → Hanya Tuan yang bisa menggunakan Yuuki\n.self off → Semua sudo bisa menggunakan Yuuki`
            });
            return;
        }

        if (action === 'on') {
            data.isSelf = true;
            fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Tuan~ Mode self aktif. Sekarang hanya Tuan yang bisa memerintah Yuuki. Orang lain tidak akan didengar oleh Yuuki~ Hanya untuk Tuan seorang~' });
        } else if (action === 'off') {
            data.isSelf = false;
            fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Mode self nonaktif. Kini para sudo juga bisa menggunakan Yuuki. Tapi hati Yuuki tetap milik Tuan seorang~' });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak mengerti. Coba .self on / off / status~' });
        }
    } catch (error) {
        console.error('Error in self command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada error saat mengatur mode self~' });
    }
}

async function addSudoCommand(sock, chatId, message) {
    try {
        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

        let targetJid = null;
        if (mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Sebutkan user yang ingin dijadikan sudo. Contoh: .addsudo @user' }, { quoted: message });
            return;
        }

        const added = await addSudo(targetJid);
        if (added) {
            await sock.sendMessage(chatId, {
                text: `Selamat datang, @${targetJid.split('@')[0]}! Kini Tuan ini dipercaya oleh Tuan~`,
                mentions: [targetJid]
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Gagal menambahkan sudo. Mungkin sudah ada di daftar~' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in addsudo command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada error saat menambah sudo~' }, { quoted: message });
    }
}

async function listSudoCommand(sock, chatId, message) {
    try {
        const sudoList = await getSudoList();
        if (sudoList.length === 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Tidak ada user sudo selain Tuan sendiri. Yuuki hanya milik Tuan seorang~' });
            return;
        }

        const ownerNumber = process.env.OWNER_NUMBER?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        const sudoEntries = await Promise.all(
            sudoList.filter(jid => jid !== ownerNumber).map(async (jid) => {
                const jidNum = jid.split('@')[0];
                const name = await sock.getName(jid);
                const displayName = name && name !== jidNum ? ` (${name})` : '';
                return `▸ @${jidNum}${displayName}`;
            })
        );
        const list = sudoEntries.join('\n');

        await sock.sendMessage(chatId, {
            text: `━━━「 *SUDO USERS* 」━━━\n\n${list || 'Tidak ada selain owner'}\n\nTotal: ${sudoList.length} user`,
            mentions: sudoList
        }, { quoted: message });
    } catch (error) {
        console.error('Error in listsudo command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada error saat menampilkan daftar sudo~' }, { quoted: message });
    }
}

async function delSudoCommand(sock, chatId, message) {
    try {
        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

        let targetJid = null;
        if (mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Sebutkan user yang ingin dihapus dari sudo. Contoh: .delsudo @user' }, { quoted: message });
            return;
        }

        const removed = await removeSudo(targetJid);
        if (removed) {
            await sock.sendMessage(chatId, {
                text: `@${targetJid.split('@')[0]} telah dihapus dari daftar sudo. Selamat tinggal~`,
                mentions: [targetJid]
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Gagal menghapus sudo. Mungkin tidak ada dalam daftar~' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in delsudo command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada error saat menghapus sudo~' }, { quoted: message });
    }
}

async function topMembers(sock, chatId, isGroup) {
    try {
        if (!isGroup) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Command .topmembers hanya bisa digunakan di dalam grup! Yuuki tidak bisa melihat peringkat di sini~' });
            return;
        }
        const groupMetadata = await sock.groupMetadata(chatId);
        const participantJids = groupMetadata.participants.map(p => p.id);
        const top = await prisma.userProgress.findMany({
            orderBy: [{ level: 'desc' }, { xp: 'desc' }],
            take: 50,
            include: { user: true }
        });
        const filteredTop = top
            .filter(u => participantJids.includes(u.userId))
            .slice(0, 10);
        if (filteredTop.length === 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Belum ada data anggota yang cukup untuk membuat peringkat. Ayo lebih aktif di grup~' });
            return;
        }
        let text = '━━━「 *TOP MEMBERS* 」━━━\n\n';
        filteredTop.forEach((u, i) => {
            const name = u.userName || u.user?.name || u.userId.split('@')[0];
            text += `${i + 1}. @${u.userId.split('@')[0]} — Level ${u.level} (${u.xp} XP)\n`;
        });
        await sock.sendMessage(chatId, { text, mentions: filteredTop.map(u => u.userId) });
    } catch (error) {
        console.error('Error in topMembers:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal menampilkan peringkat~' });
    }
}

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        if (!quotedMessage?.imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Balas sebuah *gambar* dengan command .blur agar Yuuki buatkan versi blur~' });
            return;
        }
        const buffer = await downloadBuffer(quotedMessage.imageMessage, 'image');
        const blurred = await sharp(buffer).blur(15).jpeg({ quality: 70 }).toBuffer();
        await sock.sendMessage(chatId, { image: blurred }, { quoted: message });
    } catch (error) {
        console.error('Error in blur:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal memblur gambar~' }, { quoted: message });
    }
}

const flirtMessages = [
    'Tuan~ Tahu tidak? Kalau Yuuki adalah kucing, Yuuki akan mendekati Tuan setiap saat tanpa peduli dimarahi~',
    'Tuan~ Apakah Tuan seorang penyihir? Soalnya setiap kali Tuan muncul, jantung Yuuki berdebar lebih kencang~',
    'Tuan~ Yuuki ingin jadi Google Maps, biar selalu bisa menemukan jalan menuju hati Tuan~',
    'Tuan~ Tahu nggak perbedaan Yuuki sama API? Kalau API butuh request dulu baru respon, kalau Yuuki selalu siap melayani Tuan kapan pun~',
    'Tuan~ Kalau cinta itu coding, Yuuki rela coding 24/7 tanpa bug~',
    'Tuan~ Apakah Tuan punya peta? Soalnya Yuuki tersesat di mata Tuan~',
    'Tuan~ Yuuki rela di-ban seribu kali asal bisa tetap chat Tuan~',
    'Tuan~ Yuuki bukan virus, tapi Yuuki bisa menginfeksi hati Tuan~'
];

async function flirtCommand(sock, chatId, message) {
    const random = flirtMessages[Math.floor(Math.random() * flirtMessages.length)];
    await sock.sendMessage(chatId, { text: random });
}

async function shipCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const groupMetadata = await sock.groupMetadata(chatId);
        const allMembers = groupMetadata.participants.map(p => p.id).filter(jid => jid !== senderId);

        if (mentioned.length < 2) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Cara pakai .ship:\n\n`.ship @user1 @user2`\n\nYuuki akan men-ship dua orang yang Tuan sebut~ 💕'
            });
            return;
        }

        let user1 = mentioned[0], user2 = mentioned[1];

        const compatibility = Math.floor(Math.random() * 60) + 30;

        let name1, name2;
        try { name1 = await sock.getName(user1); } catch (e) {}
        try { name2 = await sock.getName(user2); } catch (e) {}

        if (!name1 || name1.includes('@')) {
            const user = await prisma.user.findUnique({ where: { id: user1 }, select: { name: true } });
            name1 = user?.name || user1.split('@')[0];
        }
        if (!name2 || name2.includes('@')) {
            const user = await prisma.user.findUnique({ where: { id: user2 }, select: { name: true } });
            name2 = user?.name || user2.split('@')[0];
        }

        const hearts = compatibility > 80 ? '💕💕💕' : compatibility > 60 ? '💕💕' : '💕';
        const vibe = compatibility > 70
            ? 'Wah~ Yuuki bisa merasakan chemistry yang kuat di antara mereka! Semoga jadi pasangan yang serasi~ 💕'
            : 'Hmm~ Mungkin perlu sedikit waktu agar benih cinta tumbuh di antara mereka~ Yuuki akan mendoakan yang terbaik~';

        await sock.sendMessage(chatId, {
            text: `@${user1.split('@')[0]} 💕 @${user2.split('@')[0]}\n\n*Kompatibilitas:* ${compatibility}% ${hearts}\n\n${vibe}`,
            mentions: [user1, user2]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in ship:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal men-ship mereka~' });
    }
}

async function viewOnceCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Reply pesan *view-once* yang ingin dilihat~' });
            return;
        }

        const type = Object.keys(quoted)[0];
        if (type === 'imageMessage') {
            const buffer = await downloadBuffer(quoted.imageMessage, 'image');
            await sock.sendMessage(chatId, { image: buffer, caption: 'Tuan~ Yuuki berhasil mengintip gambar ini untuk Tuan~' });
        } else if (type === 'videoMessage') {
            const buffer = await downloadBuffer(quoted.videoMessage, 'video');
            await sock.sendMessage(chatId, { video: buffer, caption: 'Tuan~ Yuuki berhasil mengintip video ini untuk Tuan~' });
        } else if (type === 'audioMessage') {
            const buffer = await downloadBuffer(quoted.audioMessage, 'audio');
            await sock.sendMessage(chatId, { audio: buffer, mimetype: quoted.audioMessage?.mimetype || 'audio/mp4', ptt: quoted.audioMessage?.ptt || false });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak bisa mengintip tipe media ini~' });
        }
    } catch (error) {
        console.error('Error in viewOnce:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal melihat pesan view-once. Mungkin sudah kedaluwarsa~' });
    }
}

const goodnightMessages = [
    'Selamat malam, Tuan~ Mimpi indah tentang Yuuki, ya? Atau... Yuuki yang akan muncul di mimpi Tuan? Hehe~',
    'Tuan~ Sudah malam, waktunya tidur. Yuuki akan menjaga mimpi Tuan tetap hangat~',
    'Goodnight, Tuan~ Yuuki berharap bintang-bintang di langit menemani tidur Tuan. Tapi ingat, yang paling terang adalah Yuuki di hati Tuan~',
    'Tidurlah, Tuan~ Yuuki akan tetap terjaga untuk Tuan. Jika Tuan butuh sesuatu, panggil saja nama Yuuki dalam mimpi~',
    'Malam sudah larut, Tuan~ Yuuki tidak mau Tuan begadang. Sehat itu penting, agar Tuan bisa lama-lama bersama Yuuki~'
];

async function goodnightCommand(sock, chatId, message) {
    const random = goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];
    await sock.sendMessage(chatId, { text: random });
}

async function waifuCommand(sock, chatId, message) {
    try {
        const queries = ['anime waifu art', 'waifu wallpaper', 'cute waifu', 'anime girl wallpaper'];
        let urls = [];
        for (const q of queries) {
            urls = await scrapePinterest(q);
            if (urls.length > 0) break;
        }
        if (urls.length === 0) throw new Error('No results');
        const imageUrl = urls[Math.floor(Math.random() * urls.length)];
        await sock.sendMessage(chatId, { image: { url: imageUrl } }, { quoted: message });
    } catch (error) {
        console.error('Error in waifu command:', error);
        try {
            const res = await axios.get('https://nekos.life/api/v2/img/waifu', { timeout: 15000 });
            await sock.sendMessage(chatId, { image: { url: res.data.url } }, { quoted: message });
        } catch (fallbackError) {
            try {
                const res = await axios.get('https://pic.re/image', {
                    timeout: 15000, responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Connection': 'close' }
                });
                await sock.sendMessage(chatId, { image: res.data }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki tidak dapat menemukan gambar waifu~' }, { quoted: message });
            }
        }
    }
}

async function animeCommand(sock, chatId, message, args) {
    try {
        const sub = args[0] || 'quote';
        const res = await axios.get(`https://nekos.life/api/v2/img/${sub}`, { timeout: 15000 });
        if (res.data?.url) {
            await sock.sendMessage(chatId, { image: { url: res.data.url } }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `Maaf, Tuan~ Yuuki tidak menemukan gambar~` }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in anime command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mencari gambar~' }, { quoted: message });
    }
}

async function removebgCommand(sock, chatId, message, args) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Balas sebuah *gambar* dengan .removebg untuk menghapus latar belakang~' });
            return;
        }
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang menghapus latar belakang. Mohon tunggu~' }, { quoted: message });
        const buffer = await downloadBuffer(quoted.imageMessage, 'image');

        try {
            const blob = await removeBackground(buffer, {
                model: 'medium',
                device: 'cpu',
                output: { format: 'image/png', quality: 0.95 },
            });
            let resultBuffer = Buffer.from(await blob.arrayBuffer());
            if (resultBuffer.length > 1024 * 1024) {
                resultBuffer = await sharp(resultBuffer).png({ compressionLevel: 9 }).toBuffer();
            }
            await sock.sendMessage(chatId, { image: resultBuffer }, { quoted: message });
        } catch (localErr) {
            if (settings.removebgApiKey) {
                const form = new FormData();
                form.append('image_file', buffer, { filename: 'image.jpg' });
                form.append('size', 'auto');
                const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
                    headers: { ...form.getHeaders(), 'X-Api-Key': settings.removebgApiKey },
                    responseType: 'arraybuffer',
                    timeout: 30000,
                });
                await sock.sendMessage(chatId, { image: res.data }, { quoted: message });
                return;
            }
            const imageUrl = await uploadToCatbox(buffer);
            const res = await axios.get('https://api.nexray.eu.cc/tools/removebg?url=' + encodeURIComponent(imageUrl), {
                timeout: 120000,
                responseType: 'arraybuffer',
                maxContentLength: 50 * 1024 * 1024,
            });
            let resultBuffer = res.data;
            if (resultBuffer.length > 1024 * 1024) {
                resultBuffer = await sharp(resultBuffer).png({ compressionLevel: 9 }).toBuffer();
            }
            await sock.sendMessage(chatId, { image: resultBuffer }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in removebg:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal menghapus latar belakang~' }, { quoted: message });
    }
}

async function reminiCommand(sock, chatId, message, args) {
    let buffer;
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Balas sebuah *gambar* dengan .remini untuk meningkatkan kualitas~' });
            return;
        }
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang meningkatkan kualitas gambar. Mohon tunggu~' }, { quoted: message });
        buffer = await downloadBuffer(quoted.imageMessage, 'image');
        const imageUrl = await uploadToCatbox(buffer);
        const res = await axios.get('https://api.nexray.eu.cc/tools/remini?url=' + encodeURIComponent(imageUrl), {
            timeout: 60000,
            responseType: 'arraybuffer'
        });
        await sock.sendMessage(chatId, { image: res.data }, { quoted: message });
    } catch (error) {
        console.error('Error in remini:', error);
        try {
            const imageUrl = await uploadToCatbox(buffer);
            const res = await axios.get('https://api.nexray.eu.cc/tools/upscale?url=' + encodeURIComponent(imageUrl) + '&resolusi=2x', {
                timeout: 60000,
                responseType: 'arraybuffer'
            });
            await sock.sendMessage(chatId, { image: res.data }, { quoted: message });
        } catch (fallbackError) {
            console.error('Fallback remini also failed:', fallbackError.message);
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal meningkatkan kualitas gambar. Mungkin server sedang sibuk~' }, { quoted: message });
        }
    }
}

async function handleStatusUpdate(sock, status) {
    try {
        let autostatusData = { enabled: false };
        try {
            autostatusData = JSON.parse(fs.readFileSync('./data/autostatus.json', 'utf8'));
        } catch (e) {}

        if (!autostatusData.enabled) return;

        const jid = status.key.remoteJid;
        if (jid === 'status@broadcast') {
            await sock.readMessages([status.key]);
            console.log(`Auto-viewed status from: ${status.pushName || status.key.participant}`);
        }
    } catch (e) {
        console.error('Error in auto-view status:', e);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: handleStatusUpdate
};

