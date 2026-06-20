const isAdmin = require('../../lib/isAdmin');
const { addWarning, getWarningCount, getMaxWarnLevel } = require('../../lib/warningManager');
const { getGroupSettings } = require('../../lib/groupSettings');

async function warnCommand(sock, chatId, senderId, mentionedJids, message, reason = 'Tidak ada alasan') {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Command warn hanya bisa dipakai di grup. Yuuki tidak bisa melayaninya di sini~'
            }, { quoted: message });
            return;
        }

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki harus menjadi admin untuk menggunakan fitur warning. Bisakah Tuan mengangkat Yuuki?~'
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin grup yang bisa memberikan warning. Yuuki mohon pengertian Tuan~'
            }, { quoted: message });
            return;
        }

        let userToWarn;

        if (mentionedJids && mentionedJids.length > 0) {
            userToWarn = mentionedJids[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToWarn = message.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToWarn) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ *Panduan Penggunaan Warning*\n\n' +
                    '`.warn @user [alasan]` — Beri peringatan ke member\n' +
                    '`.warnings @user` — Lihat daftar warning user\n' +
                    '`.resetwarn @user` — Hapus semua warning user\n\n' +
                    '*Contoh:*\n' +
                    '`.warn @user Spam berlebihan`\n' +
                    '`.warn @user` (reply pesan)\n\n' +
                    'Yuuki akan mencatat setiap pelanggaran dengan setia~ Apakah Tuan ingin memberikan peringatan sekarang?'
            }, { quoted: message });
            return;
        }

        const senderName = message.pushName || 'Admin';
        const targetName = message.message?.extendedTextMessage?.contextInfo?.participant || userToWarn.split('@')[0];

        await addWarning(userToWarn, targetName, chatId, reason, message.key.id, senderId, senderName);

        const warnCount = await getWarningCount(userToWarn, chatId);
        const maxWarn = await getMaxWarnLevel(chatId);

        const warningText = `Tuan~ PERINGATAN telah Yuuki catat:\n\n` +
            `User: @${userToWarn.split('@')[0]}\n` +
            `Warning ke: ${warnCount}/${maxWarn}\n` +
            `Oleh: @${senderId.split('@')[0]}\n` +
            `Alasan: ${reason}\n\n` +
            `@${userToWarn.split('@')[0]}, jangan diulangi lagi~ Yuuki mengawasi.`;

        await sock.sendMessage(chatId, {
            text: warningText,
            mentions: [userToWarn, senderId]
        }, { quoted: message });

        if (warnCount >= maxWarn) {
            await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");

            const kickText = `Tuan~ AUTO-KICK!\n\n` +
                `@${userToWarn.split('@')[0]} telah mencapai batas maksimal warning (${maxWarn}) dan Yuuki keluarkan dari grup. Semoga bertemu di lain waktu~`;

            await sock.sendMessage(chatId, {
                text: kickText,
                mentions: [userToWarn]
            });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal memberikan warning. Coba lagi, ya~'
        }, { quoted: message });
    }
}

module.exports = warnCommand;
