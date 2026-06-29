const settings = require('./settings');
require('./config.js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');

if (!process.env.FFMPEG_PATH) {
    const path = require('path');
    const localFfmpeg = path.join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe');
    process.env.FFMPEG_PATH = fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg';
    console.log('Path FFmpeg diatur di main.js:', process.env.FFMPEG_PATH);
}

const { isBanned } = require('./lib/isBanned');
const prisma = require('./lib/db');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const FormData = require('form-data');

const { addWelcome, delWelcome, isWelcomeOn, getWelcomeMessage, addGoodbye, delGoodBye, isGoodByeOn, getGoodbyeMessage, isSudo } = require('./lib/index');
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
const { muteCommand } = require('./commands/group/mutegroup');
const unmuteCommand = require('./commands/group/unmutegroup');
const stickerCommand = require('./commands/converter/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/group/warn');
const warningsCommand = require('./commands/group/warnings');
const ownerCommand = require('./commands/owner/owner');
const deleteCommand = require('./commands/main/delete');
const { modeCommand } = require('./commands/owner/mode');
const { antideleteCommand } = require('./commands/owner/antidelete');

const { clearTmpCommand } = require('./commands/owner/cleartmp');
const { clearSessionCommand } = require('./commands/owner/clearsession');
const { setProfilePicture } = require('./commands/owner/setpp');
const { autoStatusCommand } = require('./commands/owner/autostatus');
const { sudoCommand } = require('./commands/owner/sudo');

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
const { setnameCommand } = require('./commands/profile/setname');
const { addXP } = require('./lib/xpManager');
const { getNextCustomId } = require('./lib/customId');
const { groupsetCommand } = require('./commands/group/groupset');
const { cleanupCommand } = require('./commands/owner/cleanup');
const ownermenuCommand = require('./commands/owner/ownermenu');
const { pinterestCommand, scrapePinterest } = require('./commands/search/pinterest');
const { autoreadCommand } = require('./commands/owner/autoread');

const { joinCommand, joinModeCommand } = require('./commands/owner/join');
const { leaveCommand } = require('./commands/owner/leave');


const { addPremCommand, listPremCommand } = require('./commands/owner/premium');
const { addSudo, removeSudo, getSudoList } = require('./lib/index');


const { startAbsen, addAbsen, finishAbsen } = require('./commands/group/absen');

const connectionMonitor = require('./lib/connectionMonitor');


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
    let message = null;
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        message = messages[0];
        if (!message?.message) return;



        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        chatId = message.key.remoteJid;
        let senderId = message.key.fromMe ? (sock.user?.id || message.key.participant || message.key.remoteJid) : (message.key.participant || message.key.remoteJid);

        // Resolve LID → phone JID — session encryption butuh phone JID, bukan @lid
        const knownLid = process.env.OWNER_LID;
        const knownPhone = process.env.OWNER_NUMBER;
        if (knownLid && knownPhone) {
            if (chatId.endsWith('@lid') && chatId.split('@')[0] === knownLid) {
                console.log(chalk.cyan(`[${moment().tz('Asia/Jakarta').format('HH:mm:ss')}]`) + chalk.bgMagenta.white(' LID  ') + chalk.white(`Resolve ${chatId} → ${knownPhone}@s.whatsapp.net`));
                chatId = knownPhone + '@s.whatsapp.net';
            }
            const sid = senderId || '';
            if (sid.endsWith('@lid') && sid.split('@')[0] === knownLid) {
                console.log(chalk.cyan(`[${moment().tz('Asia/Jakarta').format('HH:mm:ss')}]`) + chalk.bgMagenta.white(' LID  ') + chalk.white(`Resolve sender ${sid} → ${knownPhone}@s.whatsapp.net`));
                senderId = knownPhone + '@s.whatsapp.net';
            }
        }

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
            }, { quoted: message });
            return;
        }

        try {
            await prisma.user.upsert({
                where: { id: senderId },
                create: {
                    id: senderId,
                    name: message.pushName || null,
                    customId: await getNextCustomId()
                },
                update: {}
            });

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
                    if (xpResult && xpResult.leveledUp && xpResult.level % 10 === 0) {
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

        const adminCommands = ['.mutegroup', '.unmutegroup', '.kick', '.tagall', '.hidetag', '.antilink', '.antitag', '.antidelete', '.vv'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        const ownerCommands = ['.mode', '.self', '.autostatus', '.cleartmp', '.clearsession', '.setpp', '.areact', '.autoreact', '.ban', '.unban', '.bc', '.broadcast', '.sudo', '.addsudo', '.listsudo', '.delsudo', '.cleanup', '.debuglevelup', '.sewa', '.autoread', '.joinmode', '.leave', '.addprem', '.listprem'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (
                userMessage.startsWith('.mutegroup') ||
                userMessage === '.unmutegroup' ||
                userMessage.startsWith('.antidelete')
            ) {
                if (!isSenderAdmin && !message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, {
                        text: 'Maaf, Tuan~ Hanya admin grup yang memiliki wewenang untuk menggunakan command ini. Yuuki tidak bisa melanggar aturan, meskipun Yuuki sangat ingin membantu~'
                    }, { quoted: message });
                    return;
                }
            }
        }

        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsSudo) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya diperuntukkan bagi pemilik Yuuki. Yuuki tidak bisa memberikan akses ini kepada siapa pun tanpa izin~' }, { quoted: message });
                return;
            }
        }

        try {
            const dir = './data';
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            if (!fs.existsSync('./data/messageCount.json')) {
                fs.writeFileSync('./data/messageCount.json', JSON.stringify({}));
            }
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

        if (userMessage.startsWith('.') && connectionMonitor.isUnstable() && connectionMonitor.canSendWarning()) {
            connectionMonitor.markWarningSent();
            const title = isSenderAdmin ? 'Tuan Besar' : 'Tuan';
            try {
                await sock.sendMessage(chatId, {
                    text: connectionMonitor.getStatusMessage(title)
                }, { quoted: message });
            } catch (e) {}
        }

        let commandExecuted = false;

        switch (true) {
            case userMessage === '.toimage' || userMessage === '.toimg': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await toimageCommand(sock, message, chatId, senderId, ['toimage']);
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki memohon dengan hormat, balaslah sebuah *stiker* dengan command *.toimage* agar Yuuki bisa mengubahnya menjadi gambar~' }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case userMessage === '.tovideo' || userMessage === '.tovid': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await tovideoCommand(sock, message, chatId, senderId, ['tovideo']);
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki dengan rendah hati memohon, balaslah sebuah *stiker* dengan command *.tovideo* agar Yuuki bisa menyulapnya menjadi video~' }, { quoted: message });
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
                    await sock.sendMessage(chatId, { text: 'Tuan~ Mohon berikan jumlah menit yang valid. Contoh: .mutegroup 10' }, { quoted: message });
                } else {
                    await muteCommand(sock, chatId, senderId, muteDuration, message);
                }
                break;
            case userMessage === '.unmutegroup':
                await unmuteCommand(sock, chatId, senderId, message);
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
                await warningsCommand(sock, chatId, mentionedJidListWarnings, message);
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
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengatur mode self~' }, { quoted: message });
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
                await ownerCommand(sock, chatId, message);
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
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Demi kelancaran tugas, Yuuki perlu menjadi *admin* grup terlebih dahulu. Angkatlah Yuuki, maka Yuuki akan bekerja dengan maksimal~'
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
             case userMessage.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Command ini hanya bisa digunakan di dalam *grup*, bukan di pesan pribadi. Ayo bawa Yuuki ke grup~'
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Demi keamanan, Yuuki perlu menjadi *admin* grup terlebih dahulu. Dengan kekuasaan, Yuuki bisa melindungi Tuan~'
                    }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
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
                    await weatherCommand(sock, chatId, city, message);
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki mohon tentukan *kota* yang ingin Tuan ketahui cuacanya.\nContoh: .weather London\nYuuki akan mencari tahu~' }, { quoted: message });
                }
                break;
            case userMessage === '.news':
                await newsCommand(sock, chatId, message);
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup, message);
                break;
            case userMessage === '.leaderboard' || userMessage === '.lb' || userMessage === '.globalrank':
                await leaderboardCommand(sock, chatId, message);
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
                        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang mengatur *welcome* di sini. Yuuki mohon pengertian~' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .welcome hanya bisa digunakan di dalam grup. Yuuki tidak bisa menyambut tamu di ruang pribadi~' }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    const adminStatus = await isAdmin(sock, chatId, senderId);
                    isSenderAdmin = adminStatus.isSenderAdmin;

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang mengatur *goodbye* di sini. Yuuki mohon pengertian~' }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .goodbye hanya bisa digunakan di dalam grup. Yuuki tidak bisa mengucapkan selamat tinggal di ruang pribadi~' }, { quoted: message });
                }
                break;
             case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .antibadword hanya bisa digunakan di dalam grup. Di luar grup, kata-kata kasar adalah kebebasan~' }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki harus menjadi *admin* grup untuk menggunakan fitur antibadword. Beri Yuuki kekuasaan, maka Yuuki akan menjaga kesopanan~' }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.yuuki'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .yuuki hanya bisa digunakan di dalam grup. Di sini terlalu sepi untuk Yuuki bermain~' }, { quoted: message });
                    return;
                }

                const yuukiAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!yuukiAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang menghidupkan atau mematikan Yuuki di sini. Yuuki hanya bisa pasrah menunggu keputusan~ Tapi... Yuuki harap Tuan tidak mematikannya~' }, { quoted: message });
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
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .ship hanya bisa digunakan di dalam grup! Yuuki ingin melihat drama percintaan di grup~' }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .groupinfo hanya bisa digunakan di dalam grup! Di luar grup, tidak ada informasi yang bisa Yuuki bagikan~' }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
             case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .resetlink hanya bisa digunakan di dalam grup! Tidak ada tautan yang bisa Yuuki atur ulang di sini~' }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .staff hanya bisa digunakan di dalam grup! Di sini tidak ada staf yang bisa Yuuki perkenalkan~' }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.vv'):
                const vvArg = userMessage.slice(3).trim();
                await viewOnceCommand(sock, chatId, message, vvArg, senderId, isSenderAdmin, isGroup);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autostatus'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya untuk pemilik Yuuki. Yuuki tidak bisa mengizinkan orang lain mengatur status~' }, { quoted: message });
                    return;
                }
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case userMessage.startsWith('.autoread'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengatur auto-read~' }, { quoted: message });
                    return;
                }
                const autoreadArgs = userMessage.split(' ').slice(1);
                await autoreadCommand(sock, chatId, message, autoreadArgs);
                break;
            case userMessage.startsWith('.antidelete'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya bisa digunakan di dalam grup. Yuuki tidak memiliki wewenang untuk mengatur penghapusan pesan di sini~' }, { quoted: message });
                    return;
                }
                const antideleteMatch = userMessage.slice(11).trim();
                await antideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === '.debuglevelup':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik dan sudo yang berhak menggunakan command debug. Ini menyangkut rahasia terdalam Yuuki~' }, { quoted: message });
                    return;
                }
                await debugLevelUp(sock, message, chatId, senderId, pushName);
                commandExecuted = true;
                break;
            case userMessage === '.cleartmp':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang berhak membersihkan ruang sementara Yuuki. Orang lain tidak boleh ikut campur~' }, { quoted: message });
                    return;
                }
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang berhak membersihkan memori Yuuki. Ini masalah privasi~' }, { quoted: message });
                    return;
                }
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage === '.setpp':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengganti wajah Yuuki. Ini masalah harga diri~' }, { quoted: message });
                    return;
                }
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.mylevel'):
                const levelArgs = rawText.slice(8).trim().split(' ');
                await mylevelCommand(sock, chatId, message, levelArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.setname'):
                const nameArgs = rawText.slice(8).trim().split(' ');
                await setnameCommand(sock, chatId, message, nameArgs, senderId);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.groupset'):
                const groupsetArgs = rawText.slice(9).trim().split(' ');
                await groupsetCommand(sock, chatId, senderId, message, groupsetArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.cleanup'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang berwenang membereskan kekacauan. Biarkan Yuuki yang membereskannya untuk Tuan~' }, { quoted: message });
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
                const pinPrefix = userMessage.startsWith('.pinterest') ? 10 : 4;
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
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menambah sudo~' }, { quoted: message });
                    return;
                }
                await addSudoCommand(sock, chatId, message);
                break;
            case userMessage === '.listsudo':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa melihat daftar sudo~' }, { quoted: message });
                    return;
                }
                await listSudoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.delsudo'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menghapus sudo~' }, { quoted: message });
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
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;

            case userMessage.startsWith('.joinmode'):
                await joinModeCommand(sock, chatId, message, senderIsSudo);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.join'):
                const joinArgs = rawText.split(' ').slice(1);
                await joinCommand(sock, chatId, message, joinArgs, senderIsSudo, senderId);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.leave'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menyuruh Yuuki pergi~' }, { quoted: message });
                    return;
                }
                const leaveArgs = rawText.split(' ').slice(1);
                await leaveCommand(sock, chatId, message, leaveArgs);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.addprem'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menambah premium~' }, { quoted: message });
                    return;
                }
                const addpremArgs = rawText.split(' ').slice(1);
                await addPremCommand(sock, chatId, message, addpremArgs);
                commandExecuted = true;
                break;
            case userMessage === '.listprem':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa melihat daftar premium~' }, { quoted: message });
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
                        if (prefix === '.song' || prefix === '.music') {
                            await sock.sendMessage(chatId, {
                                text: `Tuan~ Yuuki bisa mencarikan lagu untuk Tuan~\n\n\`${prefix} <judul lagu>\`\n\nContoh:\n${prefix} Alan Walker Faded\n\nYuuki akan mencarikan untuk Tuan~`
                            }, { quoted: message });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: `Tuan~ Yuuki bisa mengunduh media untuk Tuan~\n\n\`${prefix} <url>\`\n\nContoh:\n${prefix} https://youtube.com/watch?v=...\n\nYuuki support YouTube, Instagram, TikTok, Facebook, dan lainnya~`
                            }, { quoted: message });
                        }
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
            connectionMonitor.reportSuccess();
            await showTypingAfterCommand(sock, chatId);
        }

        if (userMessage.startsWith('.')) {
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        connectionMonitor.reportFailure();
        const errMsg = error?.message || error?.toString() || error?.code || '';
        const isConnectionIssue = errMsg.includes('Connection Closed') || errMsg.includes('Connection Terminated') || errMsg.includes('ECONNREFUSED') || errMsg.includes('ETIMEDOUT') || errMsg.includes('ENETUNREACH') || errMsg.includes('timeout') || errMsg.includes('socket') || errMsg.includes('EHOSTUNREACH') || errMsg.includes('EAI_AGAIN') || errMsg.includes('fetch failed');

        if (chatId) {
            const title = typeof isSenderAdmin !== 'undefined' && isSenderAdmin ? 'Tuan Besar' : 'Tuan';
            const text = isConnectionIssue
                ? `Mohon maaf, ${title}~ Yuuki mendeteksi koneksi internet yang kurang stabil. Mohon Tuan bersabar dan mencoba lagi dalam beberapa saat. Yuuki akan berusaha segera kembali melayani Tuan~`
                : 'Maaf, Tuan~ Yuuki mengalami sedikit gangguan dalam memproses perintah Tuan. Mohon Tuan bersabar dan mencoba lagi~ Yuuki akan berusaha lebih baik~';
            if (!isConnectionIssue) {
                console.error('Error dalam penangan pesan:', error);
            }
            await sock.sendMessage(chatId, { text }, { quoted: message }).catch(() => { });
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
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error handling message revocation:', error);
    }
}

function incrementMessageCount(chatId, senderId) {
    try {
        const dir = './data';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync('./data/messageCount.json')) {
            fs.writeFileSync('./data/messageCount.json', JSON.stringify({}));
        }
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
            await sock.sendMessage(chatId, { text: 'Tuan, sebutkan user yang ingin di-unban~ Mention atau reply chatnya, ya.' }, { quoted: message });
            return;
        }

        await prisma.user.upsert({
            where: { id: targetJid },
            update: { isBanned: false },
            create: { id: targetJid, isBanned: false, customId: await getNextCustomId() }
        });

        await sock.sendMessage(chatId, { text: `Baik, Tuan~ @${targetJid.split('@')[0]} sudah Yuuki buka blokirnya~`, mentions: [targetJid] }, { quoted: message });
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: 'Mohon maaf, Tuan~ Hamba tidak berhasil melaksanakan perintah Tuan untuk membuka blokir. Sudilah kiranya Tuan mencoba kembali~' }, { quoted: message });
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
            }, { quoted: message });
            return;
        }

        if (action === 'on') {
            data.isSelf = true;
            fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Tuan~ Mode self aktif. Sekarang hanya Tuan yang bisa memerintah Yuuki. Orang lain tidak akan didengar oleh Yuuki~ Hanya untuk Tuan seorang~' }, { quoted: message });
        } else if (action === 'off') {
            data.isSelf = false;
            fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Mode self nonaktif. Kini para sudo juga bisa menggunakan Yuuki. Tapi hati Yuuki tetap milik Tuan seorang~' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak mengerti. Coba .self on / off / status~' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in self command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada error saat mengatur mode self~' }, { quoted: message });
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
            await sock.sendMessage(chatId, { text: 'Tuan~ Tidak ada user sudo selain Tuan sendiri. Yuuki hanya milik Tuan seorang~' }, { quoted: message });
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

async function topMembers(sock, chatId, isGroup, message) {
    try {
        if (!isGroup) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Command .topmembers hanya bisa digunakan di dalam grup! Yuuki tidak bisa melihat peringkat di sini~' }, { quoted: message });
            return;
        }
        const groupMetadata = await sock.groupMetadata(chatId);
        const memberIds = new Set(groupMetadata.participants.map(p => p.id));
        const top = await prisma.userProgress.findMany({
            orderBy: [{ level: 'desc' }, { xp: 'desc' }],
            take: 20,
            include: { user: true }
        });
        const filtered = top.filter(u => memberIds.has(u.userId)).slice(0, 10);
        if (filtered.length === 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Belum ada data anggota yang cukup untuk membuat peringkat. Ayo lebih aktif di grup~' }, { quoted: message });
            return;
        }
        const groupName = groupMetadata.subject || 'Grup';
        let text = `━━━「 *TOP MEMBERS* 」━━━\n${groupName}\n\n`;
        filtered.forEach((u, i) => {
            const name = u.user?.name || u.userName || u.userId.split('@')[0];
            text += `${i + 1}. @${u.userId.split('@')[0]} — Level ${u.level} (${u.xp} XP)\n`;
        });
        await sock.sendMessage(chatId, { text, mentions: filtered.map(u => u.userId) }, { quoted: message });
    } catch (error) {
        console.error('Error in topMembers:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal menampilkan peringkat~' }, { quoted: message });
    }
}

async function leaderboardCommand(sock, chatId, message) {
    try {
        const top = await prisma.userProgress.findMany({
            orderBy: [{ level: 'desc' }, { xp: 'desc' }],
            take: 20,
            include: { user: true }
        });
        if (top.length === 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Belum ada data user untuk membuat peringkat global. Ayo lebih aktif menggunakan Yuuki~' }, { quoted: message });
            return;
        }
        let text = '━━━「 *TOP 10 LEADERBOARD GLOBAL* 」━━━\n\n';
        top.slice(0, 10).forEach((u, i) => {
            const rawName = (u.user?.name || u.userName || '').trim();
            const displayId = u.user?.customId || u.userId.split('@')[0].slice(-4);
            text += `${i + 1}. ${rawName || `User#${displayId}`} — Level ${u.level} (${u.xp} XP)\n`;
        });
        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (error) {
        console.error('Error in leaderboard:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal menampilkan leaderboard global~' }, { quoted: message });
    }
}

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        if (!quotedMessage?.imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Balas sebuah *gambar* dengan command .blur agar Yuuki buatkan versi blur~' }, { quoted: message });
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
    await sock.sendMessage(chatId, { text: random }, { quoted: message });
}

async function shipCommand(sock, chatId, message) {
    try {
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const senderId = message.key.participant || message.key.remoteJid;
        const groupMetadata = await sock.groupMetadata(chatId);
        const allMembers = groupMetadata.participants.map(p => p.id).filter(jid => jid !== senderId);

        if (mentioned.length < 2) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Cara pakai .ship:\n\n`.ship @user1 @user2`\n\nYuuki akan men-ship dua orang yang Tuan sebut~ 💕'
            }, { quoted: message });
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
            text: `@${user1.split('@')[0]} 💕 @${user2.split('@')[0]}\n\n*Kompatibilitas:* ${compatibility}% ${hearts}\n\n${compatibility > 70 ? 'Sepertinya mereka cocok~ Yuuki iri...' : 'Hmm... mungkin perlu waktu~'}`,
            mentions: [user1, user2]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in ship:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal men-ship mereka~' }, { quoted: message });
    }
}

const VV_CONFIG_PATH = path.join(__dirname, 'data', 'vvConfig.json');

function loadVvConfig() {
    try {
        if (fs.existsSync(VV_CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(VV_CONFIG_PATH, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveVvConfig(data) {
    fs.writeFileSync(VV_CONFIG_PATH, JSON.stringify(data, null, 2));
}

async function viewOnceCommand(sock, chatId, message, arg, senderId, isSenderAdmin, isGroup) {
    try {
        if (!isGroup) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Fitur .vv hanya bisa digunakan di dalam grup. Yuuki tidak bisa melayaninya di sini~' }, { quoted: message });
            return;
        }

        const vvConfig = loadVvConfig();

        if (arg === 'public' || arg === 'privat' || arg === 'private') {
            if (!isSenderAdmin && !message.key.fromMe) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang bisa mengatur mode .vv. Yuuki mohon pengertian~' }, { quoted: message });
                return;
            }
            const mode = arg === 'public' ? 'public' : 'private';
            vvConfig[chatId] = mode;
            saveVvConfig(vvConfig);
            await sock.sendMessage(chatId, {
                text: `Baik, Tuan~ Fitur .vv telah Yuuki atur menjadi *${mode}*.\n${mode === 'public' ? 'Semua member bisa mengintip view-once~' : 'Hanya admin grup yang bisa menggunakan .vv~'}`
            }, { quoted: message });
            return;
        }

        const currentMode = vvConfig[chatId] || 'private';
        if (arg === 'status' || (!arg && !message.message?.extendedTextMessage?.contextInfo?.quotedMessage)) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ Berikut pengaturan fitur .vv di grup ini:\n\nMode: *${currentMode}*\n${currentMode === 'public' ? 'Semua member bisa menggunakan .vv' : 'Hanya admin grup yang bisa menggunakan .vv'}\n\nAtur mode:\n.vv public — Semua member bisa pakai\n.vv private — Hanya admin grup`
            }, { quoted: message });
            return;
        }

        if (currentMode === 'private' && !isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Fitur .vv di grup ini hanya untuk admin. Yuuki tidak bisa melayani~' }, { quoted: message });
            return;
        }

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Reply pesan *view-once* yang ingin dilihat~' }, { quoted: message });
            return;
        }

        const type = Object.keys(quoted)[0];
        if (type === 'imageMessage') {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: console });
            await sock.sendMessage(chatId, { image: buffer, caption: 'Tuan~ Yuuki berhasil mengintip gambar ini untuk Tuan~' }, { quoted: message });
        } else if (type === 'videoMessage') {
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: console });
            await sock.sendMessage(chatId, { video: buffer, caption: 'Tuan~ Yuuki berhasil mengintip video ini untuk Tuan~' }, { quoted: message });
        } else if (type === 'audioMessage') {
            const buffer = await downloadBuffer(quoted.audioMessage, 'audio');
            await sock.sendMessage(chatId, { audio: buffer, mimetype: quoted.audioMessage?.mimetype || 'audio/mp4', ptt: quoted.audioMessage?.ptt || false }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki tidak bisa mengintip tipe media ini~' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in viewOnce:', error);
        const errMsg = error?.message || error?.code || '';
        const isConnectionIssue = errMsg.includes('ETIMEDOUT') || errMsg.includes('ENOTFOUND') || errMsg.includes('ECONNREFUSED') || errMsg.includes('socket') || errMsg.includes('timeout') || errMsg.includes('fetch failed') || errMsg.includes('EAI_AGAIN') || errMsg.includes('EHOSTUNREACH');
        if (isConnectionIssue) {
            connectionMonitor.reportFailure();
            await sock.sendMessage(chatId, { text: `Maaf, Tuan~ Yuuki gagal mengunduh media karena koneksi internet sedang tidak stabil. Mohon Tuan bersabar dan mencoba lagi nanti~` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal melihat pesan view-once. Mungkin sudah kedaluwarsa~' }, { quoted: message });
        }
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
    await sock.sendMessage(chatId, { text: random }, { quoted: message });
}

async function retryWithFallback(apis, maxRetries = 2) {
    for (const api of apis) {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const result = await api();
                if (result) return result;
            } catch (e) {
                if (i < maxRetries) {
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                console.error(`API failed: ${e.message}`);
            }
        }
    }
    return null;
}

async function removebgCommand(sock, chatId, message, args) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = quoted?.imageMessage || message.message?.imageMessage;
        if (!imgMsg) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Kirim gambar dengan caption *.removebg* atau reply gambar dengan *.removebg* untuk menghapus latar belakang~' }, { quoted: message });
            return;
        }
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang menghapus latar belakang. Mohon tunggu~' }, { quoted: message });

        const sourceMsg = quoted?.imageMessage ? { message: quoted } : message;
        const buffer = await downloadMediaMessage(sourceMsg, 'buffer', {}, { logger: console });

        try {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://fapihub.com/v2/rembg/', form, {
                headers: {
                    'ApiKey': process.env.FAPIHUB_API_KEY,
                    ...form.getHeaders()
                },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const result = Buffer.from(res.data);
            await sock.sendMessage(chatId, { image: result }, { quoted: message });
        } catch (fapiErr) {
            if (fapiErr.response?.status === 402) {
                console.error('FAPIhub quota exhausted:', fapiErr.response?.data?.error?.message || '402');
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Kuota bulanan fitur removebg Yuuki sudah habis. Mohon ditunggu hingga bulan depan agar kuota kembali terisi~ Yuuki turut berduka~' }, { quoted: message });
            } else {
                console.error('FAPIhub failed:', fapiErr.message);
                const errMsg = fapiErr?.message || '';
                const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
                await sock.sendMessage(chatId, { text: isNetworkIssue ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~' : 'Maaf, Tuan~ Fitur removebg Yuuki sedang bermasalah. Silakan coba lagi nanti~' }, { quoted: message });
            }
        }
    } catch (error) {
        console.error('Error in removebg:', error);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN|socket hang up|fetch failed/i.test(errMsg) || errMsg.includes('getaddrinfo');
        await sock.sendMessage(chatId, { text: isNetworkIssue ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~' : 'Maaf, Tuan~ Yuuki gagal menghapus latar belakang~' }, { quoted: message });
    }
}

async function reminiCommand(sock, chatId, message, args) {
    let buffer;
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Balas sebuah *gambar* dengan .remini untuk meningkatkan kualitas~' }, { quoted: message });
            return;
        }
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki sedang meningkatkan kualitas gambar. Mohon tunggu~' }, { quoted: message });
        const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {}, { logger: console });
        const base64 = buffer.toString('base64');

        const result = await retryWithFallback([
            async () => {
                const clientId = Array.from({ length: 32 }, () =>
                    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 62)]
                ).join('');
                const cookie = `client_id=${clientId}`;
                const meta = await sharp(buffer).metadata();
                const mp = (meta.width * meta.height) / 1000000;
                const isSmall = mp <= 2;

                const uploadForm = new FormData();
                uploadForm.append('image', buffer, 'image.jpg');
                uploadForm.append('scale', isSmall ? '4' : '2');
                uploadForm.append('model', 'plus');

                const uploadRes = await axios.post('https://image-upscaling.net/upscaling_upload', uploadForm, {
                    headers: { ...uploadForm.getHeaders(), Cookie: cookie },
                    timeout: 120000
                });

                const uploadId = String(uploadRes.data).trim();

                for (let i = 0; i < 60; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const statusRes = await axios.get('https://image-upscaling.net/upscaling_get_status_v2', {
                        headers: { Cookie: cookie },
                        timeout: 30000
                    });
                    const queue = statusRes.data;
                    if (!Array.isArray(queue)) continue;

                    const job = queue.find(j => j.original_filename === uploadId && j.completed);
                    if (job?.image_url) {
                        const imgRes = await axios.get(job.image_url, {
                            headers: { Cookie: cookie },
                            responseType: 'arraybuffer',
                            timeout: 60000
                        });
                        try { await axios.get(job.image_url, { params: { delete_without_download: '' }, headers: { Cookie: cookie }, timeout: 5000 }); } catch (e) {}
                        return Buffer.from(imgRes.data);
                    }
                    if (queue.every(j => j.completed)) break;
                }
                throw new Error('Upscale timeout');
            },
            async () => {
                const form = new FormData();
                form.append('img', buffer, { filename: 'image.jpg' });
                const res = await axios.post(`https://api.lolhuman.xyz/api/remini?apikey=${process.env.LOLHUMAN_API_KEY}`, form, {
                    headers: { ...form.getHeaders() },
                    timeout: 60000
                });
                if (res.data?.result) return Buffer.from(res.data.result, 'base64');
                throw new Error('No result');
            },
            async () => {
                const meta = await sharp(buffer).metadata();
                const w = meta.width, h = meta.height;
                const target = Math.min(4096, Math.max(1024, Math.max(w, h) * 2));
                const scale = Math.min(4, Math.max(1, target / Math.max(w, h)));
                return await sharp(buffer, { failOnError: false })
                    .resize(Math.round(w * scale), Math.round(h * scale), {
                        fit: 'inside',
                        withoutEnlargement: false,
                        kernel: 'lanczos3'
                    })
                    .sharpen({
                        sigma: 1.5,
                        m1: 0,
                        m2: 3,
                        x1: 2,
                        y2: 10,
                        y3: 20
                    })
                    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
                    .toBuffer();
            }
        ], 1);

        if (result) {
            if (Buffer.isBuffer(result))
                await sock.sendMessage(chatId, { image: result }, { quoted: message });
            else if (result.url)
                await sock.sendMessage(chatId, { image: { url: result.url } }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal meningkatkan kualitas gambar. Semua API sedang bermasalah~' }, { quoted: message });
        }
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

async function animeCommand(sock, chatId, message, args) {
    try {
        const sub = args[0] || 'waifu';
        const validSubs = ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'];
        const category = validSubs.includes(sub) ? sub : 'waifu';

        const response = await retryWithFallback([
            async () => {
                const nekosCategory = category === 'waifu' ? 'waifu' : 'neko';
                const res = await axios.get(`https://nekos.best/api/v2/${nekosCategory}?amount=1`, { timeout: 10000 });
                if (res.data?.results?.[0]?.url) return res.data.results[0].url;
                throw new Error('No URL');
            },
            async () => {
                const res = await axios.get('https://api.waifu.im/images', {
                    params: { IncludedTags: category === 'waifu' ? 'waifu' : 'neko', IsNsfw: false },
                    headers: { 'Accept-Version': 'v7' },
                    timeout: 10000
                });
                if (res.data?.items?.[0]?.url) return res.data.items[0].url;
                throw new Error('No URL');
            },
            async () => {
                const res = await axios.get(`https://api.waifu.pics/sfw/${category}`, { timeout: 15000 });
                if (res.data?.url) return res.data.url;
                throw new Error('No URL');
            }
        ], 1);

        if (response) {
            await sock.sendMessage(chatId, { image: { url: response } }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `Tuan~ Maaf, Yuuki tidak menemukan gambar *${sub}*~` }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in anime command:', error);
        await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki gagal mencari gambar anime. Mungkin API-nya sedang sibuk~' }, { quoted: message });
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate
};

