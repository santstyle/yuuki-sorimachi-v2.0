const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const patchesDir = path.join(__dirname, '..', 'patches');
const rootDir = path.join(__dirname, '..');

const patches = fs.readdirSync(patchesDir).filter(f => f.endsWith('.patch'));

if (patches.length === 0) {
    console.log('No patches found.');
    process.exit(0);
}

for (const patch of patches) {
    const patchPath = path.join(patchesDir, patch);
    try {
        console.log(`Applying ${patch}...`);
        execSync(`git apply "${patchPath}"`, { cwd: rootDir, stdio: 'pipe' });
        console.log(`  ✓ ${patch} applied successfully`);
    } catch (err) {
        const msg = err.stderr?.toString() || err.message;
        if (msg.includes('already applied') || msg.includes('patch does not apply')) {
            if (msg.includes('already applied')) {
                console.log(`  - ${patch} already applied, skipping`);
            } else {
                console.log(`  ✗ ${patch} failed to apply (may already be applied):`);
                console.log(`    ${msg.split('\n')[0]}`);
            }
        } else {
            console.error(`  ✗ ${patch} failed: ${msg.split('\n')[0]}`);
            process.exit(1);
        }
    }
}
