const settings = require('../../settings');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const chalk = require('chalk');

const REPORTS_FILE = path.join(__dirname, '../../data/reports.json');

function loadReports() {
    try {
        if (fs.existsSync(REPORTS_FILE)) {
            return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8'));
        }
    } catch { }
    return [];
}

function saveReports(reports) {
    try {
        fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
    } catch (e) {
        console.error('Gagal menyimpan reports:', e.message);
    }
}

function addReport(ownerMessageId, reporterJid, reporterName, sourceChatId, reportMsg, timestamp, reporterMsgId) {
    const reports = loadReports();
    reports.push({ ownerMessageId, reporterJid, reporterName, sourceChatId, reportMsg, timestamp, reporterMsgId });
    if (reports.length > 50) reports.splice(0, reports.length - 50);
    saveReports(reports);
}

async function handleReportReply(sock, chatId, message, rawText, senderId, senderIsSudo) {
    if (!senderIsSudo && !message.key.fromMe) return false;

    const contextInfo = message.message?.extendedTextMessage?.contextInfo;
    if (!contextInfo?.stanzaId) return false;

    const reports = loadReports();
    const report = reports.find(r => r.ownerMessageId === contextInfo.stanzaId);
    if (!report) return false;

    const replyText = `*Balasan dari ${settings.botOwner}*\n\n${rawText}`;

    try {
        const quotedMsg = report.reporterMsgId ? {
            key: {
                id: report.reporterMsgId,
                remoteJid: report.sourceChatId,
                fromMe: false,
                participant: report.sourceChatId.endsWith('@g.us') ? report.reporterJid : undefined
            },
            message: { conversation: report.reportMsg }
        } : undefined;

        if (report.sourceChatId.endsWith('@g.us')) {
            await sock.sendMessage(report.sourceChatId, {
                text: replyText,
                mentions: [report.reporterJid]
            }, quotedMsg ? { quoted: quotedMsg } : undefined);
        } else {
            await sock.sendMessage(report.reporterJid, {
                text: replyText
            }, quotedMsg ? { quoted: quotedMsg } : undefined);
        }

        const idx = reports.indexOf(report);
        if (idx !== -1) {
            reports.splice(idx, 1);
            saveReports(reports);
        }

        await sock.sendMessage(chatId, {
            text: `Baik Tuan~ Balasan sudah diteruskan ke *${report.reporterName}*.`
        }, { quoted: message });

        console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgMagenta(' REPORT ')} Reply forwarded to ${chalk.yellow(report.reporterName)}`);
    } catch (e) {
        console.error('Gagal meneruskan balasan:', e.message);
        await sock.sendMessage(chatId, {
            text: `Maaf Tuan~ Yuuki gagal meneruskan balasan ke *${report.reporterName}*. Mungkin mereka sudah tidak ada di grup atau nomornya berubah.`
        }, { quoted: message });
    }

    return true;
}

async function reportbugCommand(sock, chatId, message, input) {
    const pushName = message.pushName || 'User';
    const senderId = message.key.participant || message.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const reportMsg = input || '';

    if (!reportMsg) {
        await sock.sendMessage(chatId, {
            text: `Tuan~ Yuuki perlu tahu masalah yang ingin Tuan laporkan.\n\n*Cara pakai:*\n.reportbug <pesan laporan>\n\nAtau reply pesan dengan:\n.reportbug <pesan laporan>\n\nYuuki akan teruskan ke pemilik~`
        }, { quoted: message });
        return;
    }

    const ownerNumber = process.env.OWNER_NUMBER;
    if (!ownerNumber) {
        await sock.sendMessage(chatId, {
            text: 'Maaf Tuan~ Nomor pemilik belum dikonfigurasi. Yuuki tidak bisa meneruskan laporan~'
        }, { quoted: message });
        return;
    }

    const ownerJid = ownerNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const timestamp = moment().tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');

    let groupInfo = '';
    if (isGroup) {
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            groupInfo = `  Grup: ${groupMetadata.subject || 'Unknown'}\n  ID Grup: ${chatId}\n`;
        } catch {
            groupInfo = `  Grup: ${chatId}\n`;
        }
    }

    let repliedContent = '';
    try {
        const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (quotedMsg) {
            const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || '(pesan media)';
            repliedContent = `  Reply ke: ${quotedText}\n`;
        }
    } catch { }

    const reportToOwner = `*LAPORAN BUG*
  Dari: ${pushName}
  Id: ${senderId}
${groupInfo}  Waktu: ${timestamp}
  Pesan: ${reportMsg}
${repliedContent}

> Balas pesan ini untuk membalas ${pushName} secara langsung`;

    try {
        const sentMessage = await sock.sendMessage(ownerJid, { text: reportToOwner });
        addReport(sentMessage.key.id, senderId, pushName, chatId, reportMsg, timestamp, message.key.id);

        console.log(`${chalk.cyan('[' + moment().tz('Asia/Jakarta').format('HH:mm:ss') + ']')} ${chalk.bgMagenta(' REPORT ')} Bug report from ${chalk.yellow(pushName)} (${senderId})`);

        await sock.sendMessage(chatId, {
            text: `Baik Tuan~ Laporan Tuan sudah Yuuki teruskan ke pemilik Yuuki~`
        }, { quoted: message });
    } catch (e) {
        console.error('Failed to forward bug report:', e);
        await sock.sendMessage(chatId, {
            text: 'Maaf Tuan~ Yuuki gagal meneruskan laporan. Coba lagi nanti ya~'
        }, { quoted: message });
    }
}

module.exports = { reportbugCommand, handleReportReply };
