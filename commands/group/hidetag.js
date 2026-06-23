const { downloadContentFromMessage, downloadMediaMessage } = require("@whiskeysockets/baileys");

async function getUserTitle(sock, chatId, senderId) {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participant = metadata.participants.find(p => p.id === senderId);
        if (participant?.admin === 'admin' || participant?.admin === 'superadmin') {
            return 'Tuan Besar';
        }
    } catch (error) {
        console.log('Tidak bisa cek admin status di hidetag');
    }
    return 'Tuan';
}

async function hidetagCommand(sock, m, prefix) {
    try {
        console.log("[HIDETAG]");

        const senderId = m.key.participant || m.key.remoteJid;
        const title = await getUserTitle(sock, m.key.remoteJid, senderId);

        if (!m.key.remoteJid.endsWith("@g.us")) {
            await sock.sendMessage(m.key.remoteJid, { text: `Maaf ${title}, command ini hanya bisa digunakan di grup. Yuuki menunggu dengan sabar~` });
            return;
        }

        const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
        const participants = groupMetadata.participants.map(p => p.id);

        let body = "";
        let textAfterCommand = "";

        if (m.message?.conversation) {
            body = m.message.conversation;
        } else if (m.message?.extendedTextMessage?.text) {
            body = m.message.extendedTextMessage.text;
        } else if (m.message?.imageMessage?.caption) {
            body = m.message.imageMessage.caption;
        } else if (m.message?.videoMessage?.caption) {
            body = m.message.videoMessage.caption;
        }

        if (body.startsWith(prefix + "hidetag")) {
            textAfterCommand = body.replace(prefix + "hidetag", "").trim();
        }

        const contextInfo = m.message?.extendedTextMessage?.contextInfo;
        const quotedMessage = contextInfo?.quotedMessage;
        const isReply = !!(contextInfo && quotedMessage);

        if (isReply) {
            await handleQuotedMessage(sock, m.key.remoteJid, quotedMessage, textAfterCommand, participants, title);
        } else if (m.message?.imageMessage) {
            try {
                const imageStream = await downloadContentFromMessage(m.message.imageMessage, "image");
                let imageBuffer = Buffer.from([]);
                for await (const chunk of imageStream) {
                    imageBuffer = Buffer.concat([imageBuffer, chunk]);
                }
                const imgData = { image: imageBuffer, mentions: participants };
                if (textAfterCommand) imgData.caption = textAfterCommand;
                await sock.sendMessage(m.key.remoteJid, imgData);
    } catch (error) {
        console.error("[HIDETAG] Image download failed:", error.message);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg);
        if (isNetworkIssue) {
            await sock.sendMessage(m.key.remoteJid, {
                text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                mentions: participants
            });
        } else {
            await sock.sendMessage(m.key.remoteJid, {
                text: textAfterCommand || `Dengan hormat, Yuuki memanggil semua anggota di sini`,
                mentions: participants
            });
        }
    }
        } else if (m.message?.videoMessage) {
            try {
                const videoStream = await downloadContentFromMessage(m.message.videoMessage, "video");
                let videoBuffer = Buffer.from([]);
                for await (const chunk of videoStream) {
                    videoBuffer = Buffer.concat([videoBuffer, chunk]);
                }
                const vidData = { video: videoBuffer, mentions: participants };
                if (textAfterCommand) vidData.caption = textAfterCommand;
                await sock.sendMessage(m.key.remoteJid, vidData);
            } catch (error) {
                console.error("[HIDETAG] Video download failed:", error.message);
                const errMsg2 = error?.message || error?.toString() || '';
                const isNetworkIssue2 = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg2);
                if (isNetworkIssue2) {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                        mentions: participants
                    });
                } else {
                    await sock.sendMessage(m.key.remoteJid, {
                        text: textAfterCommand || `Dengan hormat, Yuuki memanggil semua anggota di sini`,
                        mentions: participants
                    });
                }
            }
        } else if (m.message?.documentMessage || m.message?.documentWithCaptionMessage) {
            const doc = m.message?.documentMessage || m.message?.documentWithCaptionMessage?.message?.documentMessage;
            if (doc) {
                try {
                    const docStream = await downloadContentFromMessage(doc, "document");
                    let docBuffer = Buffer.from([]);
                    for await (const chunk of docStream) {
                        docBuffer = Buffer.concat([docBuffer, chunk]);
                    }
                    await sock.sendMessage(m.key.remoteJid, {
                        document: docBuffer,
                        fileName: doc.fileName || "document",
                        mimetype: doc.mimetype,
                        caption: textAfterCommand || doc.caption || "",
                        mentions: participants
                    });
                } catch (error) {
                    console.error("[HIDETAG] Document download failed:", error.message);
                    const errMsg3 = error?.message || error?.toString() || '';
                    const isNetworkIssue3 = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg3);
                    if (isNetworkIssue3) {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                            mentions: participants
                        });
                    } else {
                        await sock.sendMessage(m.key.remoteJid, {
                            text: textAfterCommand || `Dengan hormat, Yuuki memanggil semua anggota di sini`,
                            mentions: participants
                        });
                    }
                }
            }
        } else {
            const finalText = textAfterCommand || `Dengan hormat, Yuuki meminta izin untuk memanggil semua anggota di sini`;

            await sock.sendMessage(m.key.remoteJid, {
                text: finalText,
                mentions: participants
            });
        }

    } catch (error) {
        console.error("Error di hidetag:", error);
        try {
            const errMsg = error?.message || error?.toString() || '';
            const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg);
            await sock.sendMessage(m.key.remoteJid, {
                text: isNetworkIssue ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
                    : `Maaf Tuan, Yuuki mengalami kesalahan. Sepertinya ada yang mengganggu Yuuki... ` + error.message
            });
        } catch (e) {
            console.error("Gagal kirim error message:", e);
        }
    }
}

/**
 */
async function handleQuotedMessage(sock, remoteJid, quotedMessage, textAfterCommand, participants, title) {
    const messageType = Object.keys(quotedMessage)[0];

    try {
        if (messageType === "viewOnceMessage" || messageType === "ephemeralMessage" || messageType === "documentWithCaptionMessage") {
            const innerMsg = quotedMessage.viewOnceMessage?.message
                || quotedMessage.ephemeralMessage?.message
                || quotedMessage.documentWithCaptionMessage?.message;
            if (innerMsg) {
                return handleQuotedMessage(sock, remoteJid, innerMsg, textAfterCommand, participants, title);
            }
        }

        if (messageType === "conversation") {
            const quotedText = quotedMessage.conversation;
            const messageText = textAfterCommand || quotedText || `Dengan hormat, Yuuki sampaikan pesan ini kepada semua ${title}~`;
            await sock.sendMessage(remoteJid, { text: messageText, mentions: participants });
            return;
        }

        if (messageType === "extendedTextMessage") {
            const extMsg = quotedMessage.extendedTextMessage;
            const messageText = textAfterCommand || extMsg.text || `Dengan hormat, Yuuki sampaikan pesan ini kepada semua ${title}~`;
            const content = { text: messageText, mentions: participants };
            if (!textAfterCommand && extMsg.matchedText) {
                const lp = { 'matched-text': extMsg.matchedText };
                if (extMsg.jpegThumbnail) lp.jpegThumbnail = extMsg.jpegThumbnail;
                if (extMsg.description) lp.description = extMsg.description;
                if (extMsg.title) lp.title = extMsg.title;
                if (extMsg.thumbnailDirectPath) {
                    lp.highQualityThumbnail = {
                        directPath: extMsg.thumbnailDirectPath,
                        mediaKey: extMsg.mediaKey,
                        mediaKeyTimestamp: extMsg.mediaKeyTimestamp,
                        width: extMsg.thumbnailWidth,
                        height: extMsg.thumbnailHeight,
                        fileSha256: extMsg.thumbnailSha256,
                        fileEncSha256: extMsg.thumbnailEncSha256,
                    };
                }
                content.linkPreview = lp;
            }
            await sock.sendMessage(remoteJid, content);
            return;
        }

        if (messageType === "buttonsMessage") {
            const buttonsText = quotedMessage.buttonsMessage.text || quotedMessage.buttonsMessage.contentText || "";
            const finalText = textAfterCommand || buttonsText || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
            await sock.sendMessage(remoteJid, { text: finalText, mentions: participants });
            return;
        }

        if (messageType === "templateMessage") {
            const templateContent = quotedMessage.templateMessage?.hydratedTemplate?.hydratedContentText
                || quotedMessage.templateMessage?.hydratedTemplate?.hydratedTitle
                || "Pesan template";
            const finalText = textAfterCommand || templateContent || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
            await sock.sendMessage(remoteJid, { text: finalText, mentions: participants });
            return;
        }

        if (messageType === "contactMessage") {
            const contact = quotedMessage.contactMessage;
            await sock.sendMessage(remoteJid, {
                contacts: { displayName: contact.displayName || "Kontak", contacts: [contact] },
                mentions: participants
            });
            return;
        }

        if (messageType === "locationMessage") {
            const location = quotedMessage.locationMessage;
            await sock.sendMessage(remoteJid, {
                location: { degreesLatitude: location.degreesLatitude, degreesLongitude: location.degreesLongitude },
                mentions: participants
            });
            return;
        }

        if (messageType === "pollCreationMessage") {
            const poll = quotedMessage.pollCreationMessage;
            await sock.sendMessage(remoteJid, {
                text: `Poll: ${poll.name}\n\nPilihan:\n${poll.options.map((opt, idx) => `${idx + 1}. ${opt.optionName}`).join('\n')}`,
                mentions: participants
            });
            return;
        }

        if (messageType === "imageMessage" || messageType === "videoMessage") {
            const type = messageType === "imageMessage" ? "image" : "video";
            try {
                const quoted = { message: quotedMessage };
                const buffer = await downloadMediaMessage(quoted, 'buffer', {}, { logger: console });
                const msgData = { [type]: buffer, mentions: participants };
                const origCap = quotedMessage[messageType]?.caption;
                if (textAfterCommand) {
                    msgData.caption = textAfterCommand;
                } else if (origCap) {
                    msgData.caption = origCap;
                }
                await sock.sendMessage(remoteJid, msgData);
                return;
            } catch (error) {
                console.error("[HIDETAG] Download failed:", error.message);
                const errMsg = error?.message || error?.toString() || '';
                if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg)) {
                    await sock.sendMessage(remoteJid, {
                        text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                        mentions: participants
                    });
                    return;
                }
            }
            await sock.sendMessage(remoteJid, {
                text: textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`,
                mentions: participants
            });
            return;
        }

        if (messageType === "documentMessage" || messageType === "documentWithCaptionMessage") {
            const doc = quotedMessage.documentMessage || quotedMessage.documentWithCaptionMessage?.message?.documentMessage;
            if (doc) {
                try {
                    const quoted = { message: quotedMessage };
                    const buffer = await downloadMediaMessage(quoted, 'buffer', {}, { logger: console });
                    const msgData = {
                        document: buffer,
                        fileName: doc.fileName || "document",
                        mimetype: doc.mimetype,
                        mentions: participants
                    };
                    if (textAfterCommand) {
                        msgData.caption = textAfterCommand;
                    } else if (doc.caption) {
                        msgData.caption = doc.caption;
                    }
                    await sock.sendMessage(remoteJid, msgData);
                    return;
                } catch (error) {
                    console.error("[HIDETAG] Document download failed:", error.message);
                    const errMsg = error?.message || error?.toString() || '';
                    if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg)) {
                        await sock.sendMessage(remoteJid, {
                            text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                            mentions: participants
                        });
                        return;
                    }
                }
            }
            const docText = textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
            await sock.sendMessage(remoteJid, { text: docText, mentions: participants });
            return;
        }

        if (messageType === "stickerMessage") {
            try {
                const quoted = { message: quotedMessage };
                const buffer = await downloadMediaMessage(quoted, 'buffer', {}, { logger: console });
                await sock.sendMessage(remoteJid, { sticker: buffer, mentions: participants });
                return;
            } catch (error) {
                console.error("[HIDETAG] Sticker download failed:", error.message);
                const errMsg = error?.message || error?.toString() || '';
                if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg)) {
                    await sock.sendMessage(remoteJid, {
                        text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                        mentions: participants
                    });
                    return;
                }
            }
            const stkText = textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
            await sock.sendMessage(remoteJid, { text: stkText, mentions: participants });
            return;
        }

        if (messageType === "audioMessage") {
            try {
                const quoted = { message: quotedMessage };
                const buffer = await downloadMediaMessage(quoted, 'buffer', {}, { logger: console });
                await sock.sendMessage(remoteJid, { audio: buffer, mentions: participants, mimetype: quotedMessage.audioMessage.mimetype || "audio/mpeg", ptt: quotedMessage.audioMessage.ptt });
                return;
            } catch (error) {
                console.error("[HIDETAG] Audio download failed:", error.message);
                const errMsg = error?.message || error?.toString() || '';
                if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg)) {
                    await sock.sendMessage(remoteJid, {
                        text: 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~',
                        mentions: participants
                    });
                    return;
                }
            }
            const audText = textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
            await sock.sendMessage(remoteJid, { text: audText, mentions: participants });
            return;
        }

        const fakeMsg = {
            message: quotedMessage,
            key: { fromMe: false }
        };
        await sock.sendMessage(remoteJid, {
            forward: fakeMsg,
            mentions: participants
        });

    } catch (error) {
        console.error("Error processing quoted message:", error);
        const errMsg = error?.message || error?.toString() || '';
        const isNetworkIssue = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|ENETUNREACH|EAI_AGAIN/i.test(errMsg);
        const fallbackText = isNetworkIssue ? 'Maaf, Tuan~ Jaringan Yuuki sedang lambat. Silakan coba lagi nanti~'
            : (textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`);
        try {
            await sock.sendMessage(remoteJid, {
                text: fallbackText,
                mentions: participants
            });
        } catch (e) {
            console.error("Gagal kirim fallback pesan:", e);
        }
    }
}

module.exports = { hidetagCommand };