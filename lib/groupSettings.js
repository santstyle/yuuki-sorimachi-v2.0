const prisma = require('./db');

async function getGroupSettings(groupId) {
    let settings = await prisma.groupSettings.findUnique({
        where: { groupId }
    });

    if (!settings) {
        // Create default settings if not exists
        await prisma.group.upsert({
            where: { id: groupId },
            update: {},
            create: { id: groupId, name: 'Unknown Group' }
        });

        settings = await prisma.groupSettings.create({
            data: {
                groupId,
                antilink: false,
                antitoxic: false,
                antibadword: false,
                welcomeMsg: null,
                goodbyeMsg: null,
                muteUntil: null,
                banned: false,
                maxWarnLevel: 3
            }
        });
    }

    return settings;
}

async function updateGroupSetting(groupId, key, value) {
    await getGroupSettings(groupId);

    return await prisma.groupSettings.update({
        where: { groupId },
        data: { [key]: value }
    });
}

async function toggleGroupSetting(groupId, key) {
    await getGroupSettings(groupId);

    const current = await prisma.groupSettings.findUnique({
        where: { groupId },
        select: { [key]: true }
    });

    const newValue = !current[key];

    return await prisma.groupSettings.update({
        where: { groupId },
        data: { [key]: newValue }
    });
}

async function isGroupMuted(groupId) {
    const settings = await getGroupSettings(groupId);
    
    if (!settings.muteUntil) return false;
    
    return settings.muteUntil > new Date();
}

module.exports = {
    getGroupSettings,
    updateGroupSetting,
    toggleGroupSetting,
    isGroupMuted
};
