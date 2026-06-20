async function staffCommand(sock, chatId, msg) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);

        if (groupAdmins.length === 0) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Grup ini belum memiliki admin. Sepi sekali~ Yuuki sedih~'
            }, { quoted: msg });
            return;
        }

        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        const text = `Tuan~ Berikut admin grup ${groupMetadata.subject} yang Yuuki kenal:\n\n${listAdmin}\n\nJika butuh bantuan, mereka adalah orang yang tepat~`;

        try {
            const pp = await sock.profilePictureUrl(chatId, 'image');
            await sock.sendMessage(chatId, {
                image: { url: pp },
                caption: text,
                mentions: [...groupAdmins.map(v => v.id), owner]
            }, { quoted: msg });
        } catch {
            await sock.sendMessage(chatId, {
                text,
                mentions: [...groupAdmins.map(v => v.id), owner]
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('Error di staff command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil daftar admin. Mungkin lain kali~'
        }, { quoted: msg });
    }
}

module.exports = staffCommand;
