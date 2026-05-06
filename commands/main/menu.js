const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');

async function menuCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const menuText = `List Menu Yuuki

┌──「 MAIN 」
│ .menu     .ping      .alive    .owner
│ .help     .del       .clear
│ .tag      .mylevel
└───────────────────────────

┌──「 GROUP 」
│ .antilink .antitag   .antibadword .welcome
│ .goodbye  .mute      .unmute   .kick
│ .ban      .warn      .warnings .tagall
│ .hidetag  .resetlink .groupinfo .groupset
│ .ceksewa  .staff    .absen
└───────────────────────────

┌──「 CHATBOT 」
│ .chatbot
└───────────────────────────

┌──「 AI CHAT 」
│ .groq     .deepseek  .gpt
└───────────────────────────

┌──「 CONVERTER 」
│ .sticker/.s .toimage/.toimg .tovideo/.tovid .togif/.tgif
│ .tomp3/.toaud .stickercrop/.scrop
└───────────────────────────

┌──「 DOWNLOADER 」
│ .song     .play      .lyrics   .dl / .download
│ .btch
└───────────────────────────

┌──「 INFORMATION 」
│ .joke     .meme      .quote    .fact
│ .news     .weather   .groupinfo
└───────────────────────────

┌──「 SEARCH 」
│ .pinterest / .pin
└───────────────────────────

┌──「 TOOL 」
│ .translate/.trt .ss/.screenshot .setwm
└───────────────────────────

> Ketik *.help* untuk detail penggunaan command
> *Powered by SantStyle*`;

    try {
        const profilesDir = path.join(__dirname, '../../assets/profiles');
        let thumbBuffer = null;

        if (fs.existsSync(profilesDir)) {
            const files = fs.readdirSync(profilesDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
            if (files.length > 0) {
                const randomFile = files[Math.floor(Math.random() * files.length)];
                console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgMagenta(' ASSET ')} Picking random thumbnail: ${chalk.yellow(randomFile)}`);
                let buffer = fs.readFileSync(path.join(profilesDir, randomFile));
                buffer = Buffer.concat([buffer, Buffer.from(`\n#yuuki_${Date.now()}_${Math.floor(Math.random() * 999999)}`)]);

                if (buffer.length < 400000) {
                    thumbBuffer = buffer;
                } else {
                    console.warn(`Menu thumbnail '${randomFile}' is too large. Skipping.`);
                }
            }
        }

        const messageOptions = { text: menuText };

        if (thumbBuffer) {
            const invisibleSuffix = '\u200B'.repeat(Math.floor(Math.random() * 100) + 1);

            messageOptions.contextInfo = {
                externalAdReply: {
                    title: "Yuuki Sorimachi | WhatsApp Bot" + invisibleSuffix,
                    body: `Hai ${pushName}, Senang bertemu denganmu`,
                    mediaType: 1,
                    thumbnail: thumbBuffer,
                    renderLargerThumbnail: true,
                    showAdAttribution: true,
                    sourceUrl: `https://wa.me/${botNumber}?v=${Date.now()}_${Math.floor(Math.random() * 1000)}`
                }
            };
        }

        await sock.sendMessage(chatId, messageOptions, { quoted: message });

    } catch (e) {
        console.error('Menu command failure:', e);
        await sock.sendMessage(chatId, { text: menuText }, { quoted: message });
    }
}

module.exports = menuCommand;
