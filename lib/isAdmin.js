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

        const botVariants = new Set();
        const addVariant = (jid) => {
            if (!jid) return;
            botVariants.add(jid);
            const decoded = sock.decodeJid(jid);
            if (decoded !== jid) botVariants.add(decoded);
            if (jid.endsWith('@s.whatsapp.net')) {
                botVariants.add(jid.replace('@s.whatsapp.net', '@lid'));
                if (decoded !== jid) botVariants.add(decoded.replace('@s.whatsapp.net', '@lid'));
            } else if (jid.endsWith('@lid')) {
                botVariants.add(jid.replace('@lid', '@s.whatsapp.net'));
                if (decoded !== jid) botVariants.add(decoded.replace('@lid', '@s.whatsapp.net'));
            }
        };

        addVariant(sock.user?.id);
        addVariant(sock.user?.lid);

        for (const p of groupMetadata.participants) {
            if (botVariants.has(p.id)) {
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
