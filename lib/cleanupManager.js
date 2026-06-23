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

async function performAutoCleanup() {
    console.log('[Cleanup] Starting auto-cleanup process...');
    let totalDeleted = 0;

    try {
        totalDeleted += await cleanupHistory(30);
        totalDeleted += await cleanupInactiveUsers(365);
        totalDeleted += await cleanupWarnings(365);
    } catch (error) {
        console.error('[Cleanup] Error during auto-cleanup:', error);
    }

    console.log(`[Cleanup] Auto-cleanup finished. Total records deleted: ${totalDeleted}`);
    return totalDeleted;
}

module.exports = { performAutoCleanup, cleanupHistory, cleanupInactiveUsers, cleanupWarnings };
