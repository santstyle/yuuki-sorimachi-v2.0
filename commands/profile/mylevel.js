const { getProgress, getXPForNextLevel } = require('../../lib/xpManager');
const prisma = require('../../lib/db');

async function mylevelCommand(sock, chatId, message, args) {
    try {
        let targetId = message.key.participant || message.key.remoteJid;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJid.length > 0) {
            targetId = mentionedJid[0];
        } else if (args.length > 0) {
            const rawQuery = args.join(' ').replace(/[^0-9]/g, '');
            if (rawQuery.length > 5) {
                targetId = `${rawQuery}@s.whatsapp.net`;
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: targetId },
            select: { name: true, id: true }
        });

        if (!user) {
            await sock.sendMessage(chatId, { text: 'User belum terdaftar di database.' }, { quoted: message });
            return;
        }

        let progress = await getProgress(targetId);

        if (!progress) {
            progress = await prisma.userProgress.upsert({
                where: { userId: targetId },
                update: {},
                create: { userId: targetId, xp: 0, level: 1 }
            });
        }

        const requiredXP = getXPForNextLevel(progress.level);
        const percentage = Math.min((progress.xp / requiredXP) * 100, 100).toFixed(1);
        const barLength = 20;
        const filled = Math.floor((progress.xp / requiredXP) * barLength);
        const progressBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

        const text = `User Profile: ${user.name || 'Unknown'}

Level: ${progress.level}
XP: ${progress.xp} / ${requiredXP}
Progress: [${progressBar}] ${percentage}%

Terus aktif menggunakan bot untuk naik level!`;

        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (error) {
        console.error('Error in mylevel command:', error);
        await sock.sendMessage(chatId, { text: 'Gagal mengambil data level.' }, { quoted: message });
    }
}

module.exports = { mylevelCommand };
