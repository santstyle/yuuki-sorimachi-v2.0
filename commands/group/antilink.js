const { setAntilink, getAntilink, removeAntilink } = require('../../lib/index');
const isAdmin = require('../../lib/isAdmin');

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

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin grup yang bisa mengatur antilink. Yuuki mohon pengertian~'
            }, { quoted: message });
            return;
        }

        const args = userMessage.slice(9).toLowerCase().trim().split(' ').filter(Boolean);
        const action = args[0];

        if (!action) {
            const usage = `ANTILINK CONFIGURATION

Usage:
  .antilink on         - Aktifkan antilink
  .antilink off        - Nonaktifkan antilink
  .antilink set <mode> - Atur aksi: delete / kick / warn
  .antilink status     - Cek status antilink

Antilink akan merespon jika ada yang kirim link di grup`;

            await sock.sendMessage(chatId, { text: usage }, { quoted: message });
            return;
        }

        switch (action) {
            case 'on': {
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Antilink sudah aktif di grup ini. Yuuki sudah menjaganya dengan baik~'
                    }, { quoted: message });
                    return;
                }
                await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: `Tuan~ FITUR ANTILINK telah Yuuki aktifkan!\n\nPerhatian untuk seluruh member:\nDilarang mengirim tautan/link apapun.\nPelanggaran akan dihapus dan mendapat peringatan.\n\nYuuki tidak akan melewatkan satu link pun~`
                }, { quoted: message });
                break;
            }

            case 'off': {
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Antilink telah Yuuki nonaktifkan. Silakan share link dengan bijak~'
                }, { quoted: message });
                break;
            }

            case 'set': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Mode belum dipilih. Pilih salah satu: delete / kick / warn. Yuuki menunggu perintah Tuan~'
                    }, { quoted: message });
                    return;
                }
                const mode = args[1];
                if (!['delete', 'kick', 'warn'].includes(mode)) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Mode tidak valid. Pilih: delete / kick / warn. Yuuki harap Tuan lebih teliti~'
                    }, { quoted: message });
                    return;
                }
                await setAntilink(chatId, 'on', mode);
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Mode antilink telah Yuuki atur ke: ${mode}. Sesuai keinginan Tuan~`
                }, { quoted: message });
                break;
            }

            case 'status': {
                const config = await getAntilink(chatId, 'on');
                const status = config?.enabled ? 'AKTIF' : 'NONAKTIF';
                const mode = config?.action || 'Belum diatur';
                const statusMsg = `Tuan~ Berikut status antilink:\n\nStatus : ${status}\nMode   : ${mode}\n\nYuuki siap melaporkan~`;
                await sock.sendMessage(chatId, { text: statusMsg }, { quoted: message });
                break;
            }

            default: {
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Perintah tidak dikenal. Ketik .antilink untuk melihat daftar perintah. Yuuki bingung harus melakukan apa~'
                }, { quoted: message });
                break;
            }
        }
    } catch (error) {
        console.error('Error di antilink command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal memproses perintah antilink. Mungkin ada gangguan teknis~'
        }, { quoted: message });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const antilinkSetting = await getAntilink(chatId, 'on');
        if (!antilinkSetting?.enabled) return;

        const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
        if (!urlRegex.test(userMessage.trim())) return;

        const quotedMessageId = message.key.id;
        const quotedParticipant = message.key.participant || senderId;

        try {
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: quotedMessageId,
                    participant: quotedParticipant
                }
            });
        } catch (error) {
            console.error('Gagal hapus pesan link:', error);
        }

        const senderNum = senderId.split('@')[0];
        const action = antilinkSetting.action || 'delete';

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
                    warningText = `@${senderNum} telah Yuuki keluarkan karena mengirim link (${WARN_COUNT}/${WARN_COUNT} warning). Semoga bertemu di lain kesempatan~`;

                    await sock.sendMessage(senderId, {
                        text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (mengirim link).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                    });
                } catch (kickError) {
                    console.error('Gagal kick user:', kickError);
                    warningText = `@${senderNum} jangan kirim link di grup ini (${warningCount}/${WARN_COUNT} warning). Yuuki mengawasi~`;
                }
            } else {
                warningText = `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk mengirim link. Hati-hati, Yuuki melihat~`;
            }
        } else if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                warningText = `@${senderNum} telah Yuuki keluarkan karena mengirim link. Semoga harimu menyenangkan di luar sana~`;

                await sock.sendMessage(senderId, {
                    text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (mengirim link).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                });
            } catch (kickError) {
                console.error('Gagal kick user:', kickError);
                warningText = `@${senderNum} jangan kirim link di grup ini. Yuuki tidak suka link sembarangan~`;
            }
        } else {
            warningText = `@${senderNum} jangan kirim link di grup ini. Yuuki mohon patuhi aturan~`;
        }

        await sock.sendMessage(chatId, {
            text: `${warningText}\n\nPerhatian: Fitur antilink sedang aktif. Yuuki terus mengawasi~`,
            mentions: [senderId]
        });
    } catch (error) {
        console.error('Error di link detection:', error);
    }
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
};
