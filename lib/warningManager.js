const prisma = require('./db');
const { getGroupSettings } = require('./groupSettings');

async function addWarning(userId, userName, groupId, reason, proofMsgId, moderatorId, moderatorName) {
    if (groupId) await getGroupSettings(groupId);
    return await prisma.warningRecord.create({
        data: {
            userId,
            userName,
            groupId,
            reason,
            proofMsgId,
            moderatorId,
            moderatorName
        }
    });
}

async function getWarningsByUser(userId, groupId) {
    const where = { userId };
    if (groupId) {
        where.groupId = groupId;
    }

    return await prisma.warningRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            groupSettings: {
                select: { maxWarnLevel: true }
            }
        }
    });
}

async function getWarningCount(userId, groupId) {
    const where = { userId };
    if (groupId) {
        where.groupId = groupId;
    }

    return await prisma.warningRecord.count({ where });
}

async function clearWarnings(userId, groupId) {
    const where = { userId };
    if (groupId) {
        where.groupId = groupId;
    }

    await prisma.warningRecord.deleteMany({ where });
}

async function getMaxWarnLevel(groupId) {
    const settings = await prisma.groupSettings.findUnique({
        where: { groupId },
        select: { maxWarnLevel: true }
    });

    return settings ? settings.maxWarnLevel : 3;
}

module.exports = {
    addWarning,
    getWarningsByUser,
    getWarningCount,
    clearWarnings,
    getMaxWarnLevel
};
