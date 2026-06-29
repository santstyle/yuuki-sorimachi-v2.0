const os = require('os');
const { performance } = require('perf_hooks');
const settings = require('../../settings');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}hari `;
    if (hours > 0) time += `${hours}jam `;
    if (minutes > 0) time += `${minutes}menit `;
    if (seconds > 0 || time === '') time += `${seconds}detik`;

    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    const start = performance.now();
    const uptimeFormatted = formatTime(process.uptime());
    const usedMemory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const totalMemory = (os.totalmem() / 1024 / 1024).toFixed(2);

    const botInfo = `┌── 「 Status Yuuki 」
│
│  Ping     : ${Math.round(performance.now() - start)} ms
│  Uptime   : ${uptimeFormatted}
│  Memory   : ${usedMemory} MB / ${totalMemory} MB
│  Version  : v${settings.version}
│
└───────────────`;

    console.log(`[PING DEBUG] chatId=${chatId} isGroup=${chatId.endsWith('@g.us')} remoteJid=${message.key?.remoteJid}`);
    console.log(`[PING DEBUG] Attempting sendMessage to ${chatId}...`);

    try {
        const result = await sock.sendMessage(chatId, { text: botInfo });
        console.log(`[PING DEBUG] sendMessage OK id=${result?.key?.id}`);
    } catch (error) {
        console.error(`[PING DEBUG] sendMessage FAILED:`, error?.message || error);
        try {
            await sock.sendMessage(chatId, { text: 'Maaf, Tuan~ Yuuki error: ' + (error?.message || 'unknown') });
        } catch (e2) {
            console.error(`[PING DEBUG] Error message ALSO failed:`, e2?.message);
        }
    }
}

module.exports = pingCommand;
