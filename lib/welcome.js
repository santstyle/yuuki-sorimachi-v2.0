const { addWelcome, delWelcome, isWelcomeOn, addGoodbye, delGoodBye, isGoodByeOn } = require('../lib/index');
const { delay } = require('@whiskeysockets/baileys');

async function getUserTitle(sock, chatId, senderId) {
    try {
        if (chatId.endsWith('@g.us')) {
            const metadata = await sock.groupMetadata(chatId);
            const participant = metadata.participants.find(p => p.id === senderId);
            if (participant?.admin === 'admin' || participant?.admin === 'superadmin') {
                return 'Tuan Besar';
            }
        }
    } catch (error) {
        console.log('Tidak bisa cek admin status di welcome/goodbye');
    }
    return 'Tuan';
}

async function handleWelcome(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const title = await getUserTitle(sock, chatId, senderId);

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*Settingan Pesan Welcome — Yuuki Sorimachi*\n\n*.welcome on* — Nyalain pesan sambutan\n*.welcome set [pesan]* — Atur pesan sambutan khusus\n*.welcome reset* — Reset ke pesan default Yuuki\n*.welcome off* — Matiin pesan sambutan\n\n*Variabel yang bisa dipakai:*\n• {user} — Mention member baru\n• {group} — Nama grup\n• {description} — Deskripsi grup\n\nDengan hormat, Yuuki siap membantu ${title}~`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: `${title}, pesan sambutan sudah aktif dari tadi~ Yuuki tidak akan lupa, kok. Atau ${title} yang lupa? ~`, quoted: message });
        }
        await addWelcome(chatId, true, 'Welcome {user} to {group}! 🎉');
        return sock.sendMessage(chatId, { text: `Dengan segala hormat, ${title}, pesan sambutan sudah Yuuki nyalakan~ Mau yang lebih spesial? Ketik *.welcome set [pesan kamu]*.`, quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: `${title} yang terhormat, pesan sambutan memang sudah dimatikan. Yuuki tidak pernah lupa, kok~`, quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: `Baiklah ${title}, pesan sambutan sudah Yuuki matikan. Yuuki akan tetap setia menunggu~`, quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: `${title}, pesannya mana nih? Yuuki tunggu dengan sabar~ Contoh: *.welcome set Selamat datang, ${title} yang terhormat!*`, quoted: message });
        }
        await addWelcome(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: `Yeayy! Pesan sambutan kustom sudah Yuuki atur~ Nanti member baru bakal baca pesan itu. Yuuki harap mereka bahagia... atau setidaknya nyaman~`, quoted: message });
    }

    if (lowerCommand === 'reset') {
        await addWelcome(chatId, true, null);
        return sock.sendMessage(chatId, { text: `Pesan sambutan sudah Yuuki reset ke default~ Sekarang member baru akan baca pesan default dari Yuuki. Yuuki harap mereka tetap merasa disambut dengan hangat~`, quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `*Settingan Pesan Welcome — Yuuki Sorimachi*\n\n*.welcome on* — Nyalain pesan sambutan\n*.welcome set [pesan]* — Atur pesan sambutan khusus\n*.welcome reset* — Reset ke pesan default Yuuki\n*.welcome off* — Matiin pesan sambutan\n\n*Variabel yang bisa dipakai:*\n• {user} — Mention member baru\n• {group} — Nama grup\n• {description} — Deskripsi grup\n\nDengan hormat, Yuuki siap membantu ${title}~`,
        quoted: message
    });
}

async function handleGoodbye(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const title = await getUserTitle(sock, chatId, senderId);
    const lower = match?.toLowerCase();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*Settingan Pesan Goodbye — Yuuki Sorimachi*\n\n✅ *.goodbye on* — Nyalain pesan perpisahan\n*.goodbye set [pesan]* — Atur pesan perpisahan khusus\n*.goodbye reset* — Reset ke pesan default Yuuki\n*.goodbye off* — Matiin pesan perpisahan\n\n*Variabel yang bisa dipakai:*\n• {user} — Mention member yang keluar\n• {group} — Nama grup\n\nYuuki harap mereka baik-baik saja... meski Yuuki selalu bisa merasakan kepergian seseorang~`,
            quoted: message
        });
    }

    if (lower === 'on') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: `${title}, pesan perpisahan sudah nyala dari tadi. Yuuki tidak pernah lupa, kok~ Atau ${title} yang sedang tidak memperhatikan?`, quoted: message });
        }
        await addGoodbye(chatId, true, 'Goodbye {user} 👋');
        return sock.sendMessage(chatId, { text: `Dengan hormat, ${title}, pesan perpisahan sudah Yuuki nyalakan~ Mau yang lebih spesial? Ketik *.goodbye set [pesan kamu]*.`, quoted: message });
    }

    if (lower === 'off') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: `${title} yang terhormat, pesan perpisahan memang sudah dimatikan. Yuuki selalu ingat semua hal~`, quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: `Baiklah ${title}, pesan perpisahan sudah Yuuki matikan. Tidak ada lagi yang mengucapkan selamat tinggal... kecuali Yuuki, tentu saja~`, quoted: message });
    }

    if (lower.startsWith('set ')) {
        const customMessage = match.substring(4);
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: `${title}, pesannya mana nih? Yuuki menunggu dengan sabar~ Contoh: *.goodbye set Sampai jumpa, ${title}!*`, quoted: message });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: `Tadaa! Pesan perpisahan kustom sudah Yuuki simpan~ Nanti kalau ada yang pergi, Yuuki akan sampaikan dengan penuh penghormatan.`, quoted: message });
    }

    if (lower === 'reset') {
        await addGoodbye(chatId, true, null);
        return sock.sendMessage(chatId, { text: `Pesan perpisahan sudah Yuuki reset ke default~ Sekarang member yang keluar akan baca pesan default dari Yuuki. Yuuki harap mereka pergi dengan damai~`, quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `*Settingan Pesan Goodbye — Yuuki Sorimachi*\n\n✅ *.goodbye on* — Nyalain pesan perpisahan\n*.goodbye set [pesan]* — Atur pesan perpisahan khusus\n*.goodbye reset* — Reset ke pesan default Yuuki\n*.goodbye off* — Matiin pesan perpisahan\n\n*Variabel yang bisa dipakai:*\n• {user} — Mention member yang keluar\n• {group} — Nama grup\n\nYuuki harap mereka baik-baik saja... meski Yuuki selalu bisa merasakan kepergian seseorang~`,
        quoted: message
    });
}

module.exports = { handleWelcome, handleGoodbye };
