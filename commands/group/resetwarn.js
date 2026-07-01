const isAdmin = require('../../lib/isAdmin');
const { clearWarnings, getWarningCount } = require('../../lib/warningManager');
const { resolveJid } = require('../../lib/jidResolver');

async function resetWarnCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Command resetwarn hanya bisa dipakai di grup. Yuuki tidak bisa melayaninya di sini~'
            }, { quoted: message });
            return;
        }

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Yuuki harus menjadi admin untuk menggunakan fitur ini. Bisakah Tuan mengangkat Yuuki?~'
            }, { quoted: message });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin grup yang bisa mereset warning. Yuuki mohon pengertian Tuan~'
            }, { quoted: message });
            return;
        }

        let userToReset;

        if (mentionedJids && mentionedJids.length > 0) {
            userToReset = await resolveJid(sock, mentionedJids[0]);
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToReset = await resolveJid(sock, message.message.extendedTextMessage.contextInfo.participant);
        }

        if (!userToReset) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ *Panduan Reset Warning*\n\n' +
                    '`.resetwarn @user` — Hapus semua warning user\n\n' +
                    '*Contoh:*\n' +
                    '`.resetwarn @user`\n' +
                    '`.resetwarn` (reply pesan user)\n\n' +
                    'Yuuki akan membersihkan catatan pelanggaran mereka~ Apakah Tuan yakin ingin memberi mereka kesempatan kedua?'
            }, { quoted: message });
            return;
        }

        const warnCount = await getWarningCount(userToReset, chatId);

        if (warnCount === 0) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ User @${userToReset.split('@')[0]} tidak memiliki warning. Catatannya bersih~`,
                mentions: [userToReset]
            }, { quoted: message });
            return;
        }

        await clearWarnings(userToReset, chatId);

        await sock.sendMessage(chatId, {
            text: `Tuan~ ${warnCount} warning milik @${userToReset.split('@')[0]} telah Yuuki hapus. Semoga ia memanfaatkan kesempatan kedua ini dengan baik~`,
            mentions: [userToReset]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in resetwarn command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mereset warning. Coba lagi, ya~'
        }, { quoted: message });
    }
}

module.exports = { resetWarnCommand };