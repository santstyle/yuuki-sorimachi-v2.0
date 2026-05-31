const { spawn } = require('child_process');

const child = spawn('node', ['index.js'], {
    stdio: ['inherit', 'inherit', 'pipe'],
    cwd: __dirname,
});

child.stderr.on('data', (chunk) => {
    const str = chunk.toString();
    if (str.includes('GLib-GObject-CRITICAL') || str.includes('GLib-CRITICAL')) return;
    process.stderr.write(chunk);
});

child.on('exit', (code) => process.exit(code));

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
