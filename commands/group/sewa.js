const prisma = require('../../lib/db');
const { isSudo } = require('../../lib/index');

async function sewaCommand(sock, chatId, message, args, senderId) {
    try {
        const isOwner = message.key.fromMe || (await isSudo(senderId));
        if (!isOwner) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Perintah ini hanya untuk Owner bot. Yuuki tidak bisa melayaninya~' }, { quoted: message });
            return;
        }

        if (args.length === 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Berikut cara penggunaan:\n\nContoh di Grup:\n.sewa 30 (masa berlaku *30 hari*)\n.sewa permanent\n\nContoh di DM:\n.sewa <ID_Grup> 30\n\nUntuk *memperpanjang* masa sewa, cukup jalankan perintah yang sama dengan jumlah hari baru. Maka batas waktu akan dihitung ulang dari hari ini.\n\nContoh:\n.sewa 15 (perpanjang 15 hari dari hari ini)\n\nYuuki menunggu perintah Tuan~' }, { quoted: message });
            return;
        }

        let targetGroupId = chatId;
        let durationArg = args[0].toLowerCase();

        if (!chatId.endsWith('@g.us')) {
            if (args.length < 2) {
                await sock.sendMessage(chatId, { text: 'Tuan~ Format di DM:\n.sewa <ID_Grup> <Jumlah Hari>\n.sewa <ID_Grup> permanent\n\nJumlah hari = angka (misal: 30 = 30 hari)\n\nYuuki harap Tuan lebih lengkap~' }, { quoted: message });
                return;
            }
            targetGroupId = args[0];
            durationArg = args[1].toLowerCase();
            
            if (!targetGroupId.endsWith('@g.us')) {
                await sock.sendMessage(chatId, { text: 'Tuan~ ID Grup tidak valid. Harus berakhiran @g.us. Yuuki harap Tuan periksa lagi~' }, { quoted: message });
                return;
            }
        }

        let expiredAt = null;

        if (durationArg !== 'permanent' && durationArg !== 'permanen') {
            const days = parseInt(durationArg);
            if (isNaN(days) || days <= 0) {
                await sock.sendMessage(chatId, { text: 'Tuan~ Masukkan jumlah *hari* yang valid (angka) atau ketik "permanent". Yuuki butuh angka yang benar~' }, { quoted: message });
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
            await sock.sendMessage(chatId, { text: `Tuan~ Sewa bot di grup ini telah Yuuki atur!\nBot akan otomatis keluar pada: *${expiredAt.toLocaleString('id-ID')}*\n\nYuuki akan setia sampai akhir~` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: `Tuan~ Status bot di grup ini telah menjadi *Permanen*. Yuuki akan selalu ada untuk Tuan~` }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in sewa command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengatur sewa grup. Mungkin ada yang tidak beres~' }, { quoted: message });
    }
}

module.exports = sewaCommand;
