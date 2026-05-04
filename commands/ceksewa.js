const prisma = require('../lib/db');

async function cekSewaCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'Perintah ini hanya bisa digunakan di grup.' });
            return;
        }

        const groupData = await prisma.group.findUnique({
            where: { id: chatId }
        });

        if (!groupData) {
            await sock.sendMessage(chatId, { text: 'Bot ini belum memiliki data sewa di grup ini (Kemungkinan mode gratis).' });
            return;
        }

        if (!groupData.expiredAt) {
            await sock.sendMessage(chatId, { text: 'Status bot di grup ini adalah: *Permanen* ♾️' });
            return;
        }

        const now = new Date();
        const expiredAt = new Date(groupData.expiredAt);
        const timeDiff = expiredAt.getTime() - now.getTime();

        if (timeDiff <= 0) {
            await sock.sendMessage(chatId, { text: 'Waktu sewa bot di grup ini sudah habis.' });
        } else {
            const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            await sock.sendMessage(chatId, { 
                text: `*Status Sewa Grup*\n\nSisa waktu: *${daysLeft} hari, ${hoursLeft} jam, ${minutesLeft} menit*\nBerakhir pada: *${expiredAt.toLocaleString('id-ID')}*` 
            });
        }
    } catch (error) {
        console.error('Error in ceksewa command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat mengecek status sewa.' });
    }
}

module.exports = cekSewaCommand;
