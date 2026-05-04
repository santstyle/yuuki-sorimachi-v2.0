const prisma = require('../lib/db');
const { isSudo } = require('../lib/index');

async function sewaCommand(sock, chatId, message, args, senderId) {
    try {
        const isOwner = message.key.fromMe || (await isSudo(senderId));
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Perintah ini hanya untuk Owner bot.' });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(chatId, { text: 'Contoh di Grup:\n.sewa 30\n.sewa permanent\n\nContoh di DM (Pribadi):\n.sewa <ID_Grup> 30' });
            return;
        }

        let targetGroupId = chatId;
        let durationArg = args[0].toLowerCase();

        // Jika digunakan di Private Chat, argumen pertama harus ID grup
        if (!chatId.endsWith('@g.us')) {
            if (args.length < 2) {
                await sock.sendMessage(chatId, { text: 'Gunakan format di DM:\n.sewa <ID_Grup> <Jumlah Hari/permanent>' });
                return;
            }
            targetGroupId = args[0];
            durationArg = args[1].toLowerCase();
            
            if (!targetGroupId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, { text: 'ID Grup tidak valid. Harus berakhiran @g.us' });
                return;
            }
        }

        let expiredAt = null;

        if (durationArg !== 'permanent' && durationArg !== 'permanen') {
            const days = parseInt(durationArg);
            if (isNaN(days) || days <= 0) {
                await sock.sendMessage(chatId, { text: 'Masukkan jumlah hari yang valid (angka) atau ketik "permanent".' });
                return;
            }
            
            expiredAt = new Date();
            expiredAt.setDate(expiredAt.getDate() + days);
        }

        let groupSubject = 'Unknown Group';
        try {
            const groupMetadata = await sock.groupMetadata(targetGroupId);
            groupSubject = groupMetadata.subject;
        } catch (e) {
            console.log('Gagal mengambil metadata grup, mungkin bot tidak ada di grup tersebut.');
        }

        await prisma.group.upsert({
            where: { id: targetGroupId },
            update: { 
                name: groupSubject,
                expiredAt: expiredAt 
            },
            create: { 
                id: targetGroupId, 
                name: groupSubject,
                expiredAt: expiredAt 
            }
        });

        if (expiredAt) {
            await sock.sendMessage(chatId, { text: `✅ Berhasil mengatur waktu sewa bot di grup ini.\nBot akan otomatis keluar pada: *${expiredAt.toLocaleString('id-ID')}*` });
        } else {
            await sock.sendMessage(chatId, { text: `✅ Berhasil mengatur status bot di grup ini menjadi *Permanen*.` });
        }
    } catch (error) {
        console.error('Error in sewa command:', error);
        await sock.sendMessage(chatId, { text: 'Terjadi kesalahan saat mengatur sewa grup.' });
    }
}

module.exports = sewaCommand;
