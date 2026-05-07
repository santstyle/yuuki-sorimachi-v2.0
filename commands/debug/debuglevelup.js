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
                    buffer = Buffer.concat([buffer, Buffer.from(`\n#yuuki_lvl_${Date.now()}_${Math.floor(Math.random() * 999999)}`)]);
                    thumbBuffer = buffer;
                } catch (e) {
                    console.error('Gagal baca thumbnail level up:', e.message);
                }
            }

            const levelUpMsg = {
                text: `LEVEL UP, Tuan!\n\n✨ *Sorak sorai bergema di seluruh penjuru ruangan~* ✨\n@${pushName} baru saja naik ke *Level ${result.level}*\nYuuki sangat bangga! Teruslah bercakap-cakap agar Tuan semakin perkasa!`,
                mentions: [senderId]
            };

            if (thumbBuffer) {
                levelUpMsg.contextInfo = {
                    externalAdReply: {
                        title: "Yuuki Sorimachi | Level Up!",
                        body: `Level ${result.level} reached!`,
                        mediaType: 1,
                        thumbnail: thumbBuffer,
                        renderLargerThumbnail: true,
                        showAdAttribution: false,
                        sourceUrl: `https://wa.me/${sock.user.id.split(':')[0]}`
                    }
                };
            }
            
            await sock.sendMessage(chatId, levelUpMsg);
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal memicu level up~' });
        }
    } catch (error) {
        console.error('[DEBUG LEVELUP] Error:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki mengalami error saat testing level up~' });
    }
}

module.exports = { debugLevelUp };
