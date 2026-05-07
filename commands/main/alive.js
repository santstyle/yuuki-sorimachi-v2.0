const settings = require('../../settings');

async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `Hai, kamu nyariin akuu? pelayanmu yang setia dan rendah hati Yuuki Sorimachi siap melayani mu`;

        await sock.sendMessage(chatId, {
            text: message1
        }, { quoted: message });
    } catch (error) {
        console.error('Error di alive command:', error);
        const errorMessage = 'Aduh, ada yang error nih. Tapi jangan khawatir, aku masih hidup kok';
        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = aliveCommand;