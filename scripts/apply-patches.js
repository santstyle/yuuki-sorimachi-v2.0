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
    // Apply first hunk: add destUser after jidDecode
    content = content.replace(
        'const { user, server } = jidDecode(jid);\n        const statusJid = \'status@broadcast\';',
        'const { user, server } = jidDecode(jid);\n        const destUser = user;\n        const statusJid = \'status@broadcast\';'
    );

    // Apply second hunk: change server assignment
    content = content.replace(
        'const server = isMe ? \'s.whatsapp.net\' : isLid ? \'lid\' : \'s.whatsapp.net\';',
        'const isDest = user === destUser;\n                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';'
    );

    // Apply third hunk: skip bare { user } entry if USync already provided device-specific entries
    // Prevents establishing phantom sessions for device 0 that can block delivery
    content = content.replace(
        'for (const { user, device } of devices) {\n                    const isMe = user === meUser;\n                    const isDest = user === destUser;\n                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';',
        'for (const { user, device } of devices) {\n                    if (device === undefined && devices.some(d => d.user === user && d.device !== undefined)) {\n                        continue;\n                    }\n                    const isMe = user === meUser;\n                    const isDest = user === destUser;\n                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';'
    );

    return content;
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
content = applyPatches(content);

fs.writeFileSync(targetFile, content, 'utf8');

const hasDestUser = content.includes('const destUser');
const hasIsDest = content.includes('const isDest');

if (hasDestUser && hasIsDest) {
    console.log('  ✓ Patch applied successfully');
} else {
    console.log(`  ✗ Patch incomplete — destUser: ${hasDestUser}, isDest: ${hasIsDest}`);
}
