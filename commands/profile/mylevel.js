const { getProgress, getXPForNextLevel } = require('../../lib/xpManager');
const prisma = require('../../lib/db');
const { resolveJid } = require('../../lib/jidResolver');

async function mylevelCommand(sock, chatId, message, args) {
    try {
        let targetId = await resolveJid(sock, message.key.participant || message.key.remoteJid);
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (mentionedJid.length > 0) {
            targetId = await resolveJid(sock, mentionedJid[0]);
        } else if (args.length > 0) {
            const rawQuery = args.join(' ').replace(/[^0-9]/g, '');
            if (rawQuery.length > 5) {
                targetId = `${rawQuery}@s.whatsapp.net`;
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: targetId },
            select: { name: true, id: true, customId: true }
        });

        if (!user) {
            await sock.sendMessage(chatId, { text: 'Tuan~ User belum terdaftar di database Yuuki~' }, { quoted: message });
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

        await sock.sendMessage(chatId, {
            text: `User Profile: ${user.name || 'Unknown'}

User ID: ${user.customId || 'Not assigned'}
Level: ${progress.level}
XP: ${progress.xp} / ${requiredXP}
Progress: [${progressBar}] ${percentage}%`
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            text: 'Terus aktif menggunakan Yuuki untuk naik level, Tuan~'
        }, { quoted: message });
    } catch (error) {
        console.error('Error in mylevel command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengambil data level~' }, { quoted: message });
    }
}

module.exports = { mylevelCommand };
