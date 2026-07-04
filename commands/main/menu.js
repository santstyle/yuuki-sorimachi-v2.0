const registry = require('../../data/commands.json');
const moment = require('moment-timezone');

function getGreeting() {
    const hour = moment().tz('Asia/Jakarta').hour();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
}

function getMenuName(cmd) {
    if (!cmd.alias) return cmd.name;
    const aliases = cmd.alias.split(', ').filter(Boolean);
    if (aliases.length === 1 && aliases[0].startsWith('.')) {
        return `${cmd.name}/${aliases[0]}`;
    }
    return cmd.name;
}

function buildMenu() {
    const parts = [];
    for (const cat of registry.categories) {
        const names = cat.commands.map(getMenuName);
        parts.push(`${cat.name}\n${names.join('\n')}`);
    }
    return parts.join('\n\n');
}

async function menuCommand(sock, chatId, message) {
    const greeting = getGreeting();
    const menuList = buildMenu();
    const text = `${greeting}, Tuan!\nPelayanmu yang setia dan rendah hati,\nYuuki Sorimachi, siap melayanimu~\n\n${menuList}\n\n> Ketik *.help* untuk detailnya, Tuan~`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = menuCommand;
