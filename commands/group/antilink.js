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

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Cuma admin grup yang bisa atur antilink'
            });
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

            await sock.sendMessage(chatId, { text: usage });
            return;
        }

        switch (action) {
            case 'on': {
                const existingConfig = await getAntilink(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: 'Antilink sudah aktif di grup ini'
                    });
                    return;
                }
                await setAntilink(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: `FITUR ANTILINK DIAKTIFKAN\n\nPerhatian untuk seluruh member:\nFitur Antilink telah diaktifkan di grup ini.\nDilarang mengirim tautan/link apapun.\nPelanggaran akan dihapus dan mendapat peringatan.`
                });
                break;
            }

            case 'off': {
                await removeAntilink(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: 'Antilink berhasil dinonaktifkan'
                });
                break;
            }

            case 'set': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: 'Mode belum dipilih. Pilih: delete / kick / warn'
                    });
                    return;
                }
                const mode = args[1];
                if (!['delete', 'kick', 'warn'].includes(mode)) {
                    await sock.sendMessage(chatId, {
                        text: 'Mode tidak valid. Pilih: delete / kick / warn'
                    });
                    return;
                }
                await setAntilink(chatId, 'on', mode);
                await sock.sendMessage(chatId, {
                    text: `Mode antilink berhasil diatur ke: ${mode}`
                });
                break;
            }

            case 'status': {
                const config = await getAntilink(chatId, 'on');
                const status = config?.enabled ? 'AKTIF' : 'NONAKTIF';
                const mode = config?.action || 'Belum diatur';
                const statusMsg = `ANTILINK STATUS

Status : ${status}
Mode   : ${mode}`;
                await sock.sendMessage(chatId, { text: statusMsg });
                break;
            }

            default: {
                await sock.sendMessage(chatId, {
                    text: 'Perintah tidak dikenal. Ketik .antilink untuk melihat daftar perintah'
                });
                break;
            }
        }
    } catch (error) {
        console.error('Error di antilink command:', error);
        await sock.sendMessage(chatId, {
            text: 'Gagal memproses perintah antilink'
        });
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
                    warningText = `@${senderNum} telah dikeluarkan karena mengirim link (${WARN_COUNT}/${WARN_COUNT} warning)`;

                    await sock.sendMessage(senderId, {
                        text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (mengirim link).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                    });
                } catch (kickError) {
                    console.error('Gagal kick user:', kickError);
                    warningText = `@${senderNum} jangan kirim link di grup ini (${warningCount}/${WARN_COUNT} warning)`;
                }
            } else {
                warningText = `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk mengirim link`;
            }
        } else if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                warningText = `@${senderNum} telah dikeluarkan karena mengirim link`;

                await sock.sendMessage(senderId, {
                    text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (mengirim link).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                });
            } catch (kickError) {
                console.error('Gagal kick user:', kickError);
                warningText = `@${senderNum} jangan kirim link di grup ini`;
            }
        } else {
            warningText = `@${senderNum} jangan kirim link di grup ini`;
        }

        await sock.sendMessage(chatId, {
            text: `${warningText}\n\nPerhatian: Fitur antilink sedang aktif.`,
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
