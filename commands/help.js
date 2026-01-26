const settings = require('../settings');

async function menuCommand(sock, chatId, message) {
    const menuMessage = `
*${settings.botName || 'Yuuki Sorimachi | Bot'}*
Version: ${settings.version || '1.8'}  

*DESCRIPTION*
Yuuki Bot is a multifunctional WhatsApp bot designed to assist with group and personal activities.
The name "Yuuki" is inspired by the character Yuuki Sorimachi from Shibou Yuugi de Meshi wo Kuu anime.

To contact the owner, you can use the command .owner
or simply chat with SantStyle if they are in the same group.

Here are the available command menus in Yuuki Bot:

*ADMIN*
• .antitag <on/off>
• .welcome <on/off>
• .goodbye <on/off>
• .ban @user
• .mute <minutes>
• .kick @user
• .warnings @user
• .warn @user
• .tag <message>
• .unmute
• .delete
• .antilink
• .antibadword
• .clear
• .tagall
• .hidetag
• .resetlink
• .chatbot

*GENERAL*
• .help
• .menu
• .ping
• .alive
• .owner
• .groupinfo
• .staff
• .startabsen
• .joke
• .meme
• .quote
• .fact
• .news
• .weather <city>

*GAMES*
• .tebakkata

*IMAGE/STICKER*
• .sticker <image>
• .crop <image>
• .toimage <sticker>
• .tovideo <sticker>
• .tgsticker <link>
• .take <setwm>


*DOWNLOADER*
• .lyrics <judul lagu>
• .song <song name>
• .play <link>
• .pin <kata kunci gambar>
• .twitter <link>
• .instagram <link>
• .youtube <link>
• .facebook <link>
• .tiktok <link>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered & Modified By SantStyle
`;

    try {
        await sock.sendMessage(chatId, { text: menuMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in menu command:', error);
        await sock.sendMessage(chatId, { text: menuMessage });
    }
}

module.exports = menuCommand;