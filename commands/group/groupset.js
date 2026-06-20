const { getGroupSettings, updateGroupSetting, toggleGroupSetting } = require('../../lib/groupSettings');

async function groupsetCommand(sock, chatId, senderId, message, args) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Command ini hanya bisa digunakan di grup. Yuuki tidak bisa melayaninya di sini~' }, { quoted: message });
            return;
        }

        if (!message.key.fromMe && !senderId.includes(process.env.OWNER_NUMBER || '')) {
            const isAdminCheck = require('../../lib/isAdmin');
            const { isSenderAdmin } = await isAdminCheck(sock, chatId, senderId);
            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya admin yang bisa mengubah pengaturan grup. Yuuki mohon maaf~' }, { quoted: message });
                return;
            }
        }

        const setting = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();

        if (!setting) {
            const helpText = `Tuan~ Berikut pengaturan grup yang tersedia:\n\n` +
                `.groupset antilink on/off\n` +
                `.groupset antitoxic on/off\n` +
                `.groupset antibadword on/off\n` +
                `.groupset welcomemsg [teks]\n` +
                `.groupset goodbyemsg [teks]\n` +
                `.groupset mute [menit]\n` +
                `.groupset unmute\n` +
                `.groupset maxwarn [angka]\n` +
                `.groupset status\n\n` +
                `Gunakan .groupset status untuk melihat pengaturan saat ini. Yuuki siap membantu~`;

            await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
            return;
        }

        if (setting === 'status') {
            const settings = await getGroupSettings(chatId);
            const statusText = `Tuan~ Berikut status pengaturan grup:\n\n` +
                `Antilink: ${settings.antilink ? 'ON' : 'OFF'}\n` +
                `Antitoxic: ${settings.antitoxic ? 'ON' : 'OFF'}\n` +
                `Antibadword: ${settings.antibadword ? 'ON' : 'OFF'}\n` +
                `Max Warning: ${settings.maxWarnLevel}\n` +
                `Mute Sampai: ${settings.muteUntil ? settings.muteUntil.toLocaleString() : 'Tidak ada'}\n` +
                `Pesan Welcome: ${settings.welcomeMsg || 'Default'}\n` +
                `Pesan Goodbye: ${settings.goodbyeMsg || 'Default'}\n\n` +
                `Yuuki harap informasi ini membantu Tuan~`;

            await sock.sendMessage(chatId, { text: statusText }, { quoted: message });
            return;
        }

        if (setting === 'welcomemsg' || setting === 'goodbyemsg') {
            const text = args.slice(1).join(' ');
            if (!text) {
                await sock.sendMessage(chatId, { text: `Tuan~ Masukkan teks untuk ${setting}. Gunakan {user} sebagai placeholder nama. Yuuki menunggu~` }, { quoted: message });
                return;
            }
            await updateGroupSetting(chatId, setting === 'welcomemsg' ? 'welcomeMsg' : 'goodbyeMsg', text);
            await sock.sendMessage(chatId, { text: `Tuan~ ${setting === 'welcomemsg' ? 'Pesan Welcome' : 'Pesan Goodbye'} telah Yuuki ubah. Sesuai perintah Tuan~` }, { quoted: message });
            return;
        }

        if (setting === 'mute') {
            const minutes = parseInt(args[1]);
            if (isNaN(minutes)) {
                await sock.sendMessage(chatId, { text: 'Tuan~ Masukkan durasi mute dalam menit. Yuuki butuh angka yang jelas~' }, { quoted: message });
                return;
            }
            const muteUntil = new Date(Date.now() + minutes * 60 * 1000);
            await updateGroupSetting(chatId, 'muteUntil', muteUntil);
            await sock.sendMessage(chatId, { text: `Tuan~ Grup akan Yuuki mute selama ${minutes} menit. Tenang saja~` }, { quoted: message });
            return;
        }

        if (setting === 'unmute') {
            await updateGroupSetting(chatId, 'muteUntil', null);
            await sock.sendMessage(chatId, { text: 'Tuan~ Grup telah Yuuki unmute. Silakan berbicara kembali~' }, { quoted: message });
            return;
        }

        if (setting === 'maxwarn') {
            const max = parseInt(args[1]);
            if (isNaN(max) || max < 1) {
                await sock.sendMessage(chatId, { text: 'Tuan~ Masukkan angka maksimal warning (minimal 1). Yuuki harap Tuan lebih teliti~' }, { quoted: message });
                return;
            }
            await updateGroupSetting(chatId, 'maxWarnLevel', max);
            await sock.sendMessage(chatId, { text: `Tuan~ Maksimal warning telah Yuuki ubah menjadi ${max}. Waspadalah~` }, { quoted: message });
            return;
        }

        if (['antilink', 'antitoxic', 'antibadword'].includes(setting)) {
            if (action !== 'on' && action !== 'off') {
                await sock.sendMessage(chatId, { text: 'Tuan~ Gunakan on atau off. Yuuki tidak mengerti perintah lain~' }, { quoted: message });
                return;
            }
            const value = action === 'on';
            await updateGroupSetting(chatId, setting, value);
            await sock.sendMessage(chatId, { text: `Tuan~ ${setting} telah Yuuki set ke ${action}. Sesuai keinginan Tuan~` }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Tuan~ Pengaturan tidak dikenal. Ketik .groupset untuk melihat daftar pengaturan. Yuuki bingung~' }, { quoted: message });
    } catch (error) {
        console.error('Error in groupset command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengubah pengaturan grup. Mungkin ada gangguan~' }, { quoted: message });
    }
}

module.exports = { groupsetCommand };
