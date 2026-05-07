const settings = require('../../settings');

async function ownerCommand(sock, chatId) {
    await sock.sendMessage(chatId, {
        text: `Tuan~ Inilah Tuan yang memiliki Yuuki. SantStyle adalah tuannya Yuuki, dan Yuuki adalah pelayan setia yang siap melakukan apa pun demi Tuan~ Instagram Tuan: https://www.instagram.com/santstyle.mv\n\nYuuki penasaran... apa Tuan juga ingin memiliki Yuuki sepenuhnya?`
    });
}

module.exports = ownerCommand;
