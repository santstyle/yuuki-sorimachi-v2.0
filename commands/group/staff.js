async function staffCommand(sock, chatId, msg) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);

        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = ''; 
        }

        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');

        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        const text = `
Tuan~ Berikut daftar admin grup *${groupMetadata.subject}* yang Yuuki kenal:

*ADMINS*
${listAdmin}

Merekalah yang bisa diandalkan~`.trim();

        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner]
        });

    } catch (error) {
        console.error('Error in staff command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengambil daftar admin. Ada yang mengganggu Yuuki~' });
    }
}

module.exports = staffCommand;

async function staffCommand(sock, chatId, msg) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);

        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = ''; 
        }

        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);

        if (groupAdmins.length === 0) {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Grup ini belum memiliki admin. Sepi sekali~ Yuuki sedih~'
            });
            return;
        }

        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');

        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        const text = `Tuan~ Berikut admin grup ${groupMetadata.subject} yang Yuuki kenal:\n\n${listAdmin}\n\nJika butuh bantuan, mereka adalah orang yang tepat~`;

        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner]
        });

    } catch (error) {
        console.error('Error di staff command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal mengambil daftar admin. Mungkin lain kali~'
        });
    }
}

module.exports = staffCommand;
