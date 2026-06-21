const prisma = require('../../lib/db');
const { getNextCustomId } = require('../../lib/customId');

async function setnameCommand(sock, chatId, message, args, senderId) {
    try {
        const name = args.join(' ').trim();

        if (!name) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Cara penggunaan:\n\n.setname <nama>\n\nContoh:\n.setname SantStyle\n\nYuuki akan menyimpan nama Tuan di database untuk ditampilkan di leaderboard~'
            }, { quoted: message });
            return;
        }

        if (name.length > 25) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Nama terlalu panjang. Maksimal 25 karakter saja, ya~'
            }, { quoted: message });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: senderId },
            select: { id: true, customId: true }
        });

        if (existingUser) {
            await prisma.user.update({
                where: { id: senderId },
                data: { name }
            });
        } else {
            const nextId = await getNextCustomId();
            await prisma.user.create({
                data: { id: senderId, name, customId: nextId }
            });
        }

        await prisma.userProgress.upsert({
            where: { userId: senderId },
            update: { userName: name },
            create: { userId: senderId, userName: name, xp: 0, level: 1 }
        });

        await sock.sendMessage(chatId, {
            text: `Baik, Tuan~ Nama Tuan telah Yuuki catat sebagai: *${name}*\n\nCek perubahan di .leaderboard atau .mylevel, Tuan~`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in setname command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal menyimpan nama. Mungkin ada gangguan~'
        }, { quoted: message });
    }
}

module.exports = { setnameCommand };
