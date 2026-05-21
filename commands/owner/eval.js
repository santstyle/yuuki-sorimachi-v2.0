const settings = require('../../settings');

async function evalCommand(sock, chatId, message, rawText, senderId) {
    try {
        const code = rawText.replace(/^\.(eval|js)\s*/i, '').trim();
        if (!code) {
            await sock.sendMessage(chatId, { text: `Tuan~ Masukkan kode JavaScript yang ingin dieksekusi.\nContoh: .eval console.log('Halo')` });
            return;
        }

        let result;
        try {
            result = await eval(`(async () => { ${code} })()`);
        } catch (e) {
            result = e.toString();
        }

        const output = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        const truncated = output.length > 4000 ? output.substring(0, 4000) + '\n\n...truncated' : output;

        await sock.sendMessage(chatId, {
            text: `━━━「 *EVAL* 」━━━\n\n*Input:*\n\`\`\`${code}\`\`\`\n\n*Output:*\n\`\`\`${truncated}\`\`\`\n━━━━━━━━━━━━━━━━`
        });
    } catch (error) {
        console.error('Error in eval command:', error);
        await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Ada error saat mengeksekusi kode. Yuuki tidak kuat~' });
    }
}

module.exports = { evalCommand };
