async function joinCommand(sock, chatId, message, args) {
    try {
        const link = args.join(' ');
        if (!link) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Berikan tautan grup untuk Yuuki bergabung.\nContoh: .join https://chat.whatsapp.com/Abc123Def' }, { quoted: message });
            return;
        }

        const inviteMatch = link.match(/chat\.whatsapp\.com\/([a-zA-Z0-9_-]+)/);
        if (!inviteMatch) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Tautan yang Tuan berikan tidak valid. Yuuki tidak bisa bergabung~' }, { quoted: message });
            return;
        }

        const code = inviteMatch[1];
        const groupId = await sock.groupAcceptInvite(code);

        await sock.sendMessage(chatId, {
            text: `Berhasil, Tuan~ Yuuki sudah bergabung ke grup. Kirim .menu untuk melihat fitur Yuuki~`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in join command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal bergabung ke grup. Mungkin tautannya sudah expired atau Yuuki tidak diizinkan~' }, { quoted: message });
    }
}

module.exports = { joinCommand };
