async function isAdmin(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);

        const participant = groupMetadata.participants.find(p =>
            p.id === senderId ||
            p.id === senderId.replace('@s.whatsapp.net', '@lid') ||
            p.id === senderId.replace('@lid', '@s.whatsapp.net')
        );

        const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

        const botId = sock.user.id.split(':')[0];
        const botIdVariants = [
            botId + '@s.whatsapp.net',
            botId + '@lid'
        ];

        let isBotAdmin = false;

        for (const p of groupMetadata.participants) {
            if (botIdVariants.includes(p.id) || p.id === sock.user.id) {
                if (p.admin === 'admin' || p.admin === 'superadmin') {
                    isBotAdmin = true;
                }
                break;
            }
        }

        if (!isBotAdmin) {
            const ownerLid = process.env.OWNER_LID;
            if (ownerLid) {
                const ownerVariants = [
                    ownerLid + '@lid',
                    ownerLid + '@s.whatsapp.net'
                ];
                const ownerParticipant = groupMetadata.participants.find(p =>
                    ownerVariants.includes(p.id)
                );
                if (ownerParticipant && (ownerParticipant.admin === 'admin' || ownerParticipant.admin === 'superadmin')) {
                    isBotAdmin = true;
                }
            }
        }

        return { isSenderAdmin, isBotAdmin };
    } catch (error) {
        console.error('Error in isAdmin:', error);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
