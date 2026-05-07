const { getWarningsByUser, getWarningCount } = require('../../lib/warningManager');

async function warningsCommand(sock, chatId, mentionedJidList) {
    try {
        if (mentionedJidList.length === 0) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Tag user yang ingin dicek warningnya.\nContoh: .warnings @username\n\nYuuki menunggu~'
            });
            return;
        }

        const userToCheck = mentionedJidList[0];
        const warnCount = await getWarningCount(userToCheck, chatId);
        const warnings = await getWarningsByUser(userToCheck, chatId);

        if (warnCount === 0) {
            await sock.sendMessage(chatId, {
                text: `Tuan~ User @${userToCheck.split('@')[0]} belum pernah mendapat warning. Bersih, ya~`,
                mentions: [userToCheck]
            });
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
            });
        }
    } catch (error) {
        console.error('Error in warnings command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil data warning. Mungkin ada gangguan~'
        });
    }
}

module.exports = warningsCommand;
