const settings = require('../../settings');
const registry = require('../../data/commands.json');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const chalk = require('chalk');
const moment = require('moment-timezone');

const helpNotes = {
    'chatbot': `┃                      Yuuki akan menjawab... dengan satu syarat~`,
    'ai-chat': `┃                      Ketik .groq reset untuk reset riwayat`,
    'downloader': `┃                      Support: YouTube, Instagram, TikTok,\n┃                      Facebook, Spotify, Pinterest, dll.`
};

function buildHelp() {
    const parts = ['Akhirnya Tuan melihat Yuuki~ Yuuki dengan segala hormat dan kerendahan hati siap melayani. Tapi sebelumnya... Yuuki boleh bertanya satu hal? *Apa warna favorit Tuan?* Ah, tidak tidak, lupakan~ Yuuki malah kepo sendiri.\n'];
    for (const cat of registry.categories) {
        const lines = [`┏━━「 ${cat.name} 」`];
        for (const cmd of cat.commands) {
            const displayName = cmd.usage || cmd.name;
            const arrowGap = ' '.repeat(Math.max(1, 17 - displayName.length));
            lines.push(`┃ > ${displayName}${arrowGap}→ ${cmd.desc}`);
            if (cmd.alias) {
                lines.push(`┃   alias: ${cmd.alias}`);
            }
            if (cmd.example) {
                lines.push(`┃                      Contoh: ${cmd.example}`);
            }
        }
        const note = helpNotes[cat.id];
        if (note) lines.push(note);
        lines.push('┗━━━━━━━━━━━━━━━━━━━━');
        parts.push(lines.join('\n'));
    }
    parts.push('╭───「 TIPS 」───\n│ • Untuk sticker/reply, kirim gambar dulu lalu reply dengan command\n│ • .dl / .download otomatis deteksi platform dari link\n╰───────────────────────────\n> *Pelayanmu yang setia dan selalu kepo — Yuuki Sorimachi*');
    return parts.join('\n\n');
}

async function helpCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];
    const helpText = buildHelp();

    try {
        const helpDir = path.join(__dirname, '../../assets/help');
        const helpImagePath = path.join(helpDir, 'helpyuuki.png');
        let thumbBuffer = null;

        if (fs.existsSync(helpImagePath)) {
            const rawBuffer = fs.readFileSync(helpImagePath);
            thumbBuffer = await sharp(rawBuffer)
                .resize(1140)
                .jpeg({ quality: 80 })
                .toBuffer();
        } else {
            console.warn(`Help thumbnail file 'helpyuuki.png' not found in ${helpDir}`);
        }

        if (thumbBuffer) {
            await sock.sendMessage(chatId, {
                image: thumbBuffer,
                caption: helpText
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
        }
    } catch (e) {
        console.error('Help command failure:', e);
        await sock.sendMessage(chatId, { text: helpText }, { quoted: message });
    }
}

module.exports = helpCommand;
