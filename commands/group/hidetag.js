const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

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
            const imageStream = await downloadContentFromMessage(m.message.imageMessage, "image");
            let imageBuffer = Buffer.from([]);
            for await (const chunk of imageStream) {
                imageBuffer = Buffer.concat([imageBuffer, chunk]);
            }
            await sock.sendMessage(m.key.remoteJid, {
                image: imageBuffer,
                caption: textAfterCommand || `Dengan hormat, Yuuki memanggil semua anggota di sini`,
                mentions: participants
            });
        } else if (m.message?.videoMessage) {
            const videoStream = await downloadContentFromMessage(m.message.videoMessage, "video");
            let videoBuffer = Buffer.from([]);
            for await (const chunk of videoStream) {
                videoBuffer = Buffer.concat([videoBuffer, chunk]);
            }
            await sock.sendMessage(m.key.remoteJid, {
                video: videoBuffer,
                caption: textAfterCommand || `Dengan hormat, Yuuki memanggil semua anggota di sini`,
                mentions: participants
            });
        } else if (m.message?.documentMessage || m.message?.documentWithCaptionMessage) {
            const doc = m.message?.documentMessage || m.message?.documentWithCaptionMessage?.message?.documentMessage;
            if (doc) {
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
            await sock.sendMessage(m.key.remoteJid, {
                text: `Maaf Tuan, Yuuki mengalami kesalahan. Sepertinya ada yang mengganggu Yuuki... ` + error.message
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
        switch (messageType) {
            case "conversation":
                const quotedText = quotedMessage.conversation;
                const messageText = textAfterCommand || quotedText || `Dengan hormat, Yuuki sampaikan pesan ini kepada semua ${title}~`;
                await sock.sendMessage(remoteJid, {
                    text: messageText,
                    mentions: participants
                });
                break;

            case "extendedTextMessage":
                const extendedText = quotedMessage.extendedTextMessage.text;
                const extendedMessageText = textAfterCommand || extendedText || `Dengan hormat, Yuuki sampaikan pesan ini kepada semua ${title}~`;
                await sock.sendMessage(remoteJid, {
                    text: extendedMessageText,
                    mentions: participants
                });
                break;

            case "imageMessage":
                const imageStream = await downloadContentFromMessage(quotedMessage.imageMessage, "image");
                let imageBuffer = Buffer.from([]);
                for await (const chunk of imageStream) {
                    imageBuffer = Buffer.concat([imageBuffer, chunk]);
                }
                const imageCaption = textAfterCommand || quotedMessage.imageMessage.caption || "";

                await sock.sendMessage(remoteJid, {
                    image: imageBuffer,
                    caption: imageCaption,
                    mentions: participants
                });
                break;

            case "videoMessage":
                const videoStream = await downloadContentFromMessage(quotedMessage.videoMessage, "video");
                let videoBuffer = Buffer.from([]);
                for await (const chunk of videoStream) {
                    videoBuffer = Buffer.concat([videoBuffer, chunk]);
                }
                const videoCaption = textAfterCommand || quotedMessage.videoMessage.caption || "";

                await sock.sendMessage(remoteJid, {
                    video: videoBuffer,
                    caption: videoCaption,
                    mentions: participants
                });
                break;

            case "audioMessage":
                const audioStream = await downloadContentFromMessage(quotedMessage.audioMessage, "audio");
                let audioBuffer = Buffer.from([]);
                for await (const chunk of audioStream) {
                    audioBuffer = Buffer.concat([audioBuffer, chunk]);
                }

                await sock.sendMessage(remoteJid, {
                    audio: audioBuffer,
                    mimetype: quotedMessage.audioMessage.mimetype || 'audio/mpeg',
                    mentions: participants
                });
                break;

            case "documentMessage":
                const documentStream = await downloadContentFromMessage(quotedMessage.documentMessage, "document");
                let documentBuffer = Buffer.from([]);
                for await (const chunk of documentStream) {
                    documentBuffer = Buffer.concat([documentBuffer, chunk]);
                }
                const documentFileName = quotedMessage.documentMessage.fileName || "document";

                await sock.sendMessage(remoteJid, {
                    document: documentBuffer,
                    fileName: documentFileName,
                    mimetype: quotedMessage.documentMessage.mimetype,
                    mentions: participants
                });
                break;

            case "stickerMessage":
                const stickerStream = await downloadContentFromMessage(quotedMessage.stickerMessage, "sticker");
                let stickerBuffer = Buffer.from([]);
                for await (const chunk of stickerStream) {
                    stickerBuffer = Buffer.concat([stickerBuffer, chunk]);
                }

                await sock.sendMessage(remoteJid, {
                    sticker: stickerBuffer,
                    mentions: participants
                });
                break;

            case "contactMessage":
                const contact = quotedMessage.contactMessage;
                await sock.sendMessage(remoteJid, {
                    contacts: {
                        displayName: contact.displayName || "Kontak",
                        contacts: [contact]
                    },
                    mentions: participants
                });
                break;

            case "locationMessage":
                const location = quotedMessage.locationMessage;
                await sock.sendMessage(remoteJid, {
                    location: {
                        degreesLatitude: location.degreesLatitude,
                        degreesLongitude: location.degreesLongitude
                    },
                    mentions: participants
                });
                break;

            case "pollCreationMessage":
                const poll = quotedMessage.pollCreationMessage;
                await sock.sendMessage(remoteJid, {
                    text: `Poll: ${poll.name}\n\nPilihan:\n${poll.options.map((opt, idx) => `${idx + 1}. ${opt.optionName}`).join('\n')}`,
                    mentions: participants
                });
                break;

            case "ephemeralMessage":
                const ephemeralContent = quotedMessage.ephemeralMessage.message;
                await handleQuotedMessage(sock, remoteJid, ephemeralContent, textAfterCommand, participants, title);
                break;

            case "viewOnceMessage":
                const viewOnceContent = quotedMessage.viewOnceMessage.message;
                await handleQuotedMessage(sock, remoteJid, viewOnceContent, textAfterCommand, participants, title);
                break;

            case "buttonsMessage":
                const buttonsText = quotedMessage.buttonsMessage.text || quotedMessage.buttonsMessage.contentText || "";
                const finalText = textAfterCommand || buttonsText || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
                await sock.sendMessage(remoteJid, {
                    text: finalText,
                    mentions: participants
                });
                break;

            case "templateMessage":
                const templateContent = quotedMessage.templateMessage?.hydratedTemplate?.hydratedContentText ||
                    quotedMessage.templateMessage?.hydratedTemplate?.hydratedTitle ||
                    "Pesan template";
                const templateFinalText = textAfterCommand || templateContent || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
                await sock.sendMessage(remoteJid, {
                    text: templateFinalText,
                    mentions: participants
                });
                break;

            case "documentWithCaptionMessage":
                const innerContent = quotedMessage.documentWithCaptionMessage.message;
                await handleQuotedMessage(sock, remoteJid, innerContent, textAfterCommand, participants, title);
                break;

            default:
                console.log("[HIDETAG] Unsupported:", messageType);
                const fallbackText = textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
                await sock.sendMessage(remoteJid, {
                    text: fallbackText,
                    mentions: participants
                });
                break;
        }
    } catch (error) {
        console.error("Error processing quoted message:", error);
        const fallbackText = textAfterCommand || `Dengan hormat, Yuuki sampaikan ini kepada semua ${title}~`;
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