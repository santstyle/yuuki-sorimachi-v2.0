const { setAntiBadword, getAntiBadword, removeAntiBadword, addBadword, removeBadword, getBadwords, clearBadwords } = require('../../lib/index');
const config = require('../../config');

function getGreeting() {
    const hour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false });
    const h = parseInt(hour);
    if (h >= 5 && h < 10) return 'Selamat pagi';
    if (h >= 10 && h < 15) return 'Selamat siang';
    if (h >= 15 && h < 18) return 'Selamat sore';
    return 'Selamat malam';
}

function formatPrivateWarning(text) {
    return `${getGreeting()} Tuan,\n\nPelayanmu yang setia dan rendah hati, Yuuki, ingin memberitahumu sesuatu.\n\n${text}`;
}

const defaultBadwords = [
    'goblok', 'bego', 'tolol', 'anjing', 'bangsat', 'kontol', 'memek',
    'jembut', 'ngentot', 'peju', 'pantek', 'bajingan', 'kampret',
    'asu', 'anjir', 'jancuk', 'jancok', 'jablay', 'bitch', 'fuck',
    'shit', 'asshole', 'motherfucker', 'dick', 'pussy', 'bastard',
    'cunt', 'whore', 'slut', 'nigga', 'nigger', 'retard', 'idiot',
    'stupid', 'dumb', 'moron', 'suck', 'sucks', 'sucking',
    'babi', 'celeng', 'kafir', 'murtad', 'setan', 'iblis',
    'gay', 'lesbi', 'homo', 'bencong', 'banci', 'waria',
    'sundal', 'lonte', 'pelacur', 'perek', 'lacur',
    'coli', 'masturbasi', 'senge', 'senggama', 'bokep',
    'porno', 'hentai', 'bugil', 'telanjang'
];

async function handleAntiBadwordCommand(sock, chatId, userMessage, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: 'Maaf, Tuan~ Hanya admin grup yang bisa mengatur antibadword. Yuuki mohon pengertian Tuan~'
            });
            return;
        }

        const args = userMessage.slice(12).toLowerCase().trim().split(' ').filter(Boolean);
        const action = args[0];

        if (!action) {
            const usage = `ANTIBADWORD CONFIGURATION

Usage:
  .antibadword on         - Aktifkan antibadword
  .antibadword off        - Nonaktifkan antibadword
  .antibadword set <mode> - Atur aksi: delete / kick / warn
  .antibadword status     - Cek status antibadword
  .antibadword add <kata> - Tambah kata terlarang
  .antibadword del <kata> - Hapus kata terlarang
  .antibadword reset      - Hapus semua kata terlarang
  .antibadword list       - Lihat daftar kata terlarang

Antibadword akan merespon jika ada yang kirim kata terlarang`;

            await sock.sendMessage(chatId, { text: usage });
            return;
        }

        switch (action) {
            case 'on': {
                const existingConfig = await getAntiBadword(chatId, 'on');
                if (existingConfig?.enabled) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Antibadword sudah aktif di grup ini, lho. Yuuki sudah menjaganya~'
                    });
                    return;
                }
                await setAntiBadword(chatId, 'on', 'delete');
                await sock.sendMessage(chatId, {
                    text: `Tuan~ FITUR ANTIBADWORD telah Yuuki aktifkan!\n\nPerhatian untuk seluruh member:\nDilarang mengirim kata-kata kasar atau terlarang.\nPelanggaran akan dihapus dan mendapat peringatan.\n\nJangan coba-coba ya, Yuuki mengawasi~`
                });
                break;
            }

            case 'off': {
                await removeAntiBadword(chatId, 'on');
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Antibadword telah Yuuki nonaktifkan. Silakan bebas bicara~ Tapi tetap sopan, ya~'
                });
                break;
            }

            case 'set': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Mode belum dipilih. Pilih salah satu: delete / kick / warn. Yuuki menunggu perintah Tuan~'
                    });
                    return;
                }
                const mode = args[1];
                if (!['delete', 'kick', 'warn'].includes(mode)) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Mode tidak valid. Pilih: delete / kick / warn. Yuuki harap Tuan lebih teliti~'
                    });
                    return;
                }
                await setAntiBadword(chatId, 'on', mode);
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Mode antibadword telah Yuuki atur ke: ${mode}. Sesuai perintah Tuan~`
                });
                break;
            }

            case 'status': {
                const configData = await getAntiBadword(chatId, 'on');
                const status = configData?.enabled ? 'AKTIF' : 'NONAKTIF';
                const mode = configData?.action || 'Belum diatur';
                const badwords = await getBadwords(chatId);
                const totalBadwords = badwords.length;
                const statusMsg = `Tuan~ Berikut status antibadword:\n\nStatus     : ${status}\nMode       : ${mode}\nKata terlarang: ${totalBadwords} kata\n\nYuuki siap melayani~`;
                await sock.sendMessage(chatId, { text: statusMsg });
                break;
            }

            case 'add': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Kata belum dimasukkan. Contoh: .antibadword add anjing bangsat. Yuuki tunggu input dari Tuan~'
                    });
                    return;
                }
                const words = args.slice(1);
                let added = 0;
                let alreadyExists = 0;
                for (const word of words) {
                    const result = await addBadword(chatId, word.toLowerCase());
                    if (result) added++;
                    else alreadyExists++;
                }
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Berhasil menambah ${added} kata terlarang${alreadyExists > 0 ? `, ${alreadyExists} kata sudah ada sebelumnya` : ''}. Yuuki catat semuanya~`
                });
                break;
            }

            case 'del': {
                if (args.length < 2) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Kata belum dimasukkan. Contoh: .antibadword del anjing. Yuuki harap Tuan lebih spesifik~'
                    });
                    return;
                }
                const words = args.slice(1);
                let removed = 0;
                for (const word of words) {
                    const result = await removeBadword(chatId, word.toLowerCase());
                    if (result) removed++;
                }
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Berhasil menghapus ${removed} kata terlarang. Kata-kata itu telah Yuuki lupakan~`
                });
                break;
            }

            case 'reset': {
                await clearBadwords(chatId);
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Semua kata terlarang custom telah Yuuki hapus. Sekarang hanya menggunakan kata default. Bersih kembali~'
                });
                break;
            }

            case 'list': {
                const badwords = await getBadwords(chatId);
                if (badwords.length === 0) {
                    await sock.sendMessage(chatId, {
                        text: 'Tuan~ Belum ada kata terlarang custom. Bersih sekali grup ini~'
                    });
                    return;
                }
                await sock.sendMessage(chatId, {
                    text: `Tuan~ Berikut daftar kata terlarang:\n\nTotal: ${badwords.length} kata\n\n${badwords.map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\nYuuki mengawasi semuanya~`
                });
                break;
            }

            default: {
                await sock.sendMessage(chatId, {
                    text: 'Tuan~ Perintah tidak dikenal. Ketik .antibadword untuk melihat daftar perintah. Yuuki bingung~'
                });
                break;
            }
        }
    } catch (error) {
        console.error('Error di antibadword command:', error);
        await sock.sendMessage(chatId, {
            text: 'Maaf, Tuan~ Yuuki gagal memproses perintah antibadword. Mungkin ada yang mengganggu Yuuki~'
        });
    }
}

async function handleBadwordDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const antibadwordSetting = await getAntiBadword(chatId, 'on');
        if (!antibadwordSetting?.enabled) return;

        const cleanMessage = userMessage.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const customBadwords = await getBadwords(chatId);
        const wordsToCheck = customBadwords.length > 0 ? customBadwords : defaultBadwords;

        let foundWord = '';
        for (const badword of wordsToCheck) {
            const regex = new RegExp('\\b' + badword + '\\b', 'i');
            if (regex.test(cleanMessage) || cleanMessage.includes(badword)) {
                foundWord = badword;
                break;
            }
        }
        if (!foundWord) return;

        try {
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: message.key.id,
                    participant: message.key.participant || senderId
                }
            });
        } catch (error) {
            console.error('Gagal hapus pesan badword:', error);
        }

        const senderNum = senderId.split('@')[0];
        const action = antibadwordSetting.action || 'delete';

        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chatId);
        } catch (err) {
            console.error('Gagal ambil group metadata:', err);
        }
        const groupName = groupMetadata?.subject || 'grup ini';

        let warningText;

        if (action === 'warn') {
            const { incrementWarningCount, resetWarningCount } = require('../../lib/index');
            const WARN_COUNT = config.WARN_COUNT || 3;
            const warningCount = await incrementWarningCount(chatId, senderId);

            if (warningCount >= WARN_COUNT) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                    await resetWarningCount(chatId, senderId);
                    warningText = `@${senderNum} telah Yuuki keluarkan karena melanggar aturan kata terlarang (${WARN_COUNT}/${WARN_COUNT} warning). Selamat tinggal~`;

                    await sock.sendMessage(senderId, {
                        text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (mengirim kata terlarang).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                    });
                } catch (kickError) {
                    console.error('Gagal kick user:', kickError);
                    warningText = `@${senderNum} jangan kirim kata terlarang di grup ini (${warningCount}/${WARN_COUNT} warning). Yuuki mengawasi~`;
                }
            } else {
                warningText = `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk mengirim kata terlarang. Berhati-hatilah~`;
            }
        } else if (action === 'kick') {
            try {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                warningText = `@${senderNum} telah Yuuki keluarkan karena mengirim kata terlarang. Semoga hari-harimu menyenangkan~`;

                await sock.sendMessage(senderId, {
                    text: formatPrivateWarning(`Kamu baru saja dikeluarkan dari grup "${groupName}" karena melanggar aturan (mengirim kata terlarang).\n\nLain kali tolong patuhi aturan yang berlaku ya. Kalau merasa ada kesalahan atau ingin bertanya, silakan hubungi admin grup.\n\nSampai jumpa.`)
                });
            } catch (kickError) {
                console.error('Gagal kick user:', kickError);
                warningText = `@${senderNum} jangan kirim kata terlarang di grup ini. Yuuki tidak suka kata-kata kotor~`;
            }
        } else {
            warningText = `@${senderNum} jangan kirim kata terlarang di grup ini. Yuuki mohon jaga kesopanan~`;
        }

        await sock.sendMessage(chatId, {
            text: `${warningText}\n\nPerhatian: Fitur antibadword sedang aktif. Yuuki mengawasi~`,
            mentions: [senderId]
        });
    } catch (error) {
        console.error('Error di badword detection:', error);
    }
}

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    const userMessage = message.message?.conversation ||
        message.message?.extendedTextMessage?.text || '';
    await handleAntiBadwordCommand(sock, chatId, userMessage, senderId, isSenderAdmin);
}

module.exports = antibadwordCommand;
module.exports.handleBadwordDetection = handleBadwordDetection;
