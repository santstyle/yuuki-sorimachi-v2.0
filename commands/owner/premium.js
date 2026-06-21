const fs = require('fs');
const path = require('path');

const PREMIUM_PATH = path.join(__dirname, '../../data/premium.json');

function loadPremium() {
    try {
        if (fs.existsSync(PREMIUM_PATH)) {
            return JSON.parse(fs.readFileSync(PREMIUM_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading premium data:', e);
    }
    return { premiumUsers: {} };
}

function savePremium(data) {
    fs.writeFileSync(PREMIUM_PATH, JSON.stringify(data, null, 2));
}

function isPremium(userJid) {
    const data = loadPremium();
    const prem = data.premiumUsers[userJid];
    if (!prem) return false;
    if (prem.expiresAt && new Date(prem.expiresAt) < new Date()) {
        delete data.premiumUsers[userJid];
        savePremium(data);
        return false;
    }
    return true;
}

async function addPremCommand(sock, chatId, message, args) {
    try {
        const mentionedJidList = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

        let targetJid = null;
        if (mentionedJidList.length > 0) {
            targetJid = mentionedJidList[0];
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
        }

        if (!targetJid) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Sebutkan user yang ingin dibuat premium. Contoh: .addprem @user 30' }, { quoted: message });
            return;
        }

        const days = parseInt(args.find(a => !a.startsWith('@') && !isNaN(parseInt(a)))) || 30;
        const data = loadPremium();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        data.premiumUsers[targetJid] = {
            addedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        savePremium(data);

        await sock.sendMessage(chatId, {
            text: `Tuan~ @${targetJid.split('@')[0]} telah menjadi *user premium* selama ${days} hari! Selamat menikmati fitur eksklusif~`,
            mentions: [targetJid]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in addprem command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal menambahkan user premium~' }, { quoted: message });
    }
}

async function listPremCommand(sock, chatId, message) {
    try {
        const data = loadPremium();
        const users = Object.entries(data.premiumUsers);
        const now = new Date();

        const activePrem = users.filter(([_, v]) => !v.expiresAt || new Date(v.expiresAt) > now);
        const expiredPrem = users.filter(([_, v]) => v.expiresAt && new Date(v.expiresAt) <= now);

        if (activePrem.length === 0) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Saat ini tidak ada user premium yang aktif. Yuuki merasa kesepian~' }, { quoted: message });
            return;
        }

        let text = '━━━「 *PREMIUM USERS* 」━━━\n\n';
        for (const [jid, info] of activePrem) {
            const name = jid.split('@')[0];
            const expires = info.expiresAt
                ? new Date(info.expiresAt).toLocaleDateString('id-ID')
                : 'Permanent';
            text += `▸ @${name} — ${expires}\n`;
        }

        if (expiredPrem.length > 0) {
            text += `\n*Expired:* ${expiredPrem.length} user\n`;
        }

        await sock.sendMessage(chatId, {
            text,
            mentions: activePrem.map(([jid]) => jid)
        }, { quoted: message });
    } catch (error) {
        console.error('Error in listprem command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal menampilkan daftar premium~' }, { quoted: message });
    }
}

module.exports = { addPremCommand, listPremCommand, isPremium };
