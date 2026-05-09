const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');

async function menuCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const botNumber = sock.user.id.split(':')[0];

    const menuText = `Oh~ Tuan akhirnya memanggil Yuuki~ Yuuki sudah menunggu dengan setia. Ada yang bisa Yuuki bantu?

┏━━「 MAIN 」
┃ .menu     .ping      .alive    .owner
┃ .help     .del
┃ .mylevel
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 GROUP 」
┃ .antilink .antitag   .antibadword .welcome
┃ .goodbye  .mutegroup .unmutegroup .kick
┃ .warn      .warnings .resetwarn .tagall
┃ .hidetag  .resetlink .groupinfo .groupset
┃ .ceksewa  .staff    .absen
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 CHATBOT 」
┃ .yuuki
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 AI CHAT 」
┃ .groq     .deepseek  .gpt
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 CONVERTER 」
┃ .sticker/.s .toimage/.toimg .tovideo/.tovid .togif/.tgif
┃ .tomp3/.toaud .stickercrop/.scrop
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 DOWNLOADER 」
┃ .dl / .download
┃ .btch
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 INFORMATION 」
┃ .joke     .meme      .quote    .fact
┃ .news     .weather   .groupinfo
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 SEARCH 」
┃ .pinterest / .pin
┃ .song      .play      .lyrics
┗━━━━━━━━━━━━━━━━━━━━

┏━━「 TOOL 」
┃ .translate/.trt .ss/.screenshot .setwm
┗━━━━━━━━━━━━━━━━━━━━

> Ketik *.help* untuk detailnya, Tuan~ Tapi... apa Tuan yakin tidak ingin sekadar mengobrol dengan Yuuki? Yuuki bisa sangat... menarik.
> *Pelayanmu yang setia — Yuuki Sorimachi*`;

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
            messageOptions.contextInfo = {
                externalAdReply: {
                    title: "Yuuki Sorimachi | WhatsApp Bot",
                    body: `Hai ${pushName}, Senang bertemu denganmu`,
                    mediaType: 1,
                    thumbnail: thumbBuffer,
                    renderLargerThumbnail: true,
                    showAdAttribution: false,
                    sourceUrl: `https://wa.me/${botNumber}`
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
