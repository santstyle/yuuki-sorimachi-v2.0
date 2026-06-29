const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeLidUser(lidJid, phoneJid) {
    const lidUser = await prisma.user.findUnique({ where: { id: lidJid }, include: { History: true, Progress: true } });
    const phoneUser = await prisma.user.findUnique({ where: { id: phoneJid }, include: { History: true, Progress: true } });

    if (!lidUser) return;
    if (!phoneUser) {
        // No phone user exists, just rename the LID entry
        await prisma.user.update({ where: { id: lidJid }, data: { id: phoneJid } });
        await prisma.history.updateMany({ where: { userId: lidJid }, data: { userId: phoneJid } });
        const progress = await prisma.userProgress.findUnique({ where: { userId: lidJid } });
        if (progress) await prisma.userProgress.update({ where: { userId: lidJid }, data: { userId: phoneJid } });
        console.log(`  Renamed ${lidJid} → ${phoneJid}`);
        return;
    }

    // Both exist — merge: keep phone user, migrate history, merge XP
    if (lidUser.History.length > 0) {
        await prisma.history.updateMany({ where: { userId: lidJid }, data: { userId: phoneJid } });
        console.log(`  Migrated ${lidUser.History.length} history records from LID → phone`);
    }

    if (lidUser.Progress && phoneUser.Progress) {
        // Both have progress — merge XP
        const totalXp = phoneUser.Progress.xp + lidUser.Progress.xp;
        const maxLevel = Math.max(phoneUser.Progress.level, lidUser.Progress.level);
        await prisma.userProgress.update({ where: { userId: phoneJid }, data: { xp: totalXp, level: maxLevel } });
        console.log(`  Merged XP: ${lidUser.Progress.xp} + ${phoneUser.Progress.xp} = ${totalXp}, level: ${maxLevel}`);
        await prisma.userProgress.delete({ where: { userId: lidJid } });
    } else if (lidUser.Progress) {
        await prisma.userProgress.update({ where: { userId: lidJid }, data: { userId: phoneJid } });
    }

    // Delete duplicate LID user
    await prisma.user.delete({ where: { id: lidJid } });
    console.log(`  Merged ${lidJid} → ${phoneJid} (deleted LID duplicate)`);
}

async function main() {
    console.log('=== Merge LID Users ===\n');

    // Find users with LID JIDs
    const lidUsers = await prisma.user.findMany({
        where: { id: { endsWith: '@lid' } },
        select: { id: true, name: true, customId: true }
    });

    console.log(`Found ${lidUsers.length} LID users\n`);

    let merged = 0;
    for (const lidUser of lidUsers) {
        // Try to find corresponding phone user via signalRepository
        // Since we can't access signalRepository here, we'll check the database
        // for any phone JID users with the same name
        const sameNameUsers = await prisma.user.findMany({
            where: {
                name: lidUser.name,
                id: { endsWith: '@s.whatsapp.net' }
            }
        });

        if (sameNameUsers.length === 1) {
            console.log(`Merging ${lidUser.id} (${lidUser.name}) → ${sameNameUsers[0].id}`);
            await mergeLidUser(lidUser.id, sameNameUsers[0].id);
            merged++;
        }
    }

    console.log(`\nDone! Merged ${merged} duplicate users.`);

    // Show final count
    const total = await prisma.user.count();
    console.log(`Total users now: ${total}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
