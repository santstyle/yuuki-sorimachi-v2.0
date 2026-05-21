const fs = require('fs');
const path = require('path');

const commandEmojis = ['⏳'];

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

function loadAutoReactionState() {
    try {
        if (fs.existsSync(USER_GROUP_DATA)) {
            const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
            return data.autoReaction || false;
        }
    } catch (error) {
        console.error('Wah, error waktu loading auto-reaction state nih:', error);
    }
    return false;
}

function saveAutoReactionState(state) {
    try {
        const data = fs.existsSync(USER_GROUP_DATA)
            ? JSON.parse(fs.readFileSync(USER_GROUP_DATA))
            : { groups: [], chatbot: {} };

        data.autoReaction = state;
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Aduh, error waktu nyimpen auto-reaction state:', error);
    }
}

let isAutoReactionEnabled = loadAutoReactionState();

function getRandomEmoji() {
    return commandEmojis[0];
}

async function addCommandReaction(sock, message) {
    try {
        if (!isAutoReactionEnabled || !message?.key?.id) return;

        const emoji = getRandomEmoji();
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });
    } catch (error) {
        console.error('Hmm, ada error waktu nambahin reaksi:', error);
    }
}

async function handleAreactCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Command ini hanya untuk owner~ Hanya Yuuki yang berhak~',
                quoted: message
            });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.split(' ');
        const action = args[1]?.toLowerCase();

        if (action === 'on') {
            isAutoReactionEnabled = true;
            saveAutoReactionState(true);
            await sock.sendMessage(chatId, {
                text: 'Tuan~ Auto-reaction sudah Yuuki nyalakan di semua tempat~ Yuuki akan memberi reaksi otomatis~',
                quoted: message
            });
        } else if (action === 'off') {
            isAutoReactionEnabled = false;
            saveAutoReactionState(false);
            await sock.sendMessage(chatId, {
                text: 'Baik, Tuan~ Auto-reaction sudah Yuuki matikan. Yuuki tidak akan memberi reaksi otomatis lagi~',
                quoted: message
            });
        } else {
            const currentState = isAutoReactionEnabled ? 'nyala' : 'mati';
            await sock.sendMessage(chatId, {
                text: `Tuan~ Auto-reaction sedang ${currentState} di semua grup.\n\nGunakan:\n.areact on - Nyalakan auto-reaction\n.areact off - Matikan auto-reaction`,
                quoted: message
            });
        }
    } catch (error) {
        console.error('Ada error nih waktu handle command areact:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki mengalami error saat mengatur auto-reaction. Coba lagi~',
            quoted: message
        });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
};