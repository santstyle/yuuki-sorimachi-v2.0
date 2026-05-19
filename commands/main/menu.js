const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');
const sharp = require('sharp');

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
┃ .song      .lyrics
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

                const rawBuffer = fs.readFileSync(path.join(profilesDir, randomFile));
                thumbBuffer = await sharp(rawBuffer)
                    .resize(1140, 641, { fit: 'cover', position: 'centre' })
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
