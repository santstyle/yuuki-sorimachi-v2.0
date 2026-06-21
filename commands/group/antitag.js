const { setAntitag, getAntitag, removeAntitag } = require('../../lib/index');

function getGreeting() {
    const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false });
    const h = parseInt(hour);
    if (h >= 5 && h < 10) return 'Selamat pagi';
    if (h >= 10 && h < 15) return 'Selamat siang';
    if (h >= 15 && h < 18) return 'Selamat sore';
    return 'Selamat malam';
}

function formatPrivateWarning(text) {
    return `${getGreeting()} Tuan,\n\nPelayanmu yang setia dan rendah hati, Yuuki, ingin memberitahumu sesuatu.\n\n${text}`;
}

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin grup yang bisa mengatur antitag. Yuuki mohon pengertian Tuan~'
            }, { quoted: message });
            return;
        }

        const args = userMessage.slice(9).toLowerCase().trim().split(' ').filter(Boolean);
        const action = args[0];

        if (!action) {
            const usage = `ANTITAG CONFIGURATION

Usage:
  .antitag on         - Aktifkan antitag
  .antitag off        - Nonaktifkan antitag
  .antitag set <mode> - Atur aksi: delete / kick / warn
  .antitag status     - Cek status antitag

Antitag akan merespon jika ada yang tag member di grup`;

            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on': {
                const existingConfig = await getAntitag(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Antitag sudah aktif di grup ini. Yuuki sudah menjaganya~'
                    }, { quoted: message });
                    return;
                }
                await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: `Tuan~ FITUR ANTITAG telah Yuuki aktifkan!\n\nPerhatian untuk seluruh member:\nDilarang men-tag member secara sembarangan.\nPelanggaran akan dihapus dan mendapat peringatan.\n\nYuuki tidak suka tag yang tidak perlu~`
                }, { quoted: message });
                break;
            }

            case 'off': {
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Antitag telah Yuuki nonaktifkan. Silakan tag dengan bijak~'
                }, { quoted: message });
                break;
            }

            case 'set': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Mode belum dipilih. Pilih: delete / kick / warn. Yuuki menunggu petunjuk Tuan~'
                    }, { quoted: message });
                    return;
                }
                const mode = args[1];
                if (!['delete', 'kick', 'warn'].includes(mode)) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Mode tidak valid. Pilih: delete / kick / warn. Yuuki harap Tuan lebih cermat~'
                    }, { quoted: message });
                    return;
                }
                await setAntitag(chatId, 'on', mode);
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Mode antitag telah Yuuki atur ke: ${mode}. Sesuai perintah Tuan~`
                }, { quoted: message });
                break;
            }

            case 'status': {
                const config = await getAntitag(chatId, 'on');
                const status = config?.enabled ? 'AKTIF' : 'NONAKTIF';
                const mode = config?.action || 'Belum diatur';
                const statusMsg = `Tuan~ Berikut status antitag:\n\nStatus : ${status}\nMode   : ${mode}\n\nYuuki siap melaporkan~`;
                await sock.sendMessage(chatId, { text: statusMsg }, { quoted: message });
                break;
            }

            default: {
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Perintah tidak dikenal. Ketik .antitag untuk melihat daftar perintah. Yuuki bingung~'
                }, { quoted: message });
                break;
            }
        }
    } catch (error) {
        console.error('Error di antitag command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal memproses perintah antitag. Ada yang tidak beres~'
        }, { quoted: message });
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting?.enabled) return;

        const msg = message.message;
        const mentions = msg?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const ownerLid = process.env.OWNER_LID ? process.env.OWNER_LID + '@lid' : null;
        const ownerPn = process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER + '@s.whatsapp.net' : null;

        if (mentions.length === 0) return;

        const botVariants = new Set();
        const addVariant = (jid) => {
            if (!jid) return;
            botVariants.add(jid);
            const decoded = sock.decodeJid(jid);
            if (decoded !== jid) botVariants.add(decoded);
            if (jid.endsWith('@s.whatsapp.net')) {
                botVariants.add(jid.replace('@s.whatsapp.net', '@lid'));
                if (decoded !== jid) botVariants.add(decoded.replace('@s.whatsapp.net', '@lid'));
            } else if (jid.endsWith('@lid')) {
                botVariants.add(jid.replace('@lid', '@s.whatsapp.net'));
                if (decoded !== jid) botVariants.add(decoded.replace('@lid', '@s.whatsapp.net'));
            }
        };
        addVariant(sock.user?.id);
        addVariant(sock.user?.lid);

        const isTaggingBot = mentions.some(jid => botVariants.has(jid)) || mentions.includes(ownerLid) || mentions.includes(ownerPn);
        const isTaggingSelf = mentions.includes(senderId);
        if (isTaggingSelf) return;

        const senderNum = senderId.split('@')[0];
        const action = antitagSetting.action || 'delete';

        try {
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: message.key.id,
                    participant: message.key.participant || senderId
                }
            });
        } catch (error) {
            console.error('Gagal hapus pesan tag:', error);
        }

        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chatId);
        } catch (err) {
            console.error('Gagal ambil group metadata:', err);
        }
        const groupName = groupMetadata?.subject || 'grup ini';

        let warningText;

        if (action === 'warn') {
            const { incrementWarningCount, resetWarningCount } = require('../../lib/index');
            const config = require('../../config');
            const WARN_COUNT = config.WARN_COUNT || 3;
            const warningCount = await incrementWarningCount(chatId, senderId);

            if (warningCount >= WARN_COUNT) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await resetWarningCount(chatId, senderId);
                    warningText = `@${senderNum} telah Yuuki keluarkan karena tag member (${WARN_COUNT}/${WARN_COUNT} warning). Semoga lain kali lebih bijak~`;

                    await sock.sendMessage(senderId, {
                        text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (tag member).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                    });
                } catch (kickError) {
                    console.error('Gagal kick user:', kickError);
                    warningText = `@${senderNum} jangan tag member di grup ini (${warningCount}/${WARN_COUNT} warning). Yuuki mengawasi~`;
                }
            } else {
                warningText = `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk tag member. Berhati-hatilah~`;
            }
        } else if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                warningText = `@${senderNum} telah Yuuki keluarkan karena tag member. Semoga harimu menyenangkan~`;

                await sock.sendMessage(senderId, {
                    text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (tag member).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                });
            } catch (kickError) {
                console.error('Gagal kick user:', kickError);
                warningText = `@${senderNum} jangan tag member di grup ini. Yuuki tidak suka tag sembarangan~`;
            }
        } else {
            warningText = `@${senderNum} jangan tag member di grup ini. Yuuki mohon jaga ketertiban~`;
        }

        await sock.sendMessage(chatId, {
            text: `${warningText}\n\nPerhatian: Fitur antitag sedang aktif. Yuuki terus mengawasi~`,
            mentions: [senderId]
        }, { quoted: message });
    } catch (error) {
        console.error('Error di tag detection:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};
