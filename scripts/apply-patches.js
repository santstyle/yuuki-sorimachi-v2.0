const path = require('path');
const fs = require('fs');

const patchesDir = path.join(__dirname, '..', 'patches');
const rootDir = path.join(__dirname, '..');

// Reset Baileys messages-send.js ke original dulu (kalo patch sebelumnya pernah diapply)
function revertPatches(content) {
    // Revert third hunk: remove bare-device skip
    content = content.replace(/\n\s+if \(device === undefined && devices\.some\(d => d\.user === user && d\.device !== undefined\)\) \{\n\s+continue;\n\s+}/, '');

    // Revert first hunk: remove destUser line
    content = content.replace(/\n\s+const destUser = user;\n/, '\n');

    // Revert second hunk: undo server assignment change
    content = content.replace(
        /const isDest = user === destUser;\n\s+const server = isMe \? 's\.whatsapp\.net' : \(isDest && isLid\) \? 'lid' : 's\.whatsapp\.net';/,
        `const server = isMe ? 's.whatsapp.net' : isLid ? 'lid' : 's.whatsapp.net';`
    );

    return content;
}

function applyPatches(content) {
    const results = {};

    // Apply first hunk: add destUser after jidDecode
    const h1Before = content;
    content = content.replace(
        'const { user, server } = jidDecode(jid);\n        const statusJid = \'status@broadcast\';',
        'const { user, server } = jidDecode(jid);\n        const destUser = user;\n        const statusJid = \'status@broadcast\';'
    );
    results['hunk1_destUser'] = content !== h1Before;

    // Apply second hunk: change server assignment
    const h2Before = content;
    content = content.replace(
        'const server = isMe ? \'s.whatsapp.net\' : isLid ? \'lid\' : \'s.whatsapp.net\';',
        'const isDest = user === destUser;\n                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';'
    );
    results['hunk2_isDest'] = content !== h2Before;

    // Apply third hunk: skip bare { user } entry if USync already provided device-specific entries
    const h3Before = content;
    content = content.replace(
        'for (const { user, device } of devices) {\n                    const isMe = user === meUser;\n                    const isDest = user === destUser;\n                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';',
        'for (const { user, device } of devices) {\n                    if (device === undefined && devices.some(d => d.user === user && d.device !== undefined)) {\n                        continue;\n                    }\n                    const isMe = user === meUser;\n                    const isDest = user === destUser;\n                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';'
    );
    results['hunk3_bareDeviceSkip'] = content !== h3Before;

    // Apply fourth hunk: debug logging after createParticipantNodes
    const h4Before = content;
    content = content.replace(
        'participants.push(...meNodes);\n                participants.push(...otherNodes);\n                shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;',
        'participants.push(...meNodes);\n                participants.push(...otherNodes);\n                shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;\n                if (!isGroup) {\n                    const participantJids = participants.map(p => p?.attrs?.jid).filter(Boolean);\n                    console.log(`[RELAY DEBUG] isLid=${isLid} isGroup=${isGroup} to=${destinationJid} participants=${participantJids.length} jids=[${participantJids.join(\", \")}]`);\n                }'
    );
    results['hunk4_relayDebug1'] = content !== h4Before;

    // Apply fifth hunk: debug logging before sendNode
    const h5Before = content;
    content = content.replace(
        'await sendNode(stanza);',
        'if (!isGroup) { const encTypes = []; for (const p of participants) { const enc = p?.content?.[0]; encTypes.push(`${p?.attrs?.jid}:${enc?.attrs?.type || \'?\'}`); } console.log(`[RELAY DEBUG] SEND to=${stanza.attrs.to} enc=[${encTypes.join(\", \")}] id=${stanza.attrs.id}`); }\n            await sendNode(stanza);'
    );
    results['hunk5_relayDebug2'] = content !== h5Before;

    return { content, results };
}

const targetFile = path.join(rootDir, 'node_modules/@whiskeysockets/baileys/lib/Socket/messages-send.js');
if (!fs.existsSync(targetFile)) {
    console.log(`✗ target not found: ${targetFile}`);
    process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF → LF so replacements work consistently on Windows & Linux
content = content.replace(/\r\n/g, '\n');

content = revertPatches(content);
const { content: patchedContent, results } = applyPatches(content);
content = patchedContent;

fs.writeFileSync(targetFile, content, 'utf8');

// Report per-hunk results
for (const [name, ok] of Object.entries(results)) {
    console.log(`  ${ok ? '✓' : '✗'} ${name}`);
}

const hasDestUser = content.includes('const destUser');
const hasIsDest = content.includes('const isDest');
const hasBareDeviceSkip = content.includes('device === undefined && devices.some');
const hasRelayDebug1 = content.includes('[RELAY DEBUG]');
const hasRelayDebug2 = content.includes('isGroup) { const encTypes');

console.log('');
if (hasDestUser && hasIsDest && hasBareDeviceSkip) {
    console.log('  ✓ Core patches applied successfully');
} else {
    console.log(`  ✗ Core patches incomplete — destUser: ${hasDestUser}, isDest: ${hasIsDest}, bareDeviceSkip: ${hasBareDeviceSkip}`);
}
if (hasRelayDebug1 || hasRelayDebug2) {
    console.log('  ✓ Debug logs present');
} else {
    console.log('  ✗ Debug logs not found');
}
