const settings = require('../../settings');
const registry = require('../../data/commands.json');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');
const sharp = require('sharp');

function getMenuName(cmd) {
    if (!cmd.alias) return cmd.name;
    const aliases = cmd.alias.split(', ').filter(Boolean);
    if (aliases.length === 1 && aliases[0].startsWith('.')) {
        return `${cmd.name}/${aliases[0]}`;
    }
    return cmd.name;
}

function buildMenu() {
    const parts = ['Oh~ Tuan akhirnya memanggil Yuuki~ Yuuki sudah menunggu dengan setia. Ada yang bisa Yuuki bantu?\n'];
    for (const cat of registry.categories) {
        const names = cat.commands.map(getMenuName);
        const lines = [`┏━━「 ${cat.name} 」`];
        for (let i = 0; i < names.length; i += 4) {
            lines.push(`┃ ${names.slice(i, i + 4).join('   ')}`);
        }
        lines.push('┗━━━━━━━━━━━━━━━━━━━━');
        parts.push(lines.join('\n'));
    }
    parts.push('> Ketik *.help* untuk detailnya, Tuan~ Tapi... apa Tuan yakin tidak ingin sekadar mengobrol dengan Yuuki? Yuuki bisa sangat... menarik.\n> *Pelayanmu yang setia — Yuuki Sorimachi*');
    return parts.join('\n\n');
}

async function menuCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];
    const menuText = buildMenu();

    try {
        const menuDir = path.join(__dirname, '../../assets/menu');
        let thumbBuffer = null;

        if (fs.existsSync(menuDir)) {
            const files = fs.readdirSync(menuDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgMagenta(' ASSET ')} Picking thumbnail: ${chalk.yellow(randomFile)}`);

                const rawBuffer = fs.readFileSync(path.join(menuDir, randomFile));
                thumbBuffer = await sharp(rawBuffer)
                    .resize(1140)
                    .jpeg({ quality: 80 })
                    .toBuffer();
            }
        }

        if (thumbBuffer) {
            await sock.sendMessage(chatId, {
                image: thumbBuffer,
                caption: menuText
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
        }
    } catch (e) {
        console.error('Menu command failure:', e);
        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }
}

module.exports = menuCommand;
