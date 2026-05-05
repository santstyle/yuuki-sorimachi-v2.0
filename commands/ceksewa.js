const prisma = require('../lib/db');
const isAdmin = require('../lib/isAdmin');

async function cekSewaCommand(sock, chatId, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'This command can only be used in groups.' });
            return;
        }

        // Check if sender is admin
        const senderId = message.key.participant || message.key.remoteJid;
        const adminStatus = await isAdmin(sock, chatId, senderId, message);
        if (!adminStatus.isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.' });
            return;
        }

        const groupData = await prisma.group.findUnique({
            where: { id: chatId }
        });

        if (!groupData) {
            await sock.sendMessage(chatId, { text: 'This group has no rental data (Possibly in free mode).' });
            return;
        }

        if (!groupData.expiredAt) {
            await sock.sendMessage(chatId, { text: 'Bot status in this group is: *Permanent* ♾️' });
            return;
        }

        const now = new Date();
        const expiredAt = new Date(groupData.expiredAt);
        const timeDiff = expiredAt.getTime() - now.getTime();

        if (timeDiff <= 0) {
            await sock.sendMessage(chatId, { text: 'Bot rental period in this group has expired.' });
        } else {
            const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

            await sock.sendMessage(chatId, { 
                text: `*Group Rental Status*\n\nRemaining time: *${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes*\nExpires on: *${expiredAt.toLocaleString('en-US')}*` 
            });
        }
    } catch (error) {
        console.error('Error in ceksewa command:', error);
        await sock.sendMessage(chatId, { text: 'An error occurred while checking rental status.' });
    }
}

module.exports = cekSewaCommand;

