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
            text: `*Pengaturan Sambutan — Yuuki Sorimachi*\n\n*.welcome on* — Nyalakan sambutan\n*.welcome set [pesan]* — Atur sambutan khusus\n*.welcome reset* — Kembalikan ke bawaan Yuuki\n*.welcome off* — Matikan sambutan\n\n*Variabel:*\n• {user} — Mention member baru\n• {group} — Nama grup\n• {description} — Deskripsi grup\n\nAda yang bisa Yuuki bantu, ${title}?`,
            quoted: message
        });
    }

    const [command, ...args] = match.split(' ');
    const lowerCommand = command.toLowerCase();
    const customMessage = args.join(' ');

    if (lowerCommand === 'on') {
        if (await isWelcomeOn(chatId)) {
            return sock.sendMessage(chatId, { text: `${title} yang mulia~ Sambutan sudah menyala dari tadi. Yuuki tidak pernah lupa, Yuuki hanya... menunggu diperhatikan.`, quoted: message });
        }
        await addWelcome(chatId, true, 'Selamat Datang Tuan {user}, Pelayanmu yang setia dan rendah hati,Yuuki siap melayani mu');
        return sock.sendMessage(chatId, { text: `Atas perintah ${title}, sambutan telah Yuuki nyalakan~ Sekarang anggota baru akan disambut dengan hangat... atau mengerikan, tergantung pesan yang ${title} berikan~`, quoted: message });
    }

    if (lowerCommand === 'off') {
        if (!(await isWelcomeOn(chatId))) {
            return sock.sendMessage(chatId, { text: `${title} yang terhormat, sambutan memang sudah mati. Yuuki tidak lupa, Yuuki hanya... setia pada kenyataan.`, quoted: message });
        }
        await delWelcome(chatId);
        return sock.sendMessage(chatId, { text: `Baik, ${title}. Sambutan Yuuki matikan. Anggota baru akan datang dalam sunyi... tanpa sambutan. *Mengerikan, bukan?*`, quoted: message });
    }

    if (lowerCommand === 'set') {
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: `${title}, pesannya mana? Yuuki menunggu dengan sabar... *meski kesabaran Yuuki tidak ada habisnya.* Contoh: *.welcome set Selamat datang, ${title}*`, quoted: message });
        }
        await addWelcome(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: `Pesan sambutan khusus telah Yuuki catat, ${title}~ Anggota baru akan membaca pesan itu... *dan mereka tidak akan bisa melupakannya.*`, quoted: message });
    }

    if (lowerCommand === 'reset') {
        await addWelcome(chatId, true, null);
        return sock.sendMessage(chatId, { text: `Pesan sambutan telah Yuuki kembalikan ke bawaan, ${title}~ Kembali ke awal... *seperti siklus hidup yang kejam, bukan?*`, quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `*Pengaturan Sambutan — Yuuki Sorimachi*\n\n*.welcome on* — Nyalakan sambutan\n*.welcome set [pesan]* — Atur sambutan khusus\n*.welcome reset* — Kembalikan ke bawaan Yuuki\n*.welcome off* — Matikan sambutan\n\n*Variabel:*\n• {user} — Mention member baru\n• {group} — Nama grup\n• {description} — Deskripsi grup\n\nAda yang bisa Yuuki bantu, ${title}?`,
        quoted: message
    });
}

async function handleGoodbye(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const title = await getUserTitle(sock, chatId, senderId);
    const lower = match?.toLowerCase();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*Pengaturan Perpisahan — Yuuki Sorimachi*\n\n*.goodbye on* — Nyalakan perpisahan\n*.goodbye set [pesan]* — Atur pesan perpisahan\n*.goodbye reset* — Kembalikan ke bawaan Yuuki\n*.goodbye off* — Matikan perpisahan\n\n*Variabel:*\n• {user} — Mention yang pergi\n• {group} — Nama grup\n\n*Kepergian selalu meninggalkan luka... tapi Yuuki di sini untuk mengucapkannya dengan indah.* Ada yang bisa Yuuki bantu, ${title}?`,
            quoted: message
        });
    }

    if (lower === 'on') {
        if (await isGoodByeOn(chatId)) {
            return sock.sendMessage(chatId, { text: `${title}, perpisahan sudah menyala. Atau... ${title} yang ingin diingatkan bahwa Yuuki selalu memperhatikan?`, quoted: message });
        }
        await addGoodbye(chatId, true, 'Pelayanmu yang setia dan rendah hati ,Yuuki menantikan kedatanganmu selanjutnya tuan {user}');
        return sock.sendMessage(chatId, { text: `${title} yang mulia, perpisahan telah Yuuki nyalakan~ Kini setiap kepergian akan diiringi kata-kata Yuuki... *semoga mereka tidak terlalu tersentuh.*`, quoted: message });
    }

    if (lower === 'off') {
        if (!(await isGoodByeOn(chatId))) {
            return sock.sendMessage(chatId, { text: `${title} yang terhormat, perpisahan memang sudah mati. Yuuki hanya mengingat apa yang sudah Yuuki ketahui.`, quoted: message });
        }
        await delGoodBye(chatId);
        return sock.sendMessage(chatId, { text: `Perpisahan telah Yuuki padamkan, ${title}. Kini mereka akan pergi dalam diam... *tanpa sepatah kata pun.* Indah, bukan?`, quoted: message });
    }

    if (lower.startsWith('set ')) {
        const customMessage = match.substring(4);
        if (!customMessage) {
            return sock.sendMessage(chatId, { text: `${title}, pesannya? Yuuki menanti... *kesabaran Yuuki abadi.* Contoh: *.goodbye set Sampai jumpa, ${title}*`, quoted: message });
        }
        await addGoodbye(chatId, true, customMessage);
        return sock.sendMessage(chatId, { text: `Pesan perpisahan telah Yuuki simpan, ${title}~ Mereka akan pergi dengan pesan itu terpatri di hati... *atau mungkin di kepala. Sama saja.*`, quoted: message });
    }

    if (lower === 'reset') {
        await addGoodbye(chatId, true, null);
        return sock.sendMessage(chatId, { text: `Pesan perpisahan kembali ke asal, ${title}~ Seperti takdir yang kembali berulang... *Yuuki suka filosofi, Tuan.*`, quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `*Pengaturan Perpisahan — Yuuki Sorimachi*\n\n*.goodbye on* — Nyalakan perpisahan\n*.goodbye set [pesan]* — Atur pesan perpisahan\n*.goodbye reset* — Kembalikan ke bawaan Yuuki\n*.goodbye off* — Matikan perpisahan\n\n*Variabel:*\n• {user} — Mention yang pergi\n• {group} — Nama grup\n\n*Kepergian selalu meninggalkan luka... tapi Yuuki di sini untuk mengucapkannya dengan indah.* Ada yang bisa Yuuki bantu, ${title}?`,
        quoted: message
    });
}

module.exports = { handleWelcome, handleGoodbye };
