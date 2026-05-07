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

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Cuma admin grup yang bisa atur antitag'
            });
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

            await sock.sendMessage(chatId, { text: usage });
            return;
        }

        switch (action) {
            case 'on': {
                const existingConfig = await getAntitag(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: 'Antitag sudah aktif di grup ini'
                    });
                    return;
                }
                await setAntitag(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: `FITUR ANTITAG DIAKTIFKAN\n\nPerhatian untuk seluruh member:\nFitur Antitag telah diaktifkan di grup ini.\nDilarang men-tag member secara sembarangan.\nPelanggaran akan dihapus dan mendapat peringatan.`
                });
                break;
            }

            case 'off': {
                await removeAntitag(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: 'Antitag berhasil dinonaktifkan'
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
                await setAntitag(chatId, 'on', mode);
                await sock.sendMessage(chatId, {
                    text: `Mode antitag berhasil diatur ke: ${mode}`
                });
                break;
            }

            case 'status': {
                const config = await getAntitag(chatId, 'on');
                const status = config?.enabled ? 'AKTIF' : 'NONAKTIF';
                const mode = config?.action || 'Belum diatur';
                const statusMsg = `ANTITAG STATUS

Status : ${status}
Mode   : ${mode}`;
                await sock.sendMessage(chatId, { text: statusMsg });
                break;
            }

            default: {
                await sock.sendMessage(chatId, {
                    text: 'Perintah tidak dikenal. Ketik .antitag untuk melihat daftar perintah'
                });
                break;
            }
        }
    } catch (error) {
        console.error('Error di antitag command:', error);
        await sock.sendMessage(chatId, {
            text: 'Gagal memproses perintah antitag'
        });
    }
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting?.enabled) return;

        const msg = message.message;
        const mentions = msg?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const ownerLid = process.env.OWNER_LID ? process.env.OWNER_LID + '@lid' : null;
        const ownerPn = process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER + '@s.whatsapp.net' : null;

        if (mentions.length === 0) return;

        const isTaggingBot = mentions.includes(botJid) || mentions.includes(ownerLid) || mentions.includes(ownerPn);
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
                    warningText = `@${senderNum} telah dikeluarkan karena tag member (${WARN_COUNT}/${WARN_COUNT} warning)`;

                    await sock.sendMessage(senderId, {
                        text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (tag member).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                    });
                } catch (kickError) {
                    console.error('Gagal kick user:', kickError);
                    warningText = `@${senderNum} jangan tag member di grup ini (${warningCount}/${WARN_COUNT} warning)`;
                }
            } else {
                warningText = `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk tag member`;
            }
        } else if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                warningText = `@${senderNum} telah dikeluarkan karena tag member`;

                await sock.sendMessage(senderId, {
                    text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (tag member).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                });
            } catch (kickError) {
                console.error('Gagal kick user:', kickError);
                warningText = `@${senderNum} jangan tag member di grup ini`;
            }
        } else {
            warningText = `@${senderNum} jangan tag member di grup ini`;
        }

        await sock.sendMessage(chatId, {
            text: `${warningText}\n\nPerhatian: Fitur antitag sedang aktif.`,
            mentions: [senderId]
        });
    } catch (error) {
        console.error('Error di tag detection:', error);
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};
