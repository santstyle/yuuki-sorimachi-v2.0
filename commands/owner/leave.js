async function leaveCommand(sock, chatId, message, args) {
    try {
        let targetGroup = chatId;

        if (args.length > 0) {
            const input = args[0];
            if (input.endsWith('@g.us')) {
                targetGroup = input;
            } else if (input.includes('chat.whatsapp.com')) {
                await sock.sendMessage(chatId, { text: 'Tuan~ Untuk keluar dari grup, gunakan .leave di dalam grup yang ingin ditinggalkan, atau gunakan ID grup (bukan link)~' });
                return;
            } else {
                targetGroup = input.replace(/[^0-9]/g, '') + '@g.us';
            }
        }

        if (!targetGroup.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'Tuan~ Command .leave hanya bisa digunakan di dalam grup atau dengan menyertakan ID grup~' });
            return;
        }

        await sock.sendMessage(targetGroup, { text: 'Selamat tinggal, Tuan~ Yuuki pamit pergi. Terima kasih atas semua kenangan indah~ 🫶' });
        await sock.groupLeave(targetGroup);

        if (targetGroup !== chatId) {
            await sock.sendMessage(chatId, { text: `Tuan~ Yuuki sudah keluar dari grup ${targetGroup}~` });
        }
    } catch (error) {
        console.error('Error in leave command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal keluar dari grup. Mungkin Yuuki masih dibutuhkan di sana~ Atau Yuuki bukan admin~' });
    }
}

module.exports = { leaveCommand };
