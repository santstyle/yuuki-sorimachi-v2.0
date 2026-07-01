const { getWarningsByUser, getWarningCount } = require('../../lib/warningManager');
const { resolveJid } = require('../../lib/jidResolver');

async function warningsCommand(sock, chatId, mentionedJidList, message) {
    try {
        let userToCheck;

        if (mentionedJidList && mentionedJidList.length > 0) {
            userToCheck = await resolveJid(sock, mentionedJidList[0]);
        } else if (message?.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCheck = await resolveJid(sock, message.message.extendedTextMessage.contextInfo.participant);
        }

        if (!userToCheck) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Tag user yang ingin dicek warningnya.\nContoh: .warnings @username\nAtau reply pesan user dengan .warnings\n\nYuuki menunggu~'
            }, { quoted: message });
            return;
        }

        const warnCount = await getWarningCount(userToCheck, chatId);
        const warnings = await getWarningsByUser(userToCheck, chatId);

        if (warnCount === 0) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ User @${userToCheck.split('@')[0]} belum pernah mendapat warning. Bersih, ya~`,
                mentions: [userToCheck]
            }, { quoted: message });
        } else {
            let detailList = `Tuan~ User @${userToCheck.split('@')[0]} memiliki ${warnCount} warning:\n\n`;
            
            warnings.slice(0, 10).forEach((w, i) => {
                detailList += `${i + 1}. Alasan: ${w.reason}\n`;
                detailList += `   Oleh: ${w.moderatorName || 'Unknown'}\n`;
                detailList += `   Tanggal: ${w.createdAt.toLocaleDateString('id-ID')}\n\n`;
            });

            await sock.sendMessage(chatId, {
                text: detailList.trim(),
                mentions: [userToCheck]
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in warnings command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil data warning. Mungkin ada gangguan~'
        }, { quoted: message });
    }
}

module.exports = warningsCommand;
