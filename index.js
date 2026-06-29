require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const statsSync = require('./lib/statsSync')

// Filter log bawaan Baileys yang berisik dan tidak relevan untuk developer
const _originalConsoleError = console.error;
console.error = (...args) => {
    const msg = args.join(' ');
    const noisy = ['Bad MAC', 'Failed to decrypt', 'Session error', 'decrypt'];
    if (noisy.some(n => msg.includes(n))) return; // buang noise, jangan tampilkan
    _originalConsoleError(...args);
};
const _originalConsoleLog = console.log;
console.log = (...args) => {
    const msg = args.join(' ');
    if (msg.includes('Failed to decrypt') || msg.includes('Session error')) return;
    _originalConsoleLog(...args);
};

console.log(chalk.bold.cyan('\n  ╭───────────────────────────────────╮'));
console.log(chalk.bold.cyan('  │') + chalk.bold.white('   Yuuki Sorimachi | WhatsApp Bot  ') + chalk.bold.cyan('│'));
console.log(chalk.bold.cyan('  ╰───────────────────────────────────╯\n'));

const ffmpegPath = require('path').join(__dirname, 'ffmpeg', 'bin', 'ffmpeg.exe');
if (fs.existsSync(ffmpegPath)) {
    process.env.FFMPEG_PATH = ffmpegPath;
    console.log(chalk.green('  ✔') + chalk.white(' FFmpeg  : ') + chalk.green('Local Ready'))
} else {
    process.env.FFMPEG_PATH = 'ffmpeg';
    console.log(chalk.green('  ✔') + chalk.white(' FFmpeg  : ') + chalk.yellow('Using System FFmpeg'))
}

const FileType = require('file-type')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate } = require('./main')
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { join } = require('path')

const store = require('./lib/lightweight_store')

store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

setInterval(() => {
    if (global.gc) {
        global.gc()
        }
}, 60000)

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 4000) {
        console.log(`RAM too high (${used.toFixed(0)}MB), restarting gracefully...`)
        shutdown()
    }
}, 30000)

global.botname = "Yuuki Sorimachi | Bot"
global.themeemoji = "•"

function clearOldSessionData() {
    try {
        const credsPath = './session/creds.json'
        if (fs.existsSync(credsPath)) {
            const stats = fs.statSync(credsPath)
            const sessionAge = Date.now() - stats.mtimeMs
            const sevenDays = 7 * 24 * 60 * 60 * 1000
            if (sessionAge > sevenDays) {
                console.log('Session creds expired (>7 days), clearing...')
                fs.rmSync('./session', { recursive: true, force: true })
            }
        }
    } catch (error) {
        console.log('Session check:', error.message)
    }
}

let currentSocket = null;

async function startXeonBotInc() {
    if (currentSocket) {
        try {
            currentSocket.ev.removeAllListeners('connection.update');
            currentSocket.ev.removeAllListeners('messages.upsert');
            currentSocket.ev.removeAllListeners('creds.update');
            currentSocket.ev.removeAllListeners('group-participants.update');
            currentSocket.ev.removeAllListeners('contacts.update');
            currentSocket.end(undefined);
        } catch (e) {}
        currentSocket = null;
    }

    clearOldSessionData()

    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState('./session')

    // Fix registrationId if 0 (can cause private message failures)
    const crypto = require('crypto');
    if (!state.creds.registrationId) {
        state.creds.registrationId = (crypto.randomBytes(2).readUInt16LE(0) & 0x3FFF) || 1;
        console.log(chalk.yellow('⚠ Fix registrationId:'), state.creds.registrationId);
        fs.writeFileSync('./session/creds.json', JSON.stringify(state.creds, null, 2));
    }

    // // Force refresh owner sessions — DISABLED: bikin session encryption owner rusak
    // const ownerNumber = process.env.OWNER_NUMBER;
    // const ownerLid = process.env.OWNER_LID;
    // if (ownerNumber || ownerLid) {
    //     const sessionFiles = fs.readdirSync('./session').filter(f =>
    //         (ownerNumber && f.startsWith(`session-${ownerNumber}`)) ||
    //         (ownerLid && f.startsWith(`session-${ownerLid}`))
    //     );
    //     if (sessionFiles.length > 0) {
    //         console.log(chalk.yellow(`⚠ Menghapus ${sessionFiles.length} session stale owner untuk force refresh...`));
    //         sessionFiles.forEach(f => {
    //             fs.unlinkSync(`./session/${f}`);
    //             console.log(chalk.gray(`  🗑 ${f}`));
    //         });
    //     }
    // }

    const msgRetryCounterCache = new NodeCache()

    const logger = pino({ level: 'warn' })

    const XeonBotInc = makeWASocket({
        version,
        logger: logger,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => {
            try {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            } catch (error) {
                console.log('Error loading message:', error.message)
                return ""
            }
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 30000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 250,
        fireInitQueries: true,
        emitOwnEvents: true,
        defaultCacheSize: 100
    })

    currentSocket = XeonBotInc
    XeonBotInc.public = true

    store.bind(XeonBotInc.ev)

    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            if (!chatUpdate.messages || chatUpdate.messages.length === 0) return

            const mek = chatUpdate.messages[0]
            if (!mek.message) return

            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
                ? mek.message.ephemeralMessage.message
                : mek.message

            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                try {
                    const fs = require('fs');
                    let autostatusData = { enabled: false };
                    try { autostatusData = JSON.parse(fs.readFileSync('./data/autostatus.json', 'utf8')); } catch (e) {}
                    if (autostatusData.enabled) {
                        await XeonBotInc.readMessages([mek.key]);
                    }
                } catch (e) {}
                return;
            }

            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return

            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            if (XeonBotInc?.msgRetryCounterCache && Math.random() < 0.01) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                const errMsg = err?.message || err?.toString() || '';
                if (!errMsg.includes('Bad MAC') && !errMsg.includes('decrypt') && !errMsg.includes('Connection Closed') && !errMsg.includes('Connection Terminated')) {
                    console.error("Error in handleMessages:", err);
                    if (mek.key && mek.key.remoteJid) {
                        await XeonBotInc.sendMessage(mek.key.remoteJid, {
                            text: 'Maaf, Tuan~ Yuuki mengalami error saat memproses pesan Tuan.'
                        }).catch(() => { });
                    }
                }
            }
        } catch (err) {
            const errMsg = err?.message || err?.toString() || '';
            if (!errMsg.includes('Bad MAC') && !errMsg.includes('decrypt') && !errMsg.includes('Connection Closed') && !errMsg.includes('Connection Terminated')) {
                console.error("Error in messages.upsert:", err);
            }
        }
    })

    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    // Log message delivery updates — tangkap error/ack dari server
    XeonBotInc.ev.on('messages.update', updates => {
        for (const update of updates) {
            const key = update.key;
            const id = key?.id;
            const remoteJid = key?.remoteJid;
            const status = update.update?.status;
            const errors = update.update?.errors;
            if (status || errors) {
                console.log(`[MSG UPDATE] id=${id} to=${remoteJid} status=${status || 'none'} errors=${errors ? JSON.stringify(errors) : 'none'}`);
            }
        }
    })

    // Log delivery receipts — kirim/read/sent status
    XeonBotInc.ev.on('message-receipt.update', updates => {
        for (const update of updates) {
            const key = update.key;
            console.log(`[MSG RECEIPT] id=${key?.id} from=${update.receipt?.remoteJid} participant=${update.receipt?.participant} type=${update.receipt?.type} status=${update.receipt?.status}`);
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        const id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    const qrcode = require('qrcode-terminal')
    let connectionAttempts = 0
    const maxConnectionAttempts = 5

    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s

        if (qr) {
            console.log('\n' + '═'.repeat(40))
            console.log('📱 SCAN QR CODE INI')
            console.log('═'.repeat(40))
            qrcode.generate(qr, { small: true })
            console.log('═'.repeat(40))
            console.log('Scan dengan WhatsApp > Link Device\n')
            connectionAttempts = 0
        }

        if (connection === 'open') {
            const ts = chalk.cyan('[' + require('moment-timezone')().tz('Asia/Jakarta').format('HH:mm:ss') + ']');
            console.log('\n' + ts + ' ' + chalk.bgGreen.black(' ONLINE ') + chalk.green(' Bot connected successfully!'));
            console.log(chalk.cyan('════════════════════════════════════════'));
            statsSync.start()
            statsSync.pushOnline()
            connectionAttempts = 0
            try { fs.writeFileSync('./data/botStatus.json', JSON.stringify({ online: true, updatedAt: new Date().toISOString() })) } catch (e) {}
        }

        if (connection === 'close') {
            statsSync.pushOffline()
            try { fs.writeFileSync('./data/botStatus.json', JSON.stringify({ online: false, updatedAt: new Date().toISOString() })) } catch (e) {}
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const errorMessage = lastDisconnect?.error?.message || ''

            console.log(chalk.bgRed.white(' DISCONNECT ') + chalk.red(` Connection closed. Attempt: ${connectionAttempts + 1}/${maxConnectionAttempts}`));

            if (!errorMessage.includes('Bad MAC') && !errorMessage.includes('decrypt')) {
                console.log('Reason:', errorMessage)
            }

            connectionAttempts++

            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('Session logged out. Clearing session...')
                try {
                    fs.rmSync('./session', { recursive: true, force: true })
                } catch (error) {
                    console.log('Error clearing session:', error.message)
                }
                await delay(3000)
                startXeonBotInc()
            } else if (connectionAttempts <= maxConnectionAttempts) {
                console.log(`Reconnecting... (${connectionAttempts}/${maxConnectionAttempts})`)
                await delay(5000)
                startXeonBotInc()
            } else {
                console.log('❌ Max connection attempts reached. Restart manually.')
            }
        }
    })

    XeonBotInc.ev.on('creds.update', saveCreds)

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        try {
            await handleGroupParticipantUpdate(XeonBotInc, update)
        } catch (error) {
            console.error('Error in group update:', error.message)
        }
    })

    const prisma = require('./lib/db');
    setInterval(async () => {
        try {
            const expiredGroups = await prisma.group.findMany({
                where: {
                    expiredAt: {
                        lte: new Date()
                    }
                }
            });

            for (const group of expiredGroups) {
                try {
                    await XeonBotInc.sendMessage(group.id, { text: 'Tuan~ Waktu kebersamaan Yuuki dengan Tuan semua di grup ini telah berakhir. Terima kasih atas kesempatan yang telah diberikan kepada Yuuki untuk melayani. Yuuki mohon diri dan sampai jumpa di lain waktu, Tuan~ 🫶' });
                    await delay(2000);
                    await XeonBotInc.groupLeave(group.id);
                    await prisma.group.update({ where: { id: group.id }, data: { expiredAt: null } });
                    console.log(`Left expired group: ${group.id}`);
                } catch (e) {
                    console.error(`Gagal keluar dari grup expired ${group.id}:`, e);
                }
            }
        } catch (dbError) {
            console.error('Error mengecek sewa grup:', dbError);
        }
    }, 300000); // Check every 5 minutes

    // Auto-cleanup database every 24 hours (at 3 AM)
    const { performAutoCleanup } = require('./lib/cleanupManager');
    setInterval(async () => {
        await performAutoCleanup();
    }, 24 * 60 * 60 * 1000);

    // Schedule initial cleanup if bot starts near 3 AM (just to sync it up roughly)
    const now = new Date();
    const next3AM = new Date(now);
    next3AM.setHours(3, 0, 0, 0);
    if (now > next3AM) {
        next3AM.setDate(next3AM.getDate() + 1);
    }
    const msUntil3AM = next3AM - now;
    setTimeout(async () => {
        await performAutoCleanup();
        setInterval(async () => {
            await performAutoCleanup();
        }, 24 * 60 * 60 * 1000);
    }, msUntil3AM);

    return XeonBotInc
}

startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    setTimeout(() => {
        console.log('Restarting in 10 seconds...')
        startXeonBotInc()
    }, 10000)
})

process.on('uncaughtException', (err) => {
    const errMsg = err?.message || err?.toString() || '';
    if (!errMsg.includes('Bad MAC') && !errMsg.includes('decrypt') && !errMsg.includes('Connection Closed') && !errMsg.includes('Connection Terminated')) {
        console.error('Uncaught Exception:', err);
    }
})

process.on('unhandledRejection', (err) => {
    const errMsg = err?.message || err?.toString() || '';
    if (!errMsg.includes('Bad MAC') && !errMsg.includes('decrypt') && !errMsg.includes('Connection Closed') && !errMsg.includes('Connection Terminated')) {
        console.error('Unhandled Rejection:', err);
    }
})

// Graceful shutdown
const prisma = require('./lib/db');
async function shutdown() {
    console.log('Shutting down gracefully...');
    statsSync.stop()
    try {
        await prisma.$disconnect();
        console.log('Prisma disconnected.');
    } catch (e) {
        console.error('Error disconnecting Prisma:', e);
    }
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`File ${__filename} updated`))
    delete require.cache[file]
    require(file)
})
