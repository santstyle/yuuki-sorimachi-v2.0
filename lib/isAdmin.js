async function isAdmin(sock, chatId, senderId) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);

        const sid = senderId.split(':')[0].split('@')[0];
        const knownLid = process.env.OWNER_LID;

        let participant = groupMetadata.participants.find(p => {
            const pid = p.id.split(':')[0].split('@')[0];
            return pid === sid || (knownLid && pid === knownLid);
        });

        // Fallback: resolve participant LID → phone untuk match sender phone
        if (!participant && senderId.endsWith('@s.whatsapp.net')) {
            for (const p of groupMetadata.participants) {
                if (p.id.endsWith('@lid')) {
                    try {
                        const pn = await sock.signalRepository.lidMapping.getPNForLID(p.id);
                        if (pn) {
                            const participantPhone = pn.split(':')[0].split('@')[0];
                            if (participantPhone === sid) {
                                participant = p;
                                break;
                            }
                        }
                    } catch (e) {}
                }
            }
        }

        // Fallback: resolve sender LID → phone untuk match participant phone
        if (!participant && senderId.endsWith('@lid')) {
            try {
                const pn = await sock.signalRepository.lidMapping.getPNForLID(senderId);
                if (pn) {
                    const senderPhone = pn.split(':')[0].split('@')[0];
                    participant = groupMetadata.participants.find(p => {
                        const pid = p.id.split(':')[0].split('@')[0];
                        return pid === senderPhone || (knownLid && pid === knownLid);
                    });
                }
            } catch (e) {}
        }

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
