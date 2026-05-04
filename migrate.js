const fs = require('fs');
const prisma = require('./lib/db');

async function migrate() {
    console.log('Starting migration from banned.json to SQLite...');
    try {
        if (!fs.existsSync('./data/banned.json')) {
            console.log('No banned.json found. Skipping migration.');
            return;
        }

        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json', 'utf8'));
        
        if (bannedUsers.length === 0) {
            console.log('banned.json is empty. Skipping migration.');
            return;
        }

        for (const userId of bannedUsers) {
            await prisma.user.upsert({
                where: { id: userId },
                update: { isBanned: true },
                create: { id: userId, isBanned: true }
            });
            console.log(`Migrated banned user: ${userId}`);
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
