const path = require('path');
const fs = require('fs');

const patchesDir = path.join(__dirname, '..', 'patches');
const rootDir = path.join(__dirname, '..');

// Reset Baileys messages-send.js ke original dulu (kalo patch sebelumnya pernah diapply)
function revertPatches() {
    const targetFile = path.join(rootDir, 'node_modules/@whiskeysockets/baileys/lib/Socket/messages-send.js');
    if (!fs.existsSync(targetFile)) return;

    let content = fs.readFileSync(targetFile, 'utf8');

    // Revert first hunk: remove destUser line
    content = content.replace(/\n\s+const destUser = user;\n/, '\n');

    // Revert second hunk: undo server assignment change
    content = content.replace(
        /const isDest = user === destUser;\n\s+const server = isMe \? 's\.whatsapp\.net' : \(isDest && isLid\) \? 'lid' : 's\.whatsapp\.net';/,
        `const server = isMe ? 's.whatsapp.net' : isLid ? 'lid' : 's.whatsapp.net';`
    );

    fs.writeFileSync(targetFile, content, 'utf8');
}

revertPatches();

// Apply patches
const patches = fs.readdirSync(patchesDir).filter(f => f.endsWith('.patch'));
if (patches.length === 0) {
    console.log('No patches found.');
    process.exit(0);
}

for (const patch of patches) {
    console.log(`Applying ${patch}...`);
    const patchPath = path.join(patchesDir, patch);

    if (patch === 'baileys-messages-send.patch') {
        const targetFile = path.join(rootDir, 'node_modules/@whiskeysockets/baileys/lib/Socket/messages-send.js');
        if (!fs.existsSync(targetFile)) {
            console.log(`  ✗ target not found: ${targetFile}`);
            continue;
        }

        let content = fs.readFileSync(targetFile, 'utf8');

        // Apply first hunk: add destUser after jidDecode
        content = content.replace(
            'const { user, server } = jidDecode(jid);\n' +
            '        const statusJid = \'status@broadcast\';',
            'const { user, server } = jidDecode(jid);\n' +
            '        const destUser = user;\n' +
            '        const statusJid = \'status@broadcast\';'
        );

        // Apply second hunk: change server assignment
        content = content.replace(
            'const server = isMe ? \'s.whatsapp.net\' : isLid ? \'lid\' : \'s.whatsapp.net\';',
            'const isDest = user === destUser;\n' +
            '                    const server = isMe ? \'s.whatsapp.net\' : (isDest && isLid) ? \'lid\' : \'s.whatsapp.net\';'
        );

        fs.writeFileSync(targetFile, content, 'utf8');
        console.log(`  ✓ ${patch} applied successfully`);
    } else {
        console.log(`  ✗ unknown patch: ${patch}`);
    }
}
