const { getBotmode, setBotmode } = require('../../lib/index');
const isAdmin = require('../../lib/isAdmin');

async function botmodeCommand(sock, chatId, senderId, message, args) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya bisa digunakan di grup. Yuuki tidak bisa melayaninya di sini~' }, { quoted: message });
            return;
        }

        if (!message.key.fromMe && !senderId.includes(process.env.OWNER_NUMBER || '')) {
            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin yang bisa mengatur mode bot. Yuuki mohon maaf~' }, { quoted: message });
                return;
            }
        }

        const action = args[0]?.toLowerCase();
        const currentMode = await getBotmode(chatId);

        if (!action) {
            const statusText = `Tuan~ Mode bot saat ini di grup ini: *${currentMode === 'admin' ? 'Admin' : 'Public'}*\n\n` +
                `*Admin* — Hanya admin, owner, dan sudo yang bisa memakai bot\n` +
                `*Public* — Semua anggota grup bisa memakai bot\n\n` +
                `Gunakan:\n` +
                `.botmode admin — Batasi hanya admin\n` +
                `.botmode public — Semua bisa pakai\n\n` +
                `Yuuki menunggu perintah Tuan~`;
            await sock.sendMessage(chatId, { text: statusText }, { quoted: message });
            return;
        }

        if (action !== 'admin' && action !== 'public') {
            await sock.sendMessage(chatId, { text: 'Tuan~ Gunakan `admin` atau `public`. Yuuki tidak mengerti perintah lain~' }, { quoted: message });
            return;
        }

        if (action === currentMode) {
            await sock.sendMessage(chatId, { text: `Tuan~ Mode bot sudah *${action === 'admin' ? 'Admin' : 'Public'}* dari awal. Yuuki tidak perlu mengubahnya~` }, { quoted: message });
            return;
        }

        await setBotmode(chatId, action);
        await sock.sendMessage(chatId, {
            text: `Tuan~ Mode bot di grup ini telah diubah menjadi *${action === 'admin' ? 'Admin' : 'Public'}*\n\n` +
                (action === 'admin'
                    ? `Sekarang hanya admin, owner, dan sudo yang bisa memakai Yuuki~`
                    : `Sekarang semua anggota grup bisa memakai Yuuki~`)
        }, { quoted: message });
    } catch (error) {
        console.error('Error in botmode command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengatur mode bot. Mungkin ada gangguan~' }, { quoted: message });
    }
}

module.exports = { botmodeCommand };
