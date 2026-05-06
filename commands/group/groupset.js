const { getGroupSettings, updateGroupSetting, toggleGroupSetting } = require('../../lib/groupSettings');

async function groupsetCommand(sock, chatId, senderId, message, args) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: 'Command ini hanya bisa digunakan di grup.' });
            return;
        }

        if (!message.key.fromMe && !senderId.includes(process.env.OWNER_NUMBER || '')) {
            const isAdminCheck = require('../../lib/isAdmin');
            const { isSenderAdmin } = await isAdminCheck(sock, chatId, senderId);
            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { text: 'Hanya admin yang bisa mengubah pengaturan grup.' });
                return;
            }
        }

        const setting = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();

        if (!setting || !action) {
            const helpText = `Pengaturan Grup\n\n` +
                `.groupset antilink on/off\n` +
                `.groupset antitoxic on/off\n` +
                `.groupset antibadword on/off\n` +
                `.groupset welcomemsg [teks]\n` +
                `.groupset goodbyemsg [teks]\n` +
                `.groupset mute [menit]\n` +
                `.groupset unmute\n` +
                `.groupset maxwarn [angka]\n` +
                `.groupset status\n\n` +
                `Gunakan .groupset status untuk melihat pengaturan saat ini.`;

            await sock.sendMessage(chatId, { text: helpText });
            return;
        }

        if (setting === 'status') {
            const settings = await getGroupSettings(chatId);
            const statusText = `Status Pengaturan Grup:\n\n` +
                `Antilink: ${settings.antilink ? 'ON' : 'OFF'}\n` +
                `Antitoxic: ${settings.antitoxic ? 'ON' : 'OFF'}\n` +
                `Antibadword: ${settings.antibadword ? 'ON' : 'OFF'}\n` +
                `Max Warning: ${settings.maxWarnLevel}\n` +
                `Mute Sampai: ${settings.muteUntil ? settings.muteUntil.toLocaleString() : 'Tidak ada'}\n` +
                `Pesan Welcome: ${settings.welcomeMsg || 'Default'}\n` +
                `Pesan Goodbye: ${settings.goodbyeMsg || 'Default'}`;

            await sock.sendMessage(chatId, { text: statusText });
            return;
        }

        if (setting === 'welcomemsg' || setting === 'goodbyemsg') {
            const text = args.slice(1).join(' ');
            if (!text) {
                await sock.sendMessage(chatId, { text: `Masukkan teks untuk ${setting}. Gunakan {user} sebagai placeholder nama.` });
                return;
            }
            await updateGroupSetting(chatId, setting === 'welcomemsg' ? 'welcomeMsg' : 'goodbyeMsg', text);
            await sock.sendMessage(chatId, { text: `${setting === 'welcomemsg' ? 'Pesan Welcome' : 'Pesan Goodbye'} berhasil diubah.` });
            return;
        }

        if (setting === 'mute') {
            const minutes = parseInt(args[1]);
            if (isNaN(minutes)) {
                await sock.sendMessage(chatId, { text: 'Masukkan durasi mute dalam menit.' });
                return;
            }
            const muteUntil = new Date(Date.now() + minutes * 60 * 1000);
            await updateGroupSetting(chatId, 'muteUntil', muteUntil);
            await sock.sendMessage(chatId, { text: `Grup di-mute selama ${minutes} menit.` });
            return;
        }

        if (setting === 'unmute') {
            await updateGroupSetting(chatId, 'muteUntil', null);
            await sock.sendMessage(chatId, { text: 'Grup berhasil di-unmute.' });
            return;
        }

        if (setting === 'maxwarn') {
            const max = parseInt(args[1]);
            if (isNaN(max) || max < 1) {
                await sock.sendMessage(chatId, { text: 'Masukkan angka maksimal warning (minimal 1).' });
                return;
            }
            await updateGroupSetting(chatId, 'maxWarnLevel', max);
            await sock.sendMessage(chatId, { text: `Maksimal warning diubah menjadi ${max}.` });
            return;
        }

        if (['antilink', 'antitoxic', 'antibadword'].includes(setting)) {
            if (action !== 'on' && action !== 'off') {
                await sock.sendMessage(chatId, { text: 'Gunakan on atau off.' });
                return;
            }
            const value = action === 'on';
            await updateGroupSetting(chatId, setting, value);
            await sock.sendMessage(chatId, { text: `${setting} berhasil di-${action}.` });
            return;
        }

        await sock.sendMessage(chatId, { text: 'Pengaturan tidak dikenal. Ketik .groupset untuk melihat daftar pengaturan.' });
    } catch (error) {
        console.error('Error in groupset command:', error);
        await sock.sendMessage(chatId, { text: 'Gagal mengubah pengaturan grup.' });
    }
}

module.exports = { groupsetCommand };
