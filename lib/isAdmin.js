async function isAdmin(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);

        const participant = groupMetadata.participants.find(p =>
            p.id === senderId ||
            p.id === senderId.replace('@s.whatsapp.net', '@lid') ||
            p.id === senderId.replace('@lid', '@s.whatsapp.net')
        );

        const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

        let isBotAdmin = false;

        const botFullId = sock.user.id;
        const botNumber = botFullId.split(':')[0].split('.')[0];

        for (const p of groupMetadata.participants) {
            const pNumber = p.id.split(':')[0].split('@')[0];
            if (pNumber === botNumber) {
                if (p.admin === 'admin' || p.admin === 'superadmin') {
                    isBotAdmin = true;
                }
                break;
            }
        }

        return { isSenderAdmin, isBotAdmin };
    } catch (error) {
        console.error('Error in isAdmin:', error);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
