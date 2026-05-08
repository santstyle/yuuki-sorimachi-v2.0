const settings = require('./settings');
require('./config.js');

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
const ffmpeg = require('fluent-ffmpeg');
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
const { lyrics: lyricsCommand } = require('./commands/downloader/lyrics');
const pingCommand = require('./commands/main/ping');
const aliveCommand = require('./commands/main/alive');
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
const { groupsetCommand } = require('./commands/group/groupset');
const { cleanupCommand } = require('./commands/owner/cleanup');
const ownermenuCommand = require('./commands/owner/ownermenu');
const { pinterestCommand } = require('./commands/search/pinterest');


const { startAbsen, addAbsen, finishAbsen } = require('./commands/group/absen');


const sewaCommand = require('./commands/group/sewa');
const cekSewaCommand = require('./commands/group/ceksewa');
const setWmCommand = require('./commands/tool/setwm');

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



        if (message.message) {
            storeMessage(message);
        }

        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const senderId = message.key.participant || message.key.remoteJid;
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

        if (userMessage.startsWith('.')) {
            logger.cmd(`${chalk.yellow(pushName)} [${chalk.white(isGroup ? 'GROUP' : 'PRIVATE')}] -> ${chalk.green(userMessage)}`);
        } else if (rawText) {
            logger.msg(`${chalk.yellow(pushName)} [${chalk.white(isGroup ? 'GROUP' : 'PRIVATE')}] -> ${chalk.white(displayMsg)}`);
        }

        // Ekstrak nomor HP. WhatsApp baru pakai sistem LID (@lid) bukan nomor asli (@s.whatsapp.net)
        const isLid = senderId.endsWith('@lid');
        const phone = isLid
            ? `LID:${senderId.split('@')[0]}` // LID bukan nomor HP asli
            : senderId.replace('@s.whatsapp.net', ''); // Nomor HP asli

        try {
            await prisma.user.upsert({
                where: { id: senderId },
                update: {
                    name: message.pushName || undefined,
                    phone: phone
                },
                create: {
                    id: senderId,
                    name: message.pushName || null,
                    phone: phone
                }
            });

            if (userMessage.startsWith('.')) {
                const skipHistory = ['.menu', '.bot', '.list', '.ping', '.alive', '.help'];
                const isTrivial = skipHistory.some(cmd => userMessage.startsWith(cmd));
                
                if (!isTrivial) {
                    await prisma.history.create({
                        data: {
                            userId: senderId,
                            userName: pushName,
                            userPhone: phone,
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
                        
                        // Sync group name to GroupSettings
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
                        } catch (e) {
                            // GroupSettings might not exist yet, that's okay
                        }
                    } catch (e) {
                        console.error('Failed to auto-register group to DB', e);
                    }
                }

                const xpResult = await addXP(senderId, Math.floor(Math.random() * 15) + 5, pushName);
                if (xpResult && xpResult.leveledUp) {
                    const levelUpImagePath = path.join(__dirname, 'assets', 'levelup', 'yuuki-uplevel.png');
                    let thumbBuffer = null;

                    if (fs.existsSync(levelUpImagePath)) {
                        try {
                            thumbBuffer = fs.readFileSync(levelUpImagePath);
                            console.log(`[LEVEL UP] Thumbnail loaded: ${thumbBuffer.length} bytes`);
                        } catch (e) {
                            console.error('Gagal baca thumbnail level up:', e.message);
                        }
                    } else {
                        console.log('[LEVEL UP] Image file not found:', levelUpImagePath);
                    }

                    const levelUpMessage = {
                        text: `LEVEL UP, Tuan!\n\n✨ *Sorak sorai bergema di seluruh penjuru ruangan~* ✨\n@${pushName} baru saja naik ke *Level ${xpResult.level}*\nYuuki sangat bangga! Teruslah bercakap-cakap agar Tuan semakin perkasa!`,
                        mentions: [senderId]
                    };

                    if (thumbBuffer) {
                        levelUpMessage.contextInfo = {
                            externalAdReply: {
                                title: "Yuuki Sorimachi | Level Up!",
                                body: `Level ${xpResult.level} reached!`,
                                mediaType: 1,
                                thumbnail: thumbBuffer,
                                renderLargerThumbnail: true,
                                showAdAttribution: false,
                                sourceUrl: `https://wa.me/${sock.user.id.split(':')[0]}`
                            }
                        };
                    }

                    await sock.sendMessage(chatId, levelUpMessage);
                }
            }
        } catch (dbError) {
            console.error('Database Error:', dbError);
        }

        const isUserBanned = await isBanned(senderId);
        if (isUserBanned && !userMessage.startsWith('.unban')) {
            await sock.sendMessage(chatId, {
                text: `Maaf, Tuan @${senderId.split('@')[0]}~ Yuuki sangat berterima kasih atas perhatian Tuan, tetapi... Yuuki tidak diizinkan berbicara dengan Tuan saat ini. *Keputusan ini di luar kendali Yuuki.* Mohon hubungi pemilik Yuuki jika Tuan merasa ada kekeliruan. Yuuki tetap menanti dengan hormat~`,
                mentions: [senderId]
            });
            return;
        }


        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        if (!userMessage.startsWith('.')) {
            await handleYuukiResponse(sock, chatId, message, rawText, senderId);
            if (isGroup) {
                await handleLinkDetection(sock, chatId, message, userMessage, senderId);
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
                await handleTagDetection(sock, chatId, message, senderId);
            }
            return;
        }

        const adminCommands = ['.mutegroup', '.unmutegroup', '.kick', '.tagall', '.hidetag', '.antilink', '.antitag'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.ban', '.unban'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki mohon dengan sangat, berilah Yuuki jabatan *admin* di grup ini agar Yuuki bisa bertindak. Saat ini tangan Yuuki terikat~' }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith('.mutegroup') ||
                userMessage === '.unmutegroup'
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
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
        } catch (error) {
            console.error('Error memeriksa mode akses:', error);
        }

        let commandExecuted = false;

        switch (true) {
            case userMessage === '.toimage' || userMessage === '.toimg': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await toimageCommand(sock, quotedMessage, chatId, senderId, ['toimage']);
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
                const { resetWarnCommand } = require('./commands/group/resetwarn');
                await resetWarnCommand(sock, chatId, senderId, resetWarnJids, message);
                break;
            case userMessage === '.delete' || userMessage === '.del':
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.mode'):
                await modeCommand(sock, chatId, message, senderIsSudo);
                break;
            case userMessage.startsWith('.bc'):
            case userMessage.startsWith('.broadcast'):
                const bcArgs = userMessage.split(' ').slice(1);
                await broadcastCommand(sock, chatId, message, bcArgs);
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                break;
            case userMessage === '.ownermenu' || userMessage === '.om':
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang boleh mengakses command ini. Yuuki sangat taat pada aturan~' }, { quoted: message });
                    return;
                }
                await ownermenuCommand(sock, chatId, message);
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
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

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
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang berwenang mengatur *goodbye* di sini. Yuuki mohon pengertian~' });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'Tuan~ Command .goodbye hanya bisa digunakan di dalam grup. Yuuki tidak bisa mengucapkan selamat tinggal di ruang pribadi~' });
                }
                break;
            case userMessage === '.git':
            case userMessage === '.github':
            case userMessage === '.sc':
            case userMessage === '.script':
            case userMessage === '.repo':
                await githubCommand(sock, chatId);
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
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === '.ship':
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
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
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
            case userMessage.startsWith('.antidelete'):
                if (!message.key.fromMe && !senderIsSudo) {
                    await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa menggunakan command ini. Rahasia grup tidak boleh sembarangan diungkap~' });
                    return;
                }
                const antideleteMatch = userMessage.slice(11).trim();
                await antideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === '.surrender':
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
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
                const { groqCommand } = require('./commands/ai-chat/groq');
                await groqCommand(sock, chatId, message, groqInput, senderId);
                break;
            case userMessage.startsWith('.deepseek'):
                const deepseekInput = rawText.slice(10).trim();
                const { deepseekCommand } = require('./commands/ai-chat/deepseek');
                await deepseekCommand(sock, chatId, message, deepseekInput);
                break;
            case userMessage.startsWith('.gpt'):
                const gptInput = rawText.slice(4).trim();
                const { gptCommand } = require('./commands/ai-chat/gpt');
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
            case userMessage === '.goodnight' || userMessage === '.lovenight' || userMessage === '.gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.quote'):
            case userMessage.startsWith('.waifu'):
            case userMessage.startsWith('.loli'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;

            case userMessage.startsWith('.pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
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
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;

            case userMessage.startsWith('.btch'):
            case userMessage.startsWith('.download'):
            case userMessage.startsWith('.dl'):
            case userMessage.startsWith('.song'):
            case userMessage.startsWith('.play'):
            case userMessage.startsWith('.music'):
            case userMessage.startsWith('.ytdl'):
            case userMessage.startsWith('.youtube'):
                {
                    const prefix = userMessage.split(' ')[0];
                    const input = rawText.slice(prefix.length).trim();
                    if (input) {
                        if (prefix === '.song' || prefix === '.play' || prefix === '.music') {
                            const songCommand = require('./commands/downloader/song');
                            await songCommand.song(sock, chatId, message, input);
                        } else {
                            const btchCommand = require('./commands/downloader/btch');
                            await btchCommand(sock, chatId, message, input);
                        }
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `Tuan~ Mohon berikan *URL* atau *judul lagu* yang ingin Yuuki unduh.\n\nContoh:\n${prefix} https://youtube.com/watch?v=...\n${prefix} Alan Walker Faded\n\nYuuki akan mencarikan untuk Tuan~`
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

        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "Tuan~ Command ini hanya bisa digunakan di dalam grup. Yuuki tidak bisa memberikan informasi grup di luar sana~"
                });
            }

            await sock.sendMessage(chatId, {
                text: `Tuan~ Berikut adalah *Group JID* yang Tuan minta: ${groupJid}\nSimak baik-baik, ya~ Ini adalah identitas rahasia grup ini~`
            }, {
                quoted: message
            });
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


function storeMessage(message) {
    // Message silently stored for antidelete tracking
}

async function handleMessageRevocation(sock, message) {
    try {
        const antideleteData = JSON.parse(fs.readFileSync('./data/antidelete.json', 'utf8'));
        if (!antideleteData.enabled) return;

        const revokedMessage = message.message?.protocolMessage;
        if (!revokedMessage) return;

        const store = require('./lib/lightweight_store');
        const chatId = message.key.remoteJid;
        const originalMessage = store.messages[chatId]?.find(m => m.key.id === revokedMessage.key.id);

        if (originalMessage) {
            await sock.sendMessage(chatId, {
                text: `🔮 *Pesan Telah Dihapus* 🔮\n\n*Pengirim:* @${message.key.participant?.split('@')[0] || 'unknown'}\n\n*Isi Pesan:*\n${originalMessage.message?.conversation || originalMessage.message?.extendedTextMessage?.text || 'Media message'}\n\n*--- Yuuki melihat semuanya ---*`,
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

        const user = await prisma.user.upsert({
            where: { id: targetJid },
            update: { isBanned: false },
            create: { id: targetJid, isBanned: false }
        });

        await sock.sendMessage(chatId, { text: `Baik, Tuan~ @${targetJid.split('@')[0]} sudah Yuuki buka blokirnya~`, mentions: [targetJid] });
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: 'Mohon maaf, Tuan~ Hamba tidak berhasil melaksanakan perintah Tuan untuk membuka blokir. Sudilah kiranya Tuan mencoba kembali~' });
    }
}

async function handleAntideleteCommand(sock, chatId, message, match) {
    try {
        const antideleteData = JSON.parse(fs.readFileSync('./data/antidelete.json', 'utf8'));

        if (!match || match.toLowerCase() === 'status') {
            const status = antideleteData.enabled ? 'aktif' : 'nonaktif';
            await sock.sendMessage(chatId, { text: `Tuan~ Status Antidelete saat ini: *${status}*\nYuuki akan tetap mengawasi, apa pun yang terjadi~` });
            return;
        }

        if (match.toLowerCase() === 'on') {
            antideleteData.enabled = true;
            fs.writeFileSync('./data/antidelete.json', JSON.stringify(antideleteData, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Antidelete telah Yuuki aktifkan. Kini tidak ada pesan yang bisa disembunyikan dari Yuuki~ Hehe~' });
        } else if (match.toLowerCase() === 'off') {
            antideleteData.enabled = false;
            fs.writeFileSync('./data/antidelete.json', JSON.stringify(antideleteData, null, 2));
            await sock.sendMessage(chatId, { text: 'Baik, Tuan~ Antidelete telah Yuuki nonaktifkan. Pesan-pesan akan kembali menjadi misteri~ Yuuki suka misteri~' });
        } else {
            await sock.sendMessage(chatId, { text: 'Tuan~ Cara menggunakan Antidelete:\n.antidelete on — untuk mengaktifkan\n.antidelete off — untuk menonaktifkan\n.antidelete status — untuk melihat status\nYuuki menunggu perintah Tuan~' });
        }
    } catch (error) {
        console.error('Error in antidelete command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki menemui kesalahan saat mengelola Antidelete. Mungkin ada yang tidak beres dengan sistem Yuuki~ Mohon periksa kembali~' });
    }
}

async function handleStatusUpdate(sock, status) {
    try {
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
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};

