const prisma = require('./db');

function getXPForNextLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

async function addXP(userId, amount = 10, userName = null) {
    try {
        const progress = await prisma.userProgress.upsert({
            where: { userId },
            update: {
                xp: { increment: amount },
                lastActive: new Date(),
                userName: userName || undefined
            },
            create: {
                userId,
                xp: amount,
                level: 1,
                userName: userName
            }
        });

        let leveledUp = false;
        let currentXP = progress.xp;
        let currentLevel = progress.level;
        let requiredXP = getXPForNextLevel(currentLevel);

        while (currentXP >= requiredXP) {
            currentXP -= requiredXP;
            currentLevel++;
            requiredXP = getXPForNextLevel(currentLevel);
            leveledUp = true;
        }

        if (leveledUp) {
            await prisma.userProgress.update({
                where: { userId },
                data: { level: currentLevel, xp: currentXP }
            });
            return { leveledUp: true, level: currentLevel, currentXP, requiredXP };
        }

        return { leveledUp: false, level: currentLevel, currentXP, requiredXP };
    } catch (error) {
        console.error('Error adding XP:', error);
        return null;
    }
}

async function getProgress(userId) {
    return await prisma.userProgress.findUnique({
        where: { userId }
    });
}

module.exports = { addXP, getProgress, getXPForNextLevel };
