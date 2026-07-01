/**
 * Resolve a JID to its canonical @s.whatsapp.net form.
 * - @lid → resolves to phone JID via Signal repository
 * - xxx:device@s.whatsapp.net → strips device suffix
 * Returns the original JID if resolution fails.
 */
async function resolveJid(sock, jid) {
    if (!jid) return jid;

    // Strip device suffix first (e.g. "628xxx:0@s.whatsapp.net" → "628xxx@s.whatsapp.net")
    if (jid.endsWith('@s.whatsapp.net') && jid.includes(':')) {
        jid = jid.split(':')[0] + '@s.whatsapp.net';
    }

    // Resolve LID → phone JID
    if (jid.endsWith('@lid')) {
        try {
            const pn = await sock.signalRepository.lidMapping.getPNForLID(jid);
            if (pn) {
                const phoneNum = pn.split('@')[0].split(':')[0];
                const phoneJid = phoneNum + '@s.whatsapp.net';
                return phoneJid;
            }
        } catch (e) {
            // Resolution failed, return original
        }
    }

    return jid;
}

module.exports = { resolveJid };
