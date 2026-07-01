const prisma = require('./db');

async function cleanupHistory(days = 30) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const result = await prisma.history.deleteMany({
        where: {
            createdAt: {
                lt: dateThreshold
            }
        }
    });

    console.log(`[Cleanup] Deleted ${result.count} history records older than ${days} days.`);
    return result.count;
}

async function cleanupInactiveUsers(days = 180) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const result = await prisma.user.deleteMany({
        where: {
            updatedAt: {
                lt: dateThreshold
            },
            isBanned: false
        }
    });

    console.log(`[Cleanup] Deleted ${result.count} inactive users older than ${days} days.`);
    return result.count;
}

async function cleanupWarnings(days = 365) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const result = await prisma.warningRecord.deleteMany({
        where: {
            createdAt: {
                lt: dateThreshold
            }
        }
    });

    console.log(`[Cleanup] Deleted ${result.count} warning records older than ${days} days.`);
    return result.count;
}

async function cleanupLidUsers() {
    const lidUsers = await prisma.user.findMany({
        where: { id: { endsWith: '@lid' } },
        include: { History: true, Progress: true }
    });

    if (lidUsers.length === 0) return 0;

    let merged = 0;
    for (const lidUser of lidUsers) {
        const sameNameUsers = await prisma.user.findMany({
            where: {
                name: lidUser.name,
                id: { endsWith: '@s.whatsapp.net' }
            }
        });

        if (sameNameUsers.length !== 1) continue;

        const phoneUser = sameNameUsers[0];

        // Migrate history
        if (lidUser.History.length > 0) {
            await prisma.history.updateMany({
                where: { userId: lidUser.id },
                data: { userId: phoneUser.id }
            });
        }

        // Merge XP
        if (lidUser.Progress && phoneUser.Progress) {
            const totalXp = phoneUser.Progress.xp + lidUser.Progress.xp;
            const maxLevel = Math.max(phoneUser.Progress.level, lidUser.Progress.level);
            await prisma.userProgress.update({
                where: { userId: phoneUser.id },
                data: { xp: totalXp, level: maxLevel }
            });
            await prisma.userProgress.delete({ where: { userId: lidUser.id } });
        } else if (lidUser.Progress) {
            await prisma.userProgress.update({
                where: { userId: lidUser.id },
                data: { userId: phoneUser.id }
            });
        }

        await prisma.user.delete({ where: { id: lidUser.id } });
        merged++;
    }

    if (merged > 0) {
        console.log(`[Cleanup] Merged ${merged} @lid users → @s.whatsapp.net`);
    }
    return merged;
}

async function performAutoCleanup() {
    console.log('[Cleanup] Starting auto-cleanup process...');
    let totalDeleted = 0;

    try {
        totalDeleted += await cleanupHistory(1);
        totalDeleted += await cleanupInactiveUsers(365);
        totalDeleted += await cleanupWarnings(365);
        totalDeleted += await cleanupLidUsers();
    } catch (error) {
        console.error('[Cleanup] Error during auto-cleanup:', error);
    }

    console.log(`[Cleanup] Auto-cleanup finished. Total records deleted: ${totalDeleted}`);
    return totalDeleted;
}

module.exports = { performAutoCleanup, cleanupHistory, cleanupInactiveUsers, cleanupWarnings, cleanupLidUsers };
