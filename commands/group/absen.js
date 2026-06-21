const absenSessions = {};

async function startAbsen(sock, m, title) {
    const groupId = m.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
        return sock.sendMessage(groupId, { text: "Tuan~ Fitur absen hanya bisa digunakan di dalam grup. Yuuki tidak bisa melayaninya di luar~" }, { quoted: m });
    }

    const finalTitle = title.trim() || "Daftar Absen";
    absenSessions[groupId] = { list: [], active: true, title: finalTitle };

    await sock.sendMessage(groupId, { text: `Tuan~ Absen "${finalTitle}" telah Yuuki mulai! Silakan diisi dengan \`.absen <nama/teks>\` ya, Tuan~` }, { quoted: m });
}

async function addAbsen(sock, m, text) {
    const groupId = m.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
        return sock.sendMessage(groupId, { text: "Tuan~ Fitur ini khusus grup, lho. Yuuki tidak bisa melayani di sini~" }, { quoted: m });
    }

    if (!text) {
        return sock.sendMessage(groupId, {
            text: `Tuan~ Berikut cara menggunakan absen:\n\n` +
                `.startabsen <judul>\n` +
                `  Untuk memulai sesi absen dengan judul.\n` +
                `  Contoh: .startabsen Daftar Hadir Senin\n` +
                `  Jika tanpa judul: .startabsen\n\n` +
                `.absen <nama/teks>\n` +
                `  Untuk mengisi daftar hadir.\n` +
                `  Contoh: .absen Yuuki Sorimachi\n\n` +
                `.finishabsen\n` +
                `  Untuk menutup dan melihat hasil absen.\n\n` +
                `Yuuki menunggu perintah Tuan~`
        }, { quoted: m });
    }

    if (!absenSessions[groupId] || !absenSessions[groupId].active) {
        return sock.sendMessage(groupId, { text: "Tuan~ Absen belum dimulai. Gunakan .startabsen terlebih dahulu, ya~" }, { quoted: m });
    }

    const session = absenSessions[groupId];
    session.list.push(text);

    const listText = session.list.map((item, i) => `${i + 1}. ${item}`).join("\n");

    await sock.sendMessage(groupId, {
        text: `${session.title}\n${listText}`
    }, { quoted: m });
}

async function finishAbsen(sock, m) {
    const groupId = m.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
        return sock.sendMessage(groupId, { text: "Maaf, Tuan~ Fitur ini hanya untuk grup. Yuuki tidak bisa membantu di sini~" }, { quoted: m });
    }

    if (!absenSessions[groupId] || !absenSessions[groupId].active) {
        return sock.sendMessage(groupId, { text: "Tuan~ Tidak ada sesi absen yang sedang berlangsung saat ini. Sepi sekali~" }, { quoted: m });
    }

    const session = absenSessions[groupId];
    session.active = false;

    const listText = session.list.length > 0
        ? session.list.map((item, i) => `${i + 1}. ${item}`).join("\n")
        : "Belum ada yang absen, Tuan~ Sepi sekali...";

    await sock.sendMessage(groupId, {
        text: `${session.title}\n${listText}`
    }, { quoted: m });

    await sock.sendMessage(groupId, {
        text: "Gunakan .startabsen lagi jika Tuan ingin memulai sesi baru. Yuuki akan selalu siap~"
    }, { quoted: m });
}

module.exports = { startAbsen, addAbsen, finishAbsen };