const { addXP, getProgress, getXPForNextLevel } = require('../../lib/xpManager');
const path = require('path');
const fs = require('fs');

async function debugLevelUp(sock, message, chatId, senderId, pushName) {
    try {
        const currentProgress = await getProgress(senderId);
        let xpToAdd = 1000;
        
        if (currentProgress) {
            const reqXP = getXPForNextLevel(currentProgress.level);
            xpToAdd = (reqXP - currentProgress.xp) + 1;
        }
        
        const result = await addXP(senderId, xpToAdd, pushName);
        
        if (result && result.leveledUp) {
            const levelUpImagePath = path.join(__dirname, '../../assets', 'levelup', 'yuuki-uplevel.png');
            let thumbBuffer = null;

            if (fs.existsSync(levelUpImagePath)) {
                try {
                    let buffer = fs.readFileSync(levelUpImagePath);
                    // Trik Anti-Cache: Tambah data random di belakang file biar WA anggap gambar baru
                    buffer = Buffer.concat([buffer, Buffer.from(`\n#yuuki_lvl_${Date.now()}_${Math.floor(Math.random() * 999999)}`)]); 
                    thumbBuffer = buffer;
                } catch (e) {
                    console.error('Gagal baca thumbnail level up:', e.message);
                }
            }

            const levelUpMsg = {
                text: `LEVEL UP!\n\nSelamat @${pushName}!\nKamu naik ke Level ${result.level}\nTerus aktif untuk naik level lagi!`,
                mentions: [senderId]
            };

            if (thumbBuffer) {
                // Tambah invisible character di title biar pesan unik
                const invisibleSuffix = '\u200B'.repeat(10);
                levelUpMsg.contextInfo = {
                    externalAdReply: {
                        title: "Yuuki Sorimachi | Level Up!" + invisibleSuffix,
                        body: `Level ${result.level} reached!`,
                        mediaType: 1,
                        thumbnail: thumbBuffer,
                        renderLargerThumbnail: true,
                        showAdAttribution: true,
                        sourceUrl: `https://wa.me/${sock.user.id.split(':')[0]}`
                    }
                };
            }
            
            await sock.sendMessage(chatId, levelUpMsg, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: '[DEBUG] Gagal memicu level up.' }, { quoted: message });
        }
    } catch (error) {
        console.error('[DEBUG LEVELUP] Error:', error);
        await sock.sendMessage(chatId, { text: '[DEBUG] Terjadi error saat testing level up.' }, { quoted: message });
    }
}

module.exports = { debugLevelUp };
