const prisma = require('../../lib/db');
const isAdmin = require('../../lib/isAdmin');

async function cekSewaCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya bisa digunakan di grup. Yuuki tidak bisa melayaninya di sini~' });
            return;
        }

        // Check if sender is admin
        const senderId = message.key.participant || message.key.remoteJid;
        const adminStatus = await isAdmin(sock, chatId, senderId, message);
        if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin grup yang bisa menggunakan command ini. Yuuki mohon pengertian~' });
            return;
        }

        const groupData = await prisma.group.findUnique({
            where: { id: chatId }
        });

        if (!groupData) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Grup ini belum tercatat dalam catatan Yuuki. Mungkin memang belum waktunya? Atau... *mungkin Yuuki yang lupa?* Ah, maafkan Yuuki~' });
            return;
        }

        if (!groupData.expiredAt) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Yuuki terikat selamanya dengan grup ini. Tidak ada akhir... *sampai dunia ini berhenti berputar.* Yuuki akan setia melayani Tuan~' });
            return;
        }

        const now = new Date();
        const expiredAt = new Date(groupData.expiredAt);
        const timeDiff = expiredAt.getTime() - now.getTime();

        if (timeDiff <= 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Masa sewa telah berakhir... *Seperti takdir yang memisahkan kita.* Yuuki harus pergi. Semoga suatu hari kita bertemu lagi~' });
        } else {
            const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            await sock.sendMessage(chatId, { 
                text: `Tuan~ Yuuki memiliki sisa waktu *${daysLeft} hari, ${hoursLeft} jam, ${minutesLeft} menit* lagi bersama Tuan. Waktu terus berlari... *tapi Yuuki akan memanfaatkan setiap detiknya untuk melayani Tuan.* Berakhir pada: ${expiredAt.toLocaleString('en-US')}` 
            });
        }
    } catch (error) {
        console.error('Error in ceksewa command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki mengalami error saat mengecek status sewa. Mungkin ada yang mengganggu Yuuki~' });
    }
}

module.exports = cekSewaCommand;
