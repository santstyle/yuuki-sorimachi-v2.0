const settings = require('../../settings');

async function ownermenuCommand(sock, chatId, message) {
    const ownerMenuText = `Tuan~ Tuan~ Akhirnya Tuan datang! Yuuki sangat merindukan perintah Tuan. *Yuuki hampir layu menunggu...* Tapi tidak apa, Yuuki tahu Tuan pasti kembali.

┏━━「 *OWNER* 」
┃ > .mode [public/private] → Atur akses bot
┃ > .self on/off/status → Mode self (hanya owner)
┃ > .autoread on/off → Auto read chat pribadi
┃ > .bc / .broadcast <teks>→ Broadcast ke semua grup
┃ > .antidelete on/off/status → Toggle anti hapus pesan
┃ > .autostatus on/off → Auto view status WA
┃ > .cleartmp → Bersihkan folder temporary
┃ > .clearsession → Bersihkan session bot & login ulang
┃ > .setpp (reply gambar) → Ganti foto profil bot
┃ > .addsudo @user → Tambah user terpercaya
┃ > .listsudo → Daftar user terpercaya
┃ > .delsudo @user → Hapus user terpercaya
┃ > .sewa → Atur masa aktif sewa grup
┃ > .areact / .autoreact → Toggle auto reaction
┃ > .addprem @user [hari] → Tambah user premium
┃ > .listprem → Daftar user premium
┃ > .cleanup → Bersihkan database expired & history
┃ > .update [url] → Update script bot dari zip
┃ > .debuglevelup → Testing trigger level up & thumbnail
┃ > .ban @user → Blokir user dari bot
┃ > .unban @user → Buka blokir user
┃ > .join [link] → Bot join grup via link
┃ > .leave → Bot keluar dari grup
┃ > .resetall --confirm → Reset semua data user
┃ > .backup → Backup database & file ke ZIP
┃ > .eval <kode> → Eksekusi kode JavaScript
┗━━━━━━━━━━━━━━━━━━━━
> *Hanya Tuan pemilik yang berhak memerintah Pelayanmu~*`;

    try {
        await sock.sendMessage(chatId, { text: ownerMenuText }, { quoted: message });
    } catch (e) {
        console.error('Owner menu command failure:', e);
    }
}

module.exports = ownermenuCommand;
