const fs = require('fs');
const path = require('path');
const connectionMonitor = require('../../lib/connectionMonitor');

const JOIN_CONFIG_PATH = path.join(__dirname, '../../data/joinConfig.json');

function loadJoinConfig() {
    try {
        if (fs.existsSync(JOIN_CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(JOIN_CONFIG_PATH, 'utf8'));
        }
    } catch (e) { }
    return { isPublic: false };
}

function saveJoinConfig(data) {
    fs.writeFileSync(JOIN_CONFIG_PATH, JSON.stringify(data, null, 2));
}

async function joinCommand(sock, chatId, message, args, senderIsSudo, senderId) {
    try {
        const config = loadJoinConfig();
        const isOwner = message.key.fromMe || senderIsSudo;

        if (!config.isPublic && !isOwner) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Fitur .join sedang dalam mode *private*. Hanya pemilik Yuuki yang bisa menggunakan perintah ini. Yuuki mohon pengertian~' }, { quoted: message });
            return;
        }

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

        let groupName = 'Grup';
        let groupId = null;
        try {
            const inviteInfo = await sock.groupGetInviteInfo(code);
            groupName = inviteInfo.subject || 'Grup';
            groupId = inviteInfo.id;
        } catch (e) { }

        await sock.groupAcceptInvite(code);

        await sock.sendMessage(chatId, {
            text: `Berhasil, Tuan~ Yuuki sudah bergabung ke grup *${groupName}*. Kirim .menu untuk melihat fitur Yuuki~`
        }, { quoted: message });

        async function sendWelcome() {
            if (!groupId) return;
            try {
                await sock.sendMessage(groupId, {
                    text: 'Halo, semuanya~ Ada pelayan baru di sini! Yuuki Sorimachi hadir untuk melayani Tuan-Tuan semua di grup ini.\n\nUntuk melihat semua fitur Yuuki, ketik *.menu* atau *.help* di grup ini. Yuuki siap melayani~'
                });
            } catch {
                const poll = setInterval(async () => {
                    try {
                        await sock.groupMetadata(groupId);
                        await sock.sendMessage(groupId, {
                            text: 'Halo, semuanya~ Ada pelayan baru di sini! Yuuki Sorimachi hadir untuk melayani Tuan-Tuan semua di grup ini.\n\nUntuk melihat semua fitur Yuuki, ketik *.menu* atau *.help* di grup ini. Yuuki siap melayani~'
                        });
                        clearInterval(poll);
                    } catch {}
                }, 5000);
            }
        }
        sendWelcome();

        await sock.sendMessage(chatId, {
            text: `Tuan~ Jika Tuan merasa terbantu dengan kehadiran Yuuki, dukung pengembang Yuuki dengan follow Instagram di:\nhttps://www.instagram.com/santstyle.mv\n\nTerima kasih, Tuan~`
        });
    } catch (error) {
        console.error('Error in join command:', error);
        const errMsg = error?.message || error?.toString() || '';
        const isConnectionIssue = errMsg.includes('ETIMEDOUT') || errMsg.includes('ENOTFOUND') || errMsg.includes('ECONNREFUSED') || errMsg.includes('socket') || errMsg.includes('timeout') || errMsg.includes('fetch failed') || errMsg.includes('EAI_AGAIN') || errMsg.includes('EHOSTUNREACH');

        if (isConnectionIssue) {
            connectionMonitor.reportFailure();
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal bergabung karena koneksi internet sedang tidak stabil. Mohon Tuan bersabar dan coba lagi nanti~' }, { quoted: message });
        } else if (errMsg.includes('not-authorized') || errMsg.includes('not authorized')) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki tidak memiliki izin untuk bergabung ke grup tersebut. Mungkin tautannya sudah expired, Yuuki telah diblokir dari grup, atau ada pengaturan yang membatasi Yuuki. Coba periksa kembali tautannya~' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal bergabung ke grup. Mungkin tautannya sudah expired atau Yuuki tidak diizinkan~' }, { quoted: message });
        }
    }
}

async function joinModeCommand(sock, chatId, message, senderIsSudo) {
    try {
        if (!message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Hanya pemilik Yuuki yang bisa mengatur mode join. Yuuki tidak bisa memberikan wewenang ini kepada orang lain~' }, { quoted: message });
            return;
        }

        const config = loadJoinConfig();
        const userMessage = (message.message?.conversation || message.message?.extendedTextMessage?.text || '').toLowerCase().trim();
        const action = userMessage.split(' ')[1]?.toLowerCase();

        if (!action) {
            const currentMode = config.isPublic ? 'public' : 'private';
            await sock.sendMessage(chatId, {
                text: `Tuan~ Mode .join saat ini: *${currentMode}*\n\nPenggunaan: .joinmode public/private\n.joinmode public — Semua user bisa menggunakan .join\n.joinmode private — Hanya owner yang bisa menggunakan .join`
            }, { quoted: message });
            return;
        }

        if (action !== 'public' && action !== 'private') {
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Gunakan .joinmode public atau .joinmode private. Sederhana, kan?'
            }, { quoted: message });
            return;
        }

        config.isPublic = action === 'public';
        saveJoinConfig(config);
        await sock.sendMessage(chatId, {
            text: `Tuan~ Mode .join telah diubah menjadi *${action}*.\n${action === 'public' ? 'Semua user sekarang bisa menggunakan .join untuk mengundang Yuuki ke grup.' : 'Hanya owner yang bisa menggunakan .join untuk mengundang Yuuki ke grup.'}`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in joinMode:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal mengubah mode join. Coba lagi~' }, { quoted: message });
    }
}

module.exports = { joinCommand, joinModeCommand };
