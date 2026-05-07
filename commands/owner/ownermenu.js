const settings = require('../../settings');

async function ownermenuCommand(sock, chatId, message) {
    const ownerMenuText = `Tuan~ Tuan~ Akhirnya Tuan datang! Yuuki sangat merindukan perintah Tuan. *Yuuki hampir layu menunggu...* Tapi tidak apa, Yuuki tahu Tuan pasti kembali.

┏━━「 OWNER 」
┃ > .mode [public/private] → Atur akses bot
┃ > .bc / .broadcast <teks>→ Broadcast pesan ke semua grup
┃ > .antidelete on/off/status → Toggle anti hapus pesan
┃ > .autostatus on/off → Auto view status WA
┃ > .cleartmp → Bersihkan folder temporary
┃ > .clearsession → Bersihkan session bot & login ulang
┃ > .setpp (reply gambar) → Ganti foto profil bot
┃ > .sudo @user → Tambah sudo/user terpercaya
┃ > .sewa → Atur masa aktif sewa grup
┃ > .areact / .autoreact → Toggle auto reaction
┃ > .cleanup → Bersihkan database expired & history
┃ > .update [url] → Update script bot dari zip
┃ > .debuglevelup → Testing trigger level up & thumbnail
┃ > .ban @user → Blokir user dari bot
┃ > .unban @user → Buka blokir user
┗━━━━━━━━━━━━━━━━━━━━
> *Hanya Tuan pemilik yang berhak memerintah Pelayanmu~*`;

    try {
        await sock.sendMessage(chatId, { text: ownerMenuText }, { quoted: message });
    } catch (e) {
        console.error('Owner menu command failure:', e);
    }
}

module.exports = ownermenuCommand;
