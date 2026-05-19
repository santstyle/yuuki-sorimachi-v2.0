const { addXP, getProgress, getXPForNextLevel } = require('../../lib/xpManager');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
                    buffer = await sharp(buffer)
                        .resize(1140)
                        .jpeg({ quality: 80 })
                        .toBuffer();
                    thumbBuffer = buffer;
                } catch (e) {
                    console.error('Gagal baca thumbnail level up:', e.message);
                }
            }

            const mentionNumber = senderId.split('@')[0];
            const levelUpText = `✨ Bintang-bintang berbisik... @${mentionNumber} naik ke Level *${result.level}*. Takdir masih menyimpan banyak misteri untuk Tuan~`;

            const levelUpMessage = {
                text: levelUpText,
                mentions: [senderId]
            };

            if (thumbBuffer) {
                levelUpMessage.image = thumbBuffer;
                levelUpMessage.caption = levelUpText;
                delete levelUpMessage.text;
            }

            await sock.sendMessage(chatId, levelUpMessage, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki gagal memicu level up~' });
        }
    } catch (error) {
        console.error('[DEBUG LEVELUP] Error:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki mengalami error saat testing level up~' });
    }
}

module.exports = { debugLevelUp };
