const { isJidGroup } = require('@whiskeysockets/baileys');
const { getAntilink, incrementWarningCount, resetWarningCount, isSudo } = require('../lib/index');
const config = require('../config');

const WARN_COUNT = config.WARN_COUNT || 3;

function containsURL(str) {
	const urlRegex = /(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/i;
	return urlRegex.test(str);
}

async function Antilink(msg, sock) {
	const jid = msg.key.remoteJid;
	if (!isJidGroup(jid)) return;

	const SenderMessage = msg.message?.conversation ||
		msg.message?.extendedTextMessage?.text || '';
	if (!SenderMessage || typeof SenderMessage !== 'string') return;

	const sender = msg.key.participant;
	if (!sender) return;

	const isAdmin = await isSudo(sender);
	if (isAdmin) return;

	if (!containsURL(SenderMessage.trim())) return;

	const antilinkConfig = await getAntilink(jid, 'on');
	if (!antilinkConfig) return;

	const action = antilinkConfig.action;

	try {
		await sock.sendMessage(jid, {
			delete: {
				remoteJid: jid,
				fromMe: false,
				id: msg.key.id,
				participant: msg.key.participant || sender
			}
		});

		const senderNum = sender.split('@')[0];

		switch (action) {
			case 'delete':
				await sock.sendMessage(jid, {
					text: `@${senderNum} jangan kirim link di grup ini`,
					mentions: [sender]
				});
				break;

			case 'kick':
				try {
					await sock.groupParticipantsUpdate(jid, [sender], 'remove');
					await sock.sendMessage(jid, {
						text: `@${senderNum} telah dikeluarkan karena mengirim link`,
						mentions: [sender]
					});
				} catch (kickError) {
					console.error('Gagal kick user:', kickError);
					await sock.sendMessage(jid, {
						text: `@${senderNum} jangan kirim link di grup ini`,
						mentions: [sender]
					});
				}
				break;

			case 'warn':
				const warningCount = await incrementWarningCount(jid, sender);
				if (warningCount >= WARN_COUNT) {
					try {
						await sock.groupParticipantsUpdate(jid, [sender], 'remove');
						await resetWarningCount(jid, sender);
						await sock.sendMessage(jid, {
							text: `@${senderNum} telah dikeluarkan karena mengirim link (${WARN_COUNT}/${WARN_COUNT} warning)`,
							mentions: [sender]
						});
					} catch (kickError) {
						console.error('Gagal kick user:', kickError);
						await sock.sendMessage(jid, {
							text: `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk mengirim link`,
							mentions: [sender]
						});
					}
				} else {
					await sock.sendMessage(jid, {
						text: `@${senderNum} peringatan ${warningCount}/${WARN_COUNT} untuk mengirim link`,
						mentions: [sender]
					});
				}
				break;
		}
	} catch (error) {
		console.error('Error in Antilink:', error);
	}
}

module.exports = { Antilink };
