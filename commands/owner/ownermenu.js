const settings = require('../../settings');
const fs = require('fs');
const path = require('path');

async function ownermenuCommand(sock, chatId, message) {
    let joinMode = 'private';
    try {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/joinConfig.json'), 'utf8'));
        joinMode = config.isPublic ? 'public' : 'private';
    } catch (e) {}

    const ownerMenuText = `Tuan~ Tuan~ Akhirnya Tuan datang! Yuuki sangat merindukan perintah Tuan. *Yuuki hampir layu menunggu...* Tapi tidak apa, Yuuki tahu Tuan pasti kembali.

┏━━「 *OWNER* 」
┃ > .mode [public/private] → Atur akses bot
┃ > .self on/off/status → Mode self (hanya owner)
┃ > .autoread on/off → Auto read chat pribadi
┃ > .bc / .broadcast <teks>→ Broadcast ke semua grup
┃ > .autostatus on/off → Auto view status WA
┃ > .areact / .autoreact → Toggle auto reaction
┃
┃ > .cleartmp → Bersihkan folder temporary
┃ > .clearsession → Bersihkan session & restart bot
┃ > .cleanup [history/users/warns] → Bersihkan database
┃ > .setpp (reply gambar) → Ganti foto profil bot
┃ > .debuglevelup → Testing trigger level up & thumbnail
┃
┃ > .addsudo @user → Tambah user terpercaya
┃ > .listsudo → Daftar user terpercaya
┃ > .delsudo @user → Hapus user terpercaya
┃ > .addprem @user [hari] → Tambah user premium
┃ > .listprem → Daftar user premium
┃ > .ban @user → Blokir user dari bot
┃ > .unban @user → Buka blokir user
┃
┃ > .sewa → Atur masa aktif sewa grup
┃ > .joinmode [public/private] → Atur mode join grup (${joinMode})
┃ > .join [link] → Bot join grup via link
┃ > .leave → Bot keluar dari grup
┗━━━━━━━━━━━━━━━━━━━━
> *Hanya Tuan pemilik yang berhak memerintah Pelayanmu~*`;

    try {
        await sock.sendMessage(chatId, { text: ownerMenuText }, { quoted: message });
    } catch (e) {
        console.error('Owner menu command failure:', e);
    }
}

module.exports = ownermenuCommand;
