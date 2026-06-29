const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');
const targetFile = path.join(rootDir, 'node_modules/@whiskeysockets/baileys/lib/Socket/messages-send.js');

if (!fs.existsSync(targetFile)) {
    console.log(`✗ target not found: ${targetFile}`);
    process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace(/\r\n/g, '\n');

// ===== REVERT ALL PATCHES (clean slate) =====
function revertAll(content) {
    // Revert hunk 5: remove debug log before sendNode
    content = content.replace(
        /if \(!isGroup\) \{ const encTypes = \[\];[\s\S]*?console\.log\(`\[RELAY DEBUG\] SEND[^`]*`\); \}\n            /,
        ''
    );

    // Revert hunk 4: remove debug log after shouldIncludeDeviceIdentity
    content = content.replace(
        /shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity \|\| s1 \|\| s2;\n                if \(!isGroup\) \{[\s\S]*?console\.log\(`\[RELAY DEBUG\] isLid[^`]*`\);\n                \}/,
        'shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;'
    );

    // Revert hunk 3: remove bare device skip
    content = content.replace(
        /if \(device === undefined && devices\.some\(d => d\.user === user && d\.device !== undefined\)\) \{\n\s+continue;\n\s+\}\n/,
        ''
    );

    // Revert hunk 1: remove destUser line
    content = content.replace(/\n\s+const destUser = user;\n/, '\n');

    return content;
}

// ===== APPLY PATCHES =====
function applyPatches(content) {
    const results = {};

    // Hunk 1: add destUser after jidDecode(jid) — used for LID resolution
    const h1Before = content;
    content = content.replace(
        'const { user, server } = jidDecode(jid);\n        const statusJid = \'status@broadcast\';',
        'const { user, server } = jidDecode(jid);\n        const destUser = user;\n        const statusJid = \'status@broadcast\';'
    );
    results['hunk1_destUser'] = content !== h1Before;

    // Hunk 2: REMOVED — old Baileys had `const server = isMe ? ...` which no longer exists
    // Code now uses jidEncode() directly, no server assignment to patch
    results['hunk2_isDest'] = 'skipped (not needed)';

    // Hunk 3: skip bare { user } entry if USync already provided device-specific entries
    // Prevents phantom device-0 sessions that cause error 463
    const h3Before = content;
    content = content.replace(
        'for (const { user, device } of devices) {\n                    const isMe = user === meUser;\n                    const jid = jidEncode(isMe && isLid ? authState.creds?.me?.lid.split(\':\')[0] || user : user, isLid ? \'lid\' : \'s.whatsapp.net\', device);',
        'for (const { user, device } of devices) {\n                    if (device === undefined && devices.some(d => d.user === user && d.device !== undefined)) {\n                        continue;\n                    }\n                    const isMe = user === meUser;\n                    const jid = jidEncode(isMe && isLid ? authState.creds?.me?.lid.split(\':\')[0] || user : user, isLid ? \'lid\' : \'s.whatsapp.net\', device);'
    );
    results['hunk3_bareDeviceSkip'] = content !== h3Before;

    // Hunk 4: debug logging after createParticipantNodes
    const h4Before = content;
    content = content.replace(
        'participants.push(...meNodes);\n                participants.push(...otherNodes);\n                shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;',
        'participants.push(...meNodes);\n                participants.push(...otherNodes);\n                shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;\n                if (!isGroup) {\n                    const participantJids = participants.map(p => p?.attrs?.jid).filter(Boolean);\n                    console.log(`[RELAY DEBUG] isLid=${isLid} isGroup=${isGroup} to=${destinationJid} participants=${participantJids.length} jids=[${participantJids.join(\", \")}]`);\n                }'
    );
    results['hunk4_relayDebug1'] = content !== h4Before;

    // Hunk 5: debug logging before sendNode (encryption types + stanza details)
    const h5Before = content;
    content = content.replace(
        'await sendNode(stanza);',
        'if (!isGroup) { const encTypes = []; for (const p of participants) { const enc = p?.content?.[0]; encTypes.push(`${p?.attrs?.jid}:${enc?.attrs?.type || \'?\'}`); } console.log(`[RELAY DEBUG] SEND to=${stanza.attrs.to} enc=[${encTypes.join(\", \")}] id=${stanza.attrs.id}`); }\n            await sendNode(stanza);'
    );
    results['hunk5_relayDebug2'] = content !== h5Before;

    return { content, results };
}

// ===== EXECUTE =====
content = revertAll(content);
const { content: patchedContent, results } = applyPatches(content);
content = patchedContent;

fs.writeFileSync(targetFile, content, 'utf8');

// ===== REPORT =====
console.log('');
for (const [name, ok] of Object.entries(results)) {
    if (ok === 'skipped (not needed)') {
        console.log(`  ⊘ ${name} — ${ok}`);
    } else {
        console.log(`  ${ok ? '✓' : '✗'} ${name}`);
    }
}

const hasDestUser = content.includes('const destUser');
const hasBareDeviceSkip = content.includes('device === undefined && devices.some');
const hasRelayDebug = content.includes('[RELAY DEBUG]');

console.log('');
if (hasDestUser && hasBareDeviceSkip) {
    console.log('  ✓ Core patches applied successfully');
} else {
    console.log(`  ✗ Core patches incomplete — destUser: ${hasDestUser}, bareDeviceSkip: ${hasBareDeviceSkip}`);
}
if (hasRelayDebug) {
    console.log('  ✓ Debug logs present');
} else {
    console.log('  ✗ Debug logs not found');
}
