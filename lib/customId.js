const prisma = require('./db');

async function getNextCustomId() {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const max = await prisma.user.findFirst({
                orderBy: { customId: 'desc' },
                select: { customId: true }
            });
            const nextId = max ? max.customId + 1 : 10000000;

            await prisma.user.create({
                data: { id: `__lock_${Date.now()}`, customId: nextId }
            });

            await prisma.user.delete({ where: { customId: nextId } });
            return nextId;
        } catch (e) {
            if (e.code === 'P2002' && i < maxRetries - 1) {
                continue;
            }
            const fallback = Math.floor(Math.random() * 90000000) + 10000000;
            return fallback;
        }
    }
    return Math.floor(Math.random() * 90000000) + 10000000;
}

module.exports = { getNextCustomId };
